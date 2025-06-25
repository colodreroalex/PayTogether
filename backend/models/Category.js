const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Category {
  // Obtener todas las categorías
  static async findAll() {
    const result = await query(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    return result.rows;
  }

  // Buscar categoría por ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Buscar categoría por nombre
  static async findByName(name) {
    const result = await query(
      'SELECT * FROM categories WHERE name = $1',
      [name]
    );
    return result.rows[0];
  }

  // Crear una nueva categoría personalizada
  static async create({ name, icon, color }) {
    try {
      const categoryId = uuidv4();
      
      const result = await query(
        `INSERT INTO categories (id, name, icon, color, is_default, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, false, NOW(), NOW()) 
         RETURNING *`,
        [categoryId, name, icon, color]
      );
      
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Violación de unicidad
        throw new Error('Ya existe una categoría con ese nombre');
      }
      throw error;
    }
  }

  // Actualizar categoría (solo las personalizadas)
  static async update(id, { name, icon, color }) {
    // Verificar que no sea una categoría por defecto
    const category = await this.findById(id);
    if (!category) {
      throw new Error('Categoría no encontrada');
    }
    
    if (category.is_default) {
      throw new Error('No se pueden modificar las categorías por defecto');
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      fields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (icon) {
      fields.push(`icon = $${paramCount}`);
      values.push(icon);
      paramCount++;
    }

    if (color) {
      fields.push(`color = $${paramCount}`);
      values.push(color);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Eliminar categoría personalizada
  static async delete(id) {
    // Verificar que no sea una categoría por defecto
    const category = await this.findById(id);
    if (!category) {
      throw new Error('Categoría no encontrada');
    }
    
    if (category.is_default) {
      throw new Error('No se pueden eliminar las categorías por defecto');
    }

    // Verificar que no tenga gastos asociados
    const expenseCheck = await query(
      'SELECT COUNT(*) as count FROM expenses WHERE category_id = $1 AND deleted_at IS NULL',
      [id]
    );
    
    if (parseInt(expenseCheck.rows[0].count) > 0) {
      throw new Error('No se puede eliminar una categoría que tiene gastos asociados');
    }

    const result = await query(
      'DELETE FROM categories WHERE id = $1 AND is_default = false RETURNING id',
      [id]
    );
    
    return result.rows[0];
  }

  // Obtener estadísticas de uso de categorías
  static async getUsageStats(groupId = null) {
    let whereClause = 'WHERE e.deleted_at IS NULL';
    let params = [];
    
    if (groupId) {
      whereClause += ' AND e.group_id = $1';
      params.push(groupId);
    }
    
    const result = await query(
      `SELECT 
         c.id,
         c.name,
         c.icon,
         c.color,
         c.is_default,
         COUNT(e.id) as usage_count,
         COALESCE(SUM(e.amount), 0) as total_amount
       FROM categories c
       LEFT JOIN expenses e ON c.id = e.category_id AND ${whereClause.replace('WHERE ', '')}
       GROUP BY c.id, c.name, c.icon, c.color, c.is_default
       ORDER BY usage_count DESC, c.name ASC`,
      params
    );
    
    return result.rows;
  }

  // Obtener categorías más utilizadas
  static async getMostUsed(limit = 5, groupId = null) {
    let whereClause = 'WHERE e.deleted_at IS NULL';
    let params = [limit];
    let paramCount = 2;
    
    if (groupId) {
      whereClause += ` AND e.group_id = $${paramCount}`;
      params.push(groupId);
      paramCount++;
    }
    
    const result = await query(
      `SELECT 
         c.id,
         c.name,
         c.icon,
         c.color,
         COUNT(e.id) as usage_count
       FROM categories c
       JOIN expenses e ON c.id = e.category_id
       ${whereClause}
       GROUP BY c.id, c.name, c.icon, c.color
       HAVING COUNT(e.id) > 0
       ORDER BY usage_count DESC
       LIMIT $1`,
      params
    );
    
    return result.rows;
  }

  // Inicializar categorías por defecto (para migración)
  static async initializeDefaultCategories() {
    const defaultCategories = [
      { name: 'Comida', icon: '🍽️', color: '#FF6B6B' },
      { name: 'Transporte', icon: '🚗', color: '#4ECDC4' },
      { name: 'Entretenimiento', icon: '🎬', color: '#45B7D1' },
      { name: 'Compras', icon: '🛒', color: '#96CEB4' },
      { name: 'Servicios', icon: '🔧', color: '#FFEAA7' },
      { name: 'Salud', icon: '🏥', color: '#DDA0DD' },
      { name: 'Educación', icon: '📚', color: '#98D8C8' },
      { name: 'Viajes', icon: '✈️', color: '#F7DC6F' },
      { name: 'Hogar', icon: '🏠', color: '#BB8FCE' },
      { name: 'Otros', icon: '📦', color: '#85C1E9' }
    ];

    const results = [];
    
    for (const category of defaultCategories) {
      try {
        // Verificar si ya existe
        const existing = await this.findByName(category.name);
        if (!existing) {
          const result = await query(
            `INSERT INTO categories (id, name, icon, color, is_default, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, true, NOW(), NOW()) 
             RETURNING *`,
            [uuidv4(), category.name, category.icon, category.color]
          );
          results.push(result.rows[0]);
        } else {
          results.push(existing);
        }
      } catch (error) {
        console.error(`Error creando categoría ${category.name}:`, error.message);
      }
    }
    
    return results;
  }
}

module.exports = Category;