const { body, param, query, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Validaciones para usuarios
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida'),
  handleValidationErrors
];

const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  handleValidationErrors
];

const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  handleValidationErrors
];

// Validaciones para grupos
const validateGroupCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre del grupo debe tener entre 2 y 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  handleValidationErrors
];

const validateGroupUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre del grupo debe tener entre 2 y 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  handleValidationErrors
];

const validateAddMember = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  body('role')
    .optional()
    .isIn(['admin', 'member'])
    .withMessage('El rol debe ser admin o member'),
  handleValidationErrors
];

const validateUpdateMemberRole = [
  body('role')
    .isIn(['admin', 'member'])
    .withMessage('El rol debe ser admin o member'),
  handleValidationErrors
];

// Validaciones para gastos
const validateExpenseCreation = [
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('La descripción debe tener entre 1 y 200 caracteres'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser un número positivo mayor a 0'),
  body('categoryId')
    .isUUID()
    .withMessage('ID de categoría inválido'),
  body('groupId')
    .isUUID()
    .withMessage('ID de grupo inválido'),
  body('paidBy')
    .isUUID()
    .withMessage('ID de usuario que pagó inválido'),
  body('splitBetween')
    .isArray({ min: 1 })
    .withMessage('Debe especificar al menos un usuario para dividir el gasto'),
  body('splitBetween.*')
    .isUUID()
    .withMessage('IDs de usuarios inválidos en splitBetween'),
  handleValidationErrors
];

const validateExpenseUpdate = [
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('La descripción debe tener entre 1 y 200 caracteres'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser un número positivo mayor a 0'),
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('ID de categoría inválido'),
  handleValidationErrors
];

// Validaciones para categorías
const validateCategoryCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre de la categoría debe tener entre 2 y 50 caracteres'),
  body('icon')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('El icono debe tener entre 1 y 10 caracteres'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('El color debe ser un código hexadecimal válido'),
  handleValidationErrors
];

const validateCategoryUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre de la categoría debe tener entre 2 y 50 caracteres'),
  body('icon')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('El icono debe tener entre 1 y 10 caracteres'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('El color debe ser un código hexadecimal válido'),
  handleValidationErrors
];

// Validaciones para parámetros de URL
const validateUUIDParam = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} debe ser un UUID válido`),
  handleValidationErrors
];

// Validaciones para queries
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100'),
  handleValidationErrors
];

const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio debe ser una fecha válida'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de fin debe ser una fecha válida'),
  handleValidationErrors
];

const validateExpenseFilters = [
  query('categoryId')
    .optional()
    .isUUID()
    .withMessage('ID de categoría inválido'),
  query('paidBy')
    .optional()
    .isUUID()
    .withMessage('ID de usuario inválido'),
  query('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La descripción no puede exceder 200 caracteres'),
  ...validateDateRange,
  ...validatePagination
];

// Middleware personalizado para validar que el monto sea positivo
const validatePositiveAmount = (req, res, next) => {
  if (req.body.amount && parseFloat(req.body.amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'El monto debe ser mayor a 0'
    });
  }
  next();
};

// Middleware para sanitizar datos
const sanitizeInput = (req, res, next) => {
  // Remover campos no permitidos del body
  const allowedFields = {
    user: ['name', 'email', 'password', 'currentPassword', 'newPassword'],
    group: ['name', 'description'],
    expense: ['description', 'amount', 'categoryId', 'groupId', 'paidBy', 'splitBetween'],
    category: ['name', 'icon', 'color']
  };

  // Determinar el tipo basado en la ruta
  let type = 'user';
  if (req.path.includes('/groups')) type = 'group';
  if (req.path.includes('/expenses')) type = 'expense';
  if (req.path.includes('/categories')) type = 'category';

  if (allowedFields[type] && req.body) {
    const sanitized = {};
    allowedFields[type].forEach(field => {
      if (req.body[field] !== undefined) {
        sanitized[field] = req.body[field];
      }
    });
    req.body = sanitized;
  }

  next();
};

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validatePasswordChange,
  validateGroupCreation,
  validateGroupUpdate,
  validateAddMember,
  validateUpdateMemberRole,
  validateExpenseCreation,
  validateExpenseUpdate,
  validateCategoryCreation,
  validateCategoryUpdate,
  validateUUIDParam,
  validatePagination,
  validateDateRange,
  validateExpenseFilters,
  validatePositiveAmount,
  sanitizeInput
};