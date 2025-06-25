const express = require('express');
const User = require('../models/User');
const { 
  generateToken, 
  createSession, 
  deleteSession, 
  authenticateToken 
} = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordChange,
  sanitizeInput
} = require('../middleware/validation');

const router = express.Router();

// Registro de usuario
router.post('/register', sanitizeInput, validateUserRegistration, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Crear el usuario
    const user = await User.create({ email, password, name });

    // Generar token y crear sesión
    const token = generateToken(user.id);
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    await createSession(user.id, token, userAgent, ipAddress);

    // Configurar cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.created_at
        },
        token
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// Login de usuario
router.post('/login', sanitizeInput, validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token y crear sesión
    const token = generateToken(user.id);
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    await createSession(user.id, token, userAgent, ipAddress);

    // Configurar cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.created_at
        },
        token
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Logout de usuario
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Obtener token de cookies o header
    let token = req.cookies?.authToken;
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null;
    }

    if (token) {
      // Eliminar sesión de la base de datos
      await deleteSession(token);
    }

    // Limpiar cookie
    res.clearCookie('authToken');

    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener información del usuario actual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Obtener estadísticas del usuario
    const stats = await User.getStats(req.user.id);
    
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          createdAt: req.user.created_at,
          updatedAt: req.user.updated_at
        },
        stats: {
          totalGroups: parseInt(stats.total_groups) || 0,
          totalExpenses: parseInt(stats.total_expenses) || 0,
          totalPaid: parseFloat(stats.total_paid) || 0,
          totalOwed: parseFloat(stats.total_owed) || 0
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo información del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar información del usuario
router.put('/me', authenticateToken, sanitizeInput, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name && !email) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un campo para actualizar'
      });
    }

    // Si se está actualizando el email, verificar que no exista
    if (email && email !== req.user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }
    }

    const updatedUser = await User.update(req.user.id, { name, email });

    res.json({
      success: true,
      message: 'Información actualizada exitosamente',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          updatedAt: updatedUser.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// Cambiar contraseña
router.put('/change-password', authenticateToken, sanitizeInput, validatePasswordChange, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Obtener usuario completo con contraseña
    const user = await User.findByEmail(req.user.email);
    
    // Verificar contraseña actual
    const isValidPassword = await User.verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'La contraseña actual es incorrecta'
      });
    }

    // Cambiar contraseña
    await User.changePassword(req.user.id, newPassword);

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar cuenta
router.delete('/me', authenticateToken, async (req, res) => {
  try {
    // Eliminar usuario (soft delete)
    await User.delete(req.user.id);

    // Eliminar sesión actual
    let token = req.cookies?.authToken;
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null;
    }

    if (token) {
      await deleteSession(token);
    }

    // Limpiar cookie
    res.clearCookie('authToken');

    res.json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Verificar si el token es válido
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
      }
    }
  });
});

module.exports = router;