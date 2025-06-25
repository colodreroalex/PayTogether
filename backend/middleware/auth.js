const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { query } = require('../config/database');

// Middleware para verificar JWT token
const authenticateToken = async (req, res, next) => {
  try {
    // Obtener token de cookies o header Authorization
    let token = req.cookies?.authToken;
    
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null;
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de acceso requerido' 
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que la sesión existe y no ha expirado
    const sessionResult = await query(
      'SELECT * FROM user_sessions WHERE user_id = $1 AND token = $2 AND expires_at > NOW() AND deleted_at IS NULL',
      [decoded.userId, token]
    );
    
    if (!sessionResult.rows[0]) {
      return res.status(401).json({ 
        success: false, 
        message: 'Sesión inválida o expirada' 
      });
    }

    // Obtener información del usuario
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    // Actualizar última actividad de la sesión
    await query(
      'UPDATE user_sessions SET last_activity = NOW() WHERE id = $1',
      [sessionResult.rows[0].id]
    );

    // Agregar usuario a la request
    req.user = user;
    req.sessionId = sessionResult.rows[0].id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado' 
      });
    }
    
    console.error('Error en autenticación:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Middleware opcional de autenticación (no falla si no hay token)
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.authToken;
    
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // En caso de error, simplemente continúa sin usuario
    next();
  }
};

// Middleware para verificar permisos de grupo
const requireGroupMember = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.body.groupId;
    
    if (!groupId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de grupo requerido' 
      });
    }

    // Verificar que el usuario es miembro del grupo
    const memberResult = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [groupId, req.user.id]
    );
    
    if (!memberResult.rows[0]) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes acceso a este grupo' 
      });
    }

    req.userRole = memberResult.rows[0].role;
    next();
  } catch (error) {
    console.error('Error verificando permisos de grupo:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Middleware para verificar que el usuario es admin del grupo
const requireGroupAdmin = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.body.groupId;
    
    if (!groupId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de grupo requerido' 
      });
    }

    // Verificar que el usuario es admin del grupo
    const adminResult = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = $3 AND deleted_at IS NULL',
      [groupId, req.user.id, 'admin']
    );
    
    if (!adminResult.rows[0]) {
      return res.status(403).json({ 
        success: false, 
        message: 'Se requieren permisos de administrador' 
      });
    }

    next();
  } catch (error) {
    console.error('Error verificando permisos de admin:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Función para generar JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Función para crear sesión en la base de datos
const createSession = async (userId, token, userAgent = null, ipAddress = null) => {
  const sessionId = require('uuid').v4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 días
  
  const result = await query(
    `INSERT INTO user_sessions (id, user_id, token, expires_at, user_agent, ip_address, created_at, last_activity) 
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
     RETURNING *`,
    [sessionId, userId, token, expiresAt, userAgent, ipAddress]
  );
  
  return result.rows[0];
};

// Función para eliminar sesión
const deleteSession = async (token) => {
  await query(
    'UPDATE user_sessions SET deleted_at = NOW() WHERE token = $1',
    [token]
  );
};

// Función para limpiar sesiones expiradas
const cleanExpiredSessions = async () => {
  const result = await query(
    'UPDATE user_sessions SET deleted_at = NOW() WHERE expires_at < NOW() AND deleted_at IS NULL'
  );
  
  console.log(`🧹 Limpiadas ${result.rowCount} sesiones expiradas`);
  return result.rowCount;
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireGroupMember,
  requireGroupAdmin,
  generateToken,
  createSession,
  deleteSession,
  cleanExpiredSessions
};