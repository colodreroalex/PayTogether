const { query, transaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Group {
  // Crear un nuevo grupo
  static async create({ name, description, createdBy }) {
    return await transaction(async (client) => {
      const groupId = uuidv4();
      
      // Crear el grupo
      const groupResult = await client.query(
        `INSERT INTO groups (id, name, description, created_by, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, NOW(), NOW()) 
         RETURNING *`,
        [groupId, name, description, createdBy]
      );
      
      // Agregar al creador como administrador
      await client.query(
        `INSERT INTO group_members (id, group_id, user_id, role, joined_at) 
         VALUES ($1, $2, $3, 'admin', NOW())`,
        [uuidv4(), groupId, createdBy]
      );
      
      return groupResult.rows[0];
    });
  }

  // Buscar grupo por ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM groups WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0];
  }

  // Obtener grupos del usuario
  static async findByUserId(userId) {
    const result = await query(
      `SELECT g.*, gm.role, gm.joined_at
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1 AND g.deleted_at IS NULL AND gm.deleted_at IS NULL
       ORDER BY g.updated_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // Actualizar grupo
  static async update(id, { name, description }, userId) {
    // Verificar que el usuario sea admin del grupo
    const memberCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [id, userId]
    );
    
    if (!memberCheck.rows[0] || memberCheck.rows[0].role !== 'admin') {
      throw new Error('No tienes permisos para actualizar este grupo');
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      fields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (description !== undefined) {
      fields.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE groups SET ${fields.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Eliminar grupo (soft delete)
  static async delete(id, userId) {
    // Verificar que el usuario sea admin del grupo
    const memberCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [id, userId]
    );
    
    if (!memberCheck.rows[0] || memberCheck.rows[0].role !== 'admin') {
      throw new Error('No tienes permisos para eliminar este grupo');
    }

    const result = await query(
      'UPDATE groups SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  // Obtener miembros del grupo
  static async getMembers(groupId) {
    const result = await query(
      `SELECT u.id, u.name, u.email, gm.role, gm.joined_at
       FROM users u
       JOIN group_members gm ON u.id = gm.user_id
       WHERE gm.group_id = $1 AND u.deleted_at IS NULL AND gm.deleted_at IS NULL
       ORDER BY gm.joined_at ASC`,
      [groupId]
    );
    return result.rows;
  }

  // Agregar miembro al grupo
  static async addMember(groupId, userId, addedBy, role = 'member') {
    // Verificar que quien agrega sea admin
    const adminCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [groupId, addedBy]
    );
    
    if (!adminCheck.rows[0] || adminCheck.rows[0].role !== 'admin') {
      throw new Error('No tienes permisos para agregar miembros');
    }

    // Verificar que el usuario no sea ya miembro
    const existingMember = await query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [groupId, userId]
    );
    
    if (existingMember.rows[0]) {
      throw new Error('El usuario ya es miembro del grupo');
    }

    const result = await query(
      `INSERT INTO group_members (id, group_id, user_id, role, joined_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING *`,
      [uuidv4(), groupId, userId, role]
    );
    
    return result.rows[0];
  }

  // Remover miembro del grupo
  static async removeMember(groupId, userId, removedBy) {
    // Verificar que quien remueve sea admin
    const adminCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [groupId, removedBy]
    );
    
    if (!adminCheck.rows[0] || adminCheck.rows[0].role !== 'admin') {
      throw new Error('No tienes permisos para remover miembros');
    }

    // No permitir que el admin se remueva a sí mismo si es el único admin
    if (userId === removedBy) {
      const adminCount = await query(
        'SELECT COUNT(*) as count FROM group_members WHERE group_id = $1 AND role = $2 AND deleted_at IS NULL',
        [groupId, 'admin']
      );
      
      if (parseInt(adminCount.rows[0].count) === 1) {
        throw new Error('No puedes removerte siendo el único administrador');
      }
    }

    const result = await query(
      'UPDATE group_members SET deleted_at = NOW() WHERE group_id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id',
      [groupId, userId]
    );
    
    return result.rows[0];
  }

  // Cambiar rol de miembro
  static async updateMemberRole(groupId, userId, newRole, updatedBy) {
    // Verificar que quien actualiza sea admin
    const adminCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [groupId, updatedBy]
    );
    
    if (!adminCheck.rows[0] || adminCheck.rows[0].role !== 'admin') {
      throw new Error('No tienes permisos para cambiar roles');
    }

    const result = await query(
      'UPDATE group_members SET role = $1 WHERE group_id = $2 AND user_id = $3 AND deleted_at IS NULL RETURNING *',
      [newRole, groupId, userId]
    );
    
    return result.rows[0];
  }

  // Verificar si el usuario es miembro del grupo
  static async isMember(groupId, userId) {
    const result = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [groupId, userId]
    );
    return result.rows[0];
  }

  // Obtener estadísticas del grupo
  static async getStats(groupId) {
    const result = await query(
      `SELECT 
         COUNT(DISTINCT gm.user_id) as total_members,
         COUNT(DISTINCT e.id) as total_expenses,
         COALESCE(SUM(e.amount), 0) as total_amount
       FROM groups g
       LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.deleted_at IS NULL
       LEFT JOIN expenses e ON g.id = e.group_id AND e.deleted_at IS NULL
       WHERE g.id = $1 AND g.deleted_at IS NULL`,
      [groupId]
    );
    return result.rows[0];
  }
}

module.exports = Group;