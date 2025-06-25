const express = require('express');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const { authenticateToken, requireGroupMember } = require('../middleware/auth');
const {
  validateExpenseCreation,
  validateExpenseUpdate,
  validateUUIDParam,
  validateExpenseFilters,
  validatePositiveAmount,
  sanitizeInput
} = require('../middleware/validation');

const router = express.Router();

// Obtener gastos de un grupo con filtros
router.get('/group/:groupId', 
  authenticateToken, 
  validateUUIDParam('groupId'), 
  requireGroupMember, 
  validateExpenseFilters, 
  async (req, res) => {
    try {
      const { 
        categoryId, 
        paidBy, 
        description, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 50 
      } = req.query;
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const filters = {
        categoryId,
        paidBy,
        description,
        startDate,
        endDate,
        limit: parseInt(limit),
        offset
      };
      
      const expenses = await Expense.findByGroupId(req.params.groupId, filters);
      
      // Obtener el total de gastos para paginación
      const totalResult = await require('../config/database').query(
        `SELECT COUNT(*) as total 
         FROM expenses e 
         WHERE e.group_id = $1 AND e.deleted_at IS NULL`,
        [req.params.groupId]
      );
      
      const total = parseInt(totalResult.rows[0].total);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          expenses,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      console.error('Error obteniendo gastos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Crear un nuevo gasto
router.post('/', 
  authenticateToken, 
  sanitizeInput, 
  validateExpenseCreation, 
  validatePositiveAmount, 
  async (req, res) => {
    try {
      const { description, amount, categoryId, groupId, paidBy, splitBetween } = req.body;
      
      // Verificar que el usuario es miembro del grupo
      const membership = await Group.isMember(groupId, req.user.id);
      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a este grupo'
        });
      }
      
      // Verificar que quien pagó es miembro del grupo
      const paidByMembership = await Group.isMember(groupId, paidBy);
      if (!paidByMembership) {
        return res.status(400).json({
          success: false,
          message: 'El usuario que pagó debe ser miembro del grupo'
        });
      }
      
      // Verificar que todos los usuarios en splitBetween son miembros del grupo
      for (const userId of splitBetween) {
        const userMembership = await Group.isMember(groupId, userId);
        if (!userMembership) {
          return res.status(400).json({
            success: false,
            message: 'Todos los usuarios en la división deben ser miembros del grupo'
          });
        }
      }
      
      const expense = await Expense.create({
        description,
        amount: parseFloat(amount),
        categoryId,
        groupId,
        paidBy,
        splitBetween
      });

      // Obtener el gasto completo con información adicional
      const fullExpense = await Expense.findById(expense.id);

      res.status(201).json({
        success: true,
        message: 'Gasto creado exitosamente',
        data: {
          expense: fullExpense
        }
      });
    } catch (error) {
      console.error('Error creando gasto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
);

// Obtener un gasto específico
router.get('/:expenseId', 
  authenticateToken, 
  validateUUIDParam('expenseId'), 
  async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.expenseId);
      
      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado'
        });
      }
      
      // Verificar que el usuario es miembro del grupo
      const membership = await Group.isMember(expense.group_id, req.user.id);
      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a este gasto'
        });
      }

      res.json({
        success: true,
        data: {
          expense
        }
      });
    } catch (error) {
      console.error('Error obteniendo gasto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Actualizar un gasto
router.put('/:expenseId', 
  authenticateToken, 
  validateUUIDParam('expenseId'), 
  sanitizeInput, 
  validateExpenseUpdate, 
  validatePositiveAmount, 
  async (req, res) => {
    try {
      const { description, amount, categoryId } = req.body;
      
      if (!description && !amount && !categoryId) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar al menos un campo para actualizar'
        });
      }
      
      const updateData = {};
      if (description) updateData.description = description;
      if (amount) updateData.amount = parseFloat(amount);
      if (categoryId) updateData.categoryId = categoryId;
      
      const updatedExpense = await Expense.update(req.params.expenseId, updateData, req.user.id);
      
      if (!updatedExpense) {
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado'
        });
      }

      // Obtener el gasto completo actualizado
      const fullExpense = await Expense.findById(req.params.expenseId);

      res.json({
        success: true,
        message: 'Gasto actualizado exitosamente',
        data: {
          expense: fullExpense
        }
      });
    } catch (error) {
      console.error('Error actualizando gasto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
);

// Eliminar un gasto
router.delete('/:expenseId', 
  authenticateToken, 
  validateUUIDParam('expenseId'), 
  async (req, res) => {
    try {
      const deletedExpense = await Expense.delete(req.params.expenseId, req.user.id);
      
      if (!deletedExpense) {
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Gasto eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error eliminando gasto:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
);

// Obtener gastos donde el usuario actual pagó
router.get('/user/paid', 
  authenticateToken, 
  validateExpenseFilters, 
  async (req, res) => {
    try {
      const { 
        categoryId, 
        groupId, 
        description, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 50 
      } = req.query;
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      let whereClause = 'WHERE e.paid_by = $1 AND e.deleted_at IS NULL';
      let params = [req.user.id];
      let paramCount = 2;
      
      if (groupId) {
        whereClause += ` AND e.group_id = $${paramCount}`;
        params.push(groupId);
        paramCount++;
      }
      
      if (categoryId) {
        whereClause += ` AND e.category_id = $${paramCount}`;
        params.push(categoryId);
        paramCount++;
      }
      
      if (description) {
        whereClause += ` AND e.description ILIKE $${paramCount}`;
        params.push(`%${description}%`);
        paramCount++;
      }
      
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
      
      const result = await require('../config/database').query(
        `SELECT e.*, c.name as category_name, g.name as group_name
         FROM expenses e
         LEFT JOIN categories c ON e.category_id = c.id
         LEFT JOIN groups g ON e.group_id = g.id
         ${whereClause}
         ORDER BY e.created_at DESC
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...params, parseInt(limit), offset]
      );
      
      // Obtener total para paginación
      const totalResult = await require('../config/database').query(
        `SELECT COUNT(*) as total FROM expenses e ${whereClause}`,
        params
      );
      
      const total = parseInt(totalResult.rows[0].total);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          expenses: result.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      console.error('Error obteniendo gastos pagados:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Obtener gastos donde el usuario actual debe dinero
router.get('/user/owed', 
  authenticateToken, 
  validateExpenseFilters, 
  async (req, res) => {
    try {
      const { 
        categoryId, 
        groupId, 
        description, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 50 
      } = req.query;
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      let whereClause = 'WHERE es.user_id = $1 AND e.deleted_at IS NULL AND es.deleted_at IS NULL';
      let params = [req.user.id];
      let paramCount = 2;
      
      if (groupId) {
        whereClause += ` AND e.group_id = $${paramCount}`;
        params.push(groupId);
        paramCount++;
      }
      
      if (categoryId) {
        whereClause += ` AND e.category_id = $${paramCount}`;
        params.push(categoryId);
        paramCount++;
      }
      
      if (description) {
        whereClause += ` AND e.description ILIKE $${paramCount}`;
        params.push(`%${description}%`);
        paramCount++;
      }
      
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
      
      const result = await require('../config/database').query(
        `SELECT e.*, es.amount as owed_amount, c.name as category_name, g.name as group_name, u.name as paid_by_name
         FROM expense_splits es
         JOIN expenses e ON es.expense_id = e.id
         LEFT JOIN categories c ON e.category_id = c.id
         LEFT JOIN groups g ON e.group_id = g.id
         LEFT JOIN users u ON e.paid_by = u.id
         ${whereClause}
         ORDER BY e.created_at DESC
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...params, parseInt(limit), offset]
      );
      
      // Obtener total para paginación
      const totalResult = await require('../config/database').query(
        `SELECT COUNT(*) as total 
         FROM expense_splits es
         JOIN expenses e ON es.expense_id = e.id
         ${whereClause}`,
        params
      );
      
      const total = parseInt(totalResult.rows[0].total);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          expenses: result.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      console.error('Error obteniendo gastos adeudados:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

module.exports = router;