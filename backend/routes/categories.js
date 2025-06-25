const express = require('express');
const Category = require('../models/Category');
const { authenticateToken } = require('../middleware/auth');
const {
  validateCategoryCreation,
  validateCategoryUpdate,
  validateUUIDParam,
  sanitizeInput
} = require('../middleware/validation');

const router = express.Router();

// Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll();

    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener una categoría específica
router.get('/:categoryId', validateUUIDParam('categoryId'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        category
      }
    });
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear una nueva categoría personalizada (requiere autenticación)
router.post('/', 
  authenticateToken, 
  sanitizeInput, 
  validateCategoryCreation, 
  async (req, res) => {
    try {
      const { name, icon, color } = req.body;
      
      const category = await Category.create({ name, icon, color });

      res.status(201).json({
        success: true,
        message: 'Categoría creada exitosamente',
        data: {
          category
        }
      });
    } catch (error) {
      console.error('Error creando categoría:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
);

// Actualizar una categoría personalizada
router.put('/:categoryId', 
  authenticateToken, 
  validateUUIDParam('categoryId'), 
  sanitizeInput, 
  validateCategoryUpdate, 
  async (req, res) => {
    try {
      const { name, icon, color } = req.body;
      
      if (!name && !icon && !color) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar al menos un campo para actualizar'
        });
      }
      
      const updatedCategory = await Category.update(req.params.categoryId, { name, icon, color });
      
      if (!updatedCategory) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: {
          category: updatedCategory
        }
      });
    } catch (error) {
      console.error('Error actualizando categoría:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
);

// Eliminar una categoría personalizada
router.delete('/:categoryId', 
  authenticateToken, 
  validateUUIDParam('categoryId'), 
  async (req, res) => {
    try {
      const deletedCategory = await Category.delete(req.params.categoryId);
      
      if (!deletedCategory) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Categoría eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
);

// Obtener estadísticas de uso de categorías
router.get('/stats/usage', async (req, res) => {
  try {
    const { groupId } = req.query;
    
    const stats = await Category.getUsageStats(groupId);

    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener categorías más utilizadas
router.get('/stats/most-used', async (req, res) => {
  try {
    const { limit = 5, groupId } = req.query;
    
    const categories = await Category.getMostUsed(parseInt(limit), groupId);

    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    console.error('Error obteniendo categorías más utilizadas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Inicializar categorías por defecto (endpoint de utilidad)
router.post('/initialize-defaults', async (req, res) => {
  try {
    const categories = await Category.initializeDefaultCategories();

    res.json({
      success: true,
      message: 'Categorías por defecto inicializadas',
      data: {
        categories
      }
    });
  } catch (error) {
    console.error('Error inicializando categorías por defecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Buscar categorías por nombre
router.get('/search/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    if (!name || name.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El nombre debe tener al menos 2 caracteres'
      });
    }
    
    const result = await require('../config/database').query(
      'SELECT * FROM categories WHERE name ILIKE $1 ORDER BY name ASC LIMIT 10',
      [`%${name}%`]
    );

    res.json({
      success: true,
      data: {
        categories: result.rows
      }
    });
  } catch (error) {
    console.error('Error buscando categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener categorías con gastos recientes (para sugerencias)
router.get('/suggestions/recent', authenticateToken, async (req, res) => {
  try {
    const { groupId, limit = 5 } = req.query;
    
    let whereClause = 'WHERE e.deleted_at IS NULL';
    let params = [req.user.id, parseInt(limit)];
    let paramCount = 3;
    
    if (groupId) {
      whereClause += ` AND e.group_id = $${paramCount}`;
      params.push(groupId);
      paramCount++;
    }
    
    const result = await require('../config/database').query(
      `SELECT DISTINCT c.*, e.created_at as last_used
       FROM categories c
       JOIN expenses e ON c.id = e.category_id
       JOIN expense_splits es ON e.id = es.expense_id
       ${whereClause} AND es.user_id = $1
       ORDER BY e.created_at DESC
       LIMIT $2`,
      params
    );

    res.json({
      success: true,
      data: {
        categories: result.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo sugerencias de categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;