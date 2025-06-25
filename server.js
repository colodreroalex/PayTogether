import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';
import { PORT } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos de React en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
}

// Ruta de prueba
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as server_time');
    res.json({
      status: 'OK',
      message: 'Servidor funcionando correctamente',
      database: 'Conectado',
      server_time: result.rows[0].server_time
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Error de conexión a la base de datos',
      error: error.message
    });
  }
});

// Ruta para obtener categorías
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo categorías',
      error: error.message
    });
  }
});

// Ruta para crear un usuario
app.post('/api/users', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email y nombre son requeridos'
      });
    }
    
    const result = await pool.query(
      'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
      [email, name]
    );
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Duplicate key error
      res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error creando usuario',
        error: error.message
      });
    }
  }
});

// Ruta para obtener usuarios
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, created_at FROM users ORDER BY created_at DESC');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo usuarios',
      error: error.message
    });
  }
});

// Ruta para crear un grupo
app.post('/api/groups', async (req, res) => {
  try {
    const { name, description, created_by } = req.body;
    
    if (!name || !created_by) {
      return res.status(400).json({
        success: false,
        message: 'Nombre del grupo y creador son requeridos'
      });
    }
    
    const result = await pool.query(
      'INSERT INTO groups (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, description, created_by]
    );
    
    // Agregar al creador como miembro del grupo
    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [result.rows[0].id, created_by]
    );
    
    res.status(201).json({
      success: true,
      message: 'Grupo creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creando grupo',
      error: error.message
    });
  }
});

// Ruta para obtener grupos
app.get('/api/groups', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*, u.name as creator_name, 
             COUNT(gm.user_id) as member_count
      FROM groups g
      LEFT JOIN users u ON g.created_by = u.id
      LEFT JOIN group_members gm ON g.id = gm.group_id
      GROUP BY g.id, u.name
      ORDER BY g.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo grupos',
      error: error.message
    });
  }
});

// Ruta para crear un gasto
app.post('/api/expenses', async (req, res) => {
  try {
    const { group_id, payer_id, category_id, description, amount, expense_date, splits } = req.body;
    
    if (!group_id || !payer_id || !category_id || !description || !amount || !expense_date) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }
    
    // Crear el gasto
    const expenseResult = await pool.query(
      'INSERT INTO expenses (group_id, payer_id, category_id, description, amount, expense_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [group_id, payer_id, category_id, description, amount, expense_date]
    );
    
    const expense = expenseResult.rows[0];
    
    // Crear las divisiones si se proporcionan
    if (splits && splits.length > 0) {
      for (const split of splits) {
        await pool.query(
          'INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ($1, $2, $3)',
          [expense.id, split.user_id, split.amount]
        );
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Gasto creado exitosamente',
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creando gasto',
      error: error.message
    });
  }
});

// Ruta para obtener gastos de un grupo
app.get('/api/groups/:groupId/expenses', async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const result = await pool.query(`
      SELECT e.*, u.name as payer_name, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM expenses e
      LEFT JOIN users u ON e.payer_id = u.id
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.group_id = $1
      ORDER BY e.expense_date DESC, e.created_at DESC
    `, [groupId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo gastos',
      error: error.message
    });
  }
});

// Ruta para actualizar un gasto
app.put('/api/expenses/:expenseId', async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { category_id, description, amount, expense_date } = req.body;
    
    if (!category_id || !description || !amount || !expense_date) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }
    
    const result = await pool.query(
      'UPDATE expenses SET category_id = $1, description = $2, amount = $3, expense_date = $4 WHERE id = $5 RETURNING *',
      [category_id, description, amount, expense_date, expenseId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Gasto actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error actualizando gasto',
      error: error.message
    });
  }
});

// Ruta para eliminar un gasto
app.delete('/api/expenses/:expenseId', async (req, res) => {
  try {
    const { expenseId } = req.params;
    
    // Primero eliminar las divisiones del gasto
    await pool.query('DELETE FROM expense_splits WHERE expense_id = $1', [expenseId]);
    
    // Luego eliminar el gasto
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [expenseId]);
    
    if (result.rows.length === 0) {
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
    res.status(500).json({
      success: false,
      message: 'Error eliminando gasto',
      error: error.message
    });
  }
});

// En producción, servir la aplicación React para todas las rutas no API
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
} else {
  // Manejo de rutas no encontradas en desarrollo
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Ruta no encontrada'
    });
  });
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🌍 API disponible en: http://localhost:${PORT}/api`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

export default app;