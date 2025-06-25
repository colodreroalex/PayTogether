const { query, transaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Expense {
  // Crear un nuevo gasto
  static async create({ description, amount, categoryId, groupId, paidBy, splitBetween }) {
    return await transaction(async (client) => {
      const expenseId = uuidv4();
      
      // Crear el gasto
      const expenseResult = await client.query(
        `INSERT INTO expenses (id, description, amount, category_id, group_id, paid_by, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
         RETURNING *`,
        [expenseId, description, amount, categoryId, groupId, paidBy]
      );
      
      // Calcular el monto por persona
      const amountPerPerson = amount / splitBetween.length;
      
      // Crear las divisiones del gasto
      for (const userId of splitBetween) {
        await client.query(
          `INSERT INTO expense_splits (id, expense_id, user_id, amount, created_at) 
           VALUES ($1, $2, $3, $4, NOW())`,
          [uuidv4(), expenseId, userId, amountPerPerson]
        );
      }
      
      return expenseResult.rows[0];
    });
  }

  // Buscar gasto por ID con sus divisiones
  static async findById(id) {
    const expenseResult = await query(
      `SELECT e.*, c.name as category_name, u.name as paid_by_name
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN users u ON e.paid_by = u.id
       WHERE e.id = $1 AND e.deleted_at IS NULL`,
      [id]
    );
    
    if (!expenseResult.rows[0]) {
      return null;
    }
    
    const splitsResult = await query(
      `SELECT es.*, u.name as user_name
       FROM expense_splits es
       JOIN users u ON es.user_id = u.id
       WHERE es.expense_id = $1 AND es.deleted_at IS NULL`,
      [id]
    );
    
    return {
      ...expenseResult.rows[0],
      splits: splitsResult.rows
    };
  }

  // Obtener gastos de un grupo
  static async findByGroupId(groupId, filters = {}) {
    let whereClause = 'WHERE e.group_id = $1 AND e.deleted_at IS NULL';
    let params = [groupId];
    let paramCount = 2;
    
    // Filtro por categoría
    if (filters.categoryId) {
      whereClause += ` AND e.category_id = $${paramCount}`;
      params.push(filters.categoryId);
      paramCount++;
    }
    
    // Filtro por usuario que pagó
    if (filters.paidBy) {
      whereClause += ` AND e.paid_by = $${paramCount}`;
      params.push(filters.paidBy);
      paramCount++;
    }
    
    // Filtro por rango de fechas
    if (filters.startDate) {
      whereClause += ` AND e.created_at >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }
    
    if (filters.endDate) {
      whereClause += ` AND e.created_at <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }
    
    // Filtro por descripción
    if (filters.description) {
      whereClause += ` AND e.description ILIKE $${paramCount}`;
      params.push(`%${filters.description}%`);
      paramCount++;
    }
    
    const result = await query(
      `SELECT e.*, c.name as category_name, u.name as paid_by_name
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN users u ON e.paid_by = u.id
       ${whereClause}
       ORDER BY e.created_at DESC
       LIMIT ${filters.limit || 100}
       OFFSET ${filters.offset || 0}`,
      params
    );
    
    return result.rows;
  }

  // Actualizar gasto
  static async update(id, { description, amount, categoryId }, userId) {
    // Verificar que el usuario sea quien pagó o admin del grupo
    const expenseCheck = await query(
      `SELECT e.paid_by, gm.role
       FROM expenses e
       JOIN group_members gm ON e.group_id = gm.group_id
       WHERE e.id = $1 AND gm.user_id = $2 AND e.deleted_at IS NULL AND gm.deleted_at IS NULL`,
      [id, userId]
    );
    
    if (!expenseCheck.rows[0] || 
        (expenseCheck.rows[0].paid_by !== userId && expenseCheck.rows[0].role !== 'admin')) {
      throw new Error('No tienes permisos para actualizar este gasto');
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    if (description) {
      fields.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (amount) {
      fields.push(`amount = $${paramCount}`);
      values.push(amount);
      paramCount++;
    }

    if (categoryId) {
      fields.push(`category_id = $${paramCount}`);
      values.push(categoryId);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE expenses SET ${fields.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Eliminar gasto (soft delete)
  static async delete(id, userId) {
    // Verificar que el usuario sea quien pagó o admin del grupo
    const expenseCheck = await query(
      `SELECT e.paid_by, gm.role
       FROM expenses e
       JOIN group_members gm ON e.group_id = gm.group_id
       WHERE e.id = $1 AND gm.user_id = $2 AND e.deleted_at IS NULL AND gm.deleted_at IS NULL`,
      [id, userId]
    );
    
    if (!expenseCheck.rows[0] || 
        (expenseCheck.rows[0].paid_by !== userId && expenseCheck.rows[0].role !== 'admin')) {
      throw new Error('No tienes permisos para eliminar este gasto');
    }

    return await transaction(async (client) => {
      // Eliminar las divisiones del gasto
      await client.query(
        'UPDATE expense_splits SET deleted_at = NOW() WHERE expense_id = $1 AND deleted_at IS NULL',
        [id]
      );
      
      // Eliminar el gasto
      const result = await client.query(
        'UPDATE expenses SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
        [id]
      );
      
      return result.rows[0];
    });
  }

  // Calcular balances de un grupo
  static async calculateGroupBalances(groupId) {
    const result = await query(
      `SELECT 
         u.id as user_id,
         u.name as user_name,
         COALESCE(paid.total_paid, 0) as total_paid,
         COALESCE(owed.total_owed, 0) as total_owed,
         COALESCE(paid.total_paid, 0) - COALESCE(owed.total_owed, 0) as balance
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       LEFT JOIN (
         SELECT paid_by, SUM(amount) as total_paid
         FROM expenses
         WHERE group_id = $1 AND deleted_at IS NULL
         GROUP BY paid_by
       ) paid ON u.id = paid.paid_by
       LEFT JOIN (
         SELECT es.user_id, SUM(es.amount) as total_owed
         FROM expense_splits es
         JOIN expenses e ON es.expense_id = e.id
         WHERE e.group_id = $1 AND e.deleted_at IS NULL AND es.deleted_at IS NULL
         GROUP BY es.user_id
       ) owed ON u.id = owed.user_id
       WHERE gm.group_id = $1 AND gm.deleted_at IS NULL AND u.deleted_at IS NULL
       ORDER BY u.name`,
      [groupId]
    );
    
    return result.rows;
  }

  // Calcular deudas simplificadas de un grupo
  static async calculateGroupDebts(groupId) {
    const balances = await this.calculateGroupBalances(groupId);
    
    const creditors = balances.filter(b => parseFloat(b.balance) > 0.01)
                             .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
    const debtors = balances.filter(b => parseFloat(b.balance) < -0.01)
                           .sort((a, b) => parseFloat(a.balance) - parseFloat(b.balance));
    
    const debts = [];
    let i = 0, j = 0;
    
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      
      const amount = Math.min(parseFloat(creditor.balance), Math.abs(parseFloat(debtor.balance)));
      
      if (amount > 0.01) {
        debts.push({
          from_user_id: debtor.user_id,
          from_user_name: debtor.user_name,
          to_user_id: creditor.user_id,
          to_user_name: creditor.user_name,
          amount: Math.round(amount * 100) / 100
        });
      }
      
      creditor.balance = (parseFloat(creditor.balance) - amount).toString();
      debtor.balance = (parseFloat(debtor.balance) + amount).toString();
      
      if (parseFloat(creditor.balance) < 0.01) i++;
      if (parseFloat(debtor.balance) > -0.01) j++;
    }
    
    return debts;
  }

  // Obtener estadísticas de gastos por categoría
  static async getCategoryStats(groupId, startDate, endDate) {
    let whereClause = 'WHERE e.group_id = $1 AND e.deleted_at IS NULL';
    let params = [groupId];
    let paramCount = 2;
    
    if (startDate) {
      whereClause += ` AND e.created_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }
    
    if (endDate) {
      whereClause += ` AND e.created_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }
    
    const result = await query(
      `SELECT 
         c.id as category_id,
         c.name as category_name,
         COUNT(e.id) as expense_count,
         SUM(e.amount) as total_amount,
         AVG(e.amount) as average_amount
       FROM categories c
       LEFT JOIN expenses e ON c.id = e.category_id AND ${whereClause.replace('WHERE ', '')}
       GROUP BY c.id, c.name
       ORDER BY total_amount DESC NULLS LAST`,
      params
    );
    
    return result.rows;
  }
}

module.exports = Expense;