const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  // Crear un nuevo usuario
  static async create({ email, password, name }) {
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const userId = uuidv4();
      
      const result = await query(
        `INSERT INTO users (id, email, password_hash, name, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, NOW(), NOW()) 
         RETURNING id, email, name, created_at`,
        [userId, email, hashedPassword, name]
      );
      
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Violación de unicidad
        throw new Error('El email ya está registrado');
      }
      throw error;
    }
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );
    return result.rows[0];
  }

  // Buscar usuario por ID
  static async findById(id) {
    const result = await query(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0];
  }

  // Verificar contraseña
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Actualizar información del usuario
  static async update(id, { name, email }) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      fields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (email) {
      fields.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL RETURNING id, email, name, updated_at`,
      values
    );

    return result.rows[0];
  }

  // Cambiar contraseña
  static async changePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const result = await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING id',
      [hashedPassword, id]
    );

    return result.rows[0];
  }

  // Eliminar usuario (soft delete)
  static async delete(id) {
    const result = await query(
      'UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  // Obtener grupos del usuario
  static async getGroups(userId) {
    const result = await query(
      `SELECT g.id, g.name, g.description, g.created_at, g.updated_at,
              gm.role, gm.joined_at
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1 AND g.deleted_at IS NULL AND gm.deleted_at IS NULL
       ORDER BY gm.joined_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // Obtener estadísticas del usuario
  static async getStats(userId) {
    const result = await query(
      `SELECT 
         COUNT(DISTINCT gm.group_id) as total_groups,
         COUNT(DISTINCT e.id) as total_expenses,
         COALESCE(SUM(CASE WHEN e.paid_by = $1 THEN e.amount ELSE 0 END), 0) as total_paid,
         COALESCE(SUM(es.amount), 0) as total_owed
       FROM group_members gm
       LEFT JOIN expenses e ON gm.group_id = e.group_id AND e.deleted_at IS NULL
       LEFT JOIN expense_splits es ON e.id = es.expense_id AND es.user_id = $1 AND es.deleted_at IS NULL
       WHERE gm.user_id = $1 AND gm.deleted_at IS NULL`,
      [userId]
    );
    return result.rows[0];
  }
}

module.exports = User;