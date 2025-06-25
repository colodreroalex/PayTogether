const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
const Expense = require('../models/Expense');
const { authenticateToken, requireGroupMember, requireGroupAdmin } = require('../middleware/auth');
const {
  validateGroupCreation,
  validateGroupUpdate,
  validateAddMember,
  validateUpdateMemberRole,
  validateUUIDParam,
  sanitizeInput
} = require('../middleware/validation');

const router = express.Router();

// Obtener todos los grupos del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const groups = await Group.findByUserId(req.user.id);
    
    // Obtener estadísticas para cada grupo
    const groupsWithStats = await Promise.all(
      groups.map(async (group) => {
        const stats = await Group.getStats(group.id);
        return {
          ...group,
          stats: {
            totalMembers: parseInt(stats.total_members) || 0,
            totalExpenses: parseInt(stats.total_expenses) || 0,
            totalAmount: parseFloat(stats.total_amount) || 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        groups: groupsWithStats
      }
    });
  } catch (error) {
    console.error('Error obteniendo grupos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear un nuevo grupo
router.post('/', authenticateToken, sanitizeInput, validateGroupCreation, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const group = await Group.create({
      name,
      description,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Grupo creado exitosamente',
      data: {
        group
      }
    });
  } catch (error) {
    console.error('Error creando grupo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// Obtener un grupo específico
router.get('/:groupId', 
  authenticateToken, 
  validateUUIDParam('groupId'), 
  requireGroupMember, 
  async (req, res) => {
    try {
      const group = await Group.findById(req.params.groupId);
      
      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Grupo no encontrado'
        });
      }

      // Obtener miembros del grupo
      const members = await Group.getMembers(req.params.groupId);
      
      // Obtener estadísticas del grupo
      const stats = await Group.getStats(req.params.groupId);

      res.json({
        success: true,
        data: {
          group: {
            ...group,
            members,
            stats: {
              totalMembers: parseInt(stats.total_members) || 0,
              totalExpenses: parseInt(stats.total_expenses) || 0,
              totalAmount: parseFloat(stats.total_amount) || 0
            },
            userRole: req.userRole
          }
        }
      });
    } catch (error) {
      console.error('Error obteniendo grupo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Actualizar un grupo
router.put('/:groupId', 
  authenticateToken, 
  validateUUIDParam('groupId'), 
  requireGroupAdmin, 
  sanitizeInput, 
  validateGroupUpdate, 
  async (req, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name && description === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar al menos un campo para actualizar'
        });
      }

      const updatedGroup = await Group.update(req.params.groupId, { name, description }, req.user.id);

      res.json({
        success: true,
        message: 'Grupo actualizado exitosamente',
        data: {
          group: updatedGroup
        }
      });
    } catch (error) {
      console.error('Error actualizando grupo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
);

// Eliminar un grupo
router.delete('/:groupId', 
  authenticateToken, 
  validateUUIDParam('groupId'), 
  requireGroupAdmin, 
  async (req, res) => {
    try {
      await Group.delete(req.params.groupId, req.user.id);

      res.json({
        success: true,
        message: 'Grupo eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error eliminando grupo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
);

// Obtener miembros del grupo
router.get('/:groupId/members', 
  authenticateToken, 
  validateUUIDParam('groupId'), 
  requireGroupMember, 
  async (req, res) => {
    try {
      const members = await Group.getMembers(req.params.groupId);

      res.json({
        success: true,
        data: {
          members
        }
      });
    } catch (error) {
      console.error('Error obteniendo miembros:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Agregar miembro al grupo
router.post('/:groupId/members', 
  authenticateToken, 
  validateUUIDParam('groupId'), 
  requireGroupAdmin, 
  sanitizeInput, 
  validateAddMember, 
  async (req, res) => {
    try {
      const { email, role = 'member' } = req.body;
      
      // Buscar usuario por email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado con ese email'
        });
      }

      // Agregar miembro al grupo
      const member = await Group.addMember(req.params.groupId, user.id, req.user.id, role);

      res.status(201).json({
        success: true,
        message: 'Miembro agregado exitosamente',
        data: {
          member: {
            ...member,
            user: {
              id: user.id,
              name: user.name,
              email: user.email
            }
          }
        }
      });
    } catch (error) {
      console.error('Error agregando miembro:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
);

// Actualizar rol de miembro
router.put('/:groupId/members/:userId', 
  authenticateToken, 
  validateUUIDParam('groupId'), 
  validateUUIDParam('userId'), 
  requireGroupAdmin, 
  sanitizeInput, 
  validateUpdateMemberRole, 
  async (req, res) => {
    try {
      const { role } = req.body;
      
      const updatedMember = await Group.updateMemberRole(
        req.params.groupId, 
        req.params.userId, 
        role, 
        req.user.id
      );

      res.json({
        success: true,
        message: 'Rol actualizado exitosamente',
        data: {
          member: updatedMember
        }
      });
    } catch (error) {
      console.error('Error actualizando rol:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
);

// Remover miembro del grupo
router.delete('/:groupId/members/:userId', 
  authenticateToken, 
  validateUUIDParam('groupId'), 
  validateUUIDParam('userId'), 
  requireGroupAdmin, 
  async (req, res) => {
    try {
      await Group.removeMember(req.params.groupId, req.params.userId, req.user.id);

      res.json({
        success: true,
        message: 'Miembro removido exitosamente'
      });
    } catch (error) {
      console.error('Error removiendo miembro:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
);

// Salir del grupo (el usuario se remueve a sí mismo)
router.post('/:groupId/leave', 
  authenticateToken, 
  validateUUIDParam('groupId'), 
  requireGroupMember, 
  async (req, res) => {
    try {
      // Verificar que no sea el único admin
      if (req.userRole === 'admin') {
        const members = await Group.getMembers(req.params.groupId);
        const adminCount = members.filter(m => m.role === 'admin').length;
        
        if (adminCount === 1) {
          return res.status(400).json({
            success: false,
            message: 'No puedes salir del grupo siendo el único administrador. Transfiere el rol de administrador a otro miembro primero.'
          });
        }
      }

      await Group.removeMember(req.params.groupId, req.user.id, req.user.id);

      res.json({
        success: true,
        message: 'Has salido del grupo exitosamente'
      });
    } catch (error) {
      console.error('Error saliendo del grupo:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
);

// Obtener balances del grupo
router.get('/:groupId/balances', 
  authenticateToken, 
  validateUUIDParam('groupId'), 
  requireGroupMember, 
  async (req, res) => {
    try {
      const balances = await Expense.calculateGroupBalances(req.params.groupId);
      const debts = await Expense.calculateGroupDebts(req.params.groupId);

      res.json({
        success: true,
        data: {
          balances,
          debts
        }
      });
    } catch (error) {
      console.error('Error calculando balances:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

// Obtener estadísticas del grupo
router.get('/:groupId/stats', 
  authenticateToken, 
  validateUUIDParam('groupId'), 
  requireGroupMember, 
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      // Estadísticas generales
      const generalStats = await Group.getStats(req.params.groupId);
      
      // Estadísticas por categoría
      const categoryStats = await Expense.getCategoryStats(
        req.params.groupId, 
        startDate, 
        endDate
      );
      
      // Balances actuales
      const balances = await Expense.calculateGroupBalances(req.params.groupId);

      res.json({
        success: true,
        data: {
          general: {
            totalMembers: parseInt(generalStats.total_members) || 0,
            totalExpenses: parseInt(generalStats.total_expenses) || 0,
            totalAmount: parseFloat(generalStats.total_amount) || 0
          },
          categories: categoryStats,
          balances
        }
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

module.exports = router;