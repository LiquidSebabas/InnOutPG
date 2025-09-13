// src/middleware/validation.js
import { body, param, query, validationResult } from 'express-validator';

// Manejar errores de validación
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: errors.array()
    });
  }
  next();
};

// Validaciones para empleados
export const validateEmployee = [
  body('empl_nombre_completo')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('El nombre debe tener entre 2 y 255 caracteres'),
  
  body('empl_email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('empl_telefono')
    .optional()
    .matches(/^\+502\d{8}$/)
    .withMessage('El teléfono debe tener formato +502XXXXXXXX'),
  
  handleValidationErrors
];

// Validaciones para turnos
export const validateShift = [
  body('shiftData.tur_fecha')
    .isISO8601()
    .withMessage('Fecha inválida'),
  
  body('shiftData.tur_hora_inicio')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora de inicio inválida'),
  
  body('shiftData.tur_hora_fin')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora de fin inválida'),
  
  body('employeeId')
    .isUUID()
    .withMessage('ID de empleado inválido'),
  
  handleValidationErrors
];

// Validaciones para UUID
export const validateUUID = (paramName) => [
  param(paramName).isUUID().withMessage(`${paramName} debe ser un UUID válido`),
  handleValidationErrors
];