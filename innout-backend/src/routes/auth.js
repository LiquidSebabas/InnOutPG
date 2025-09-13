// src/routes/auth.js
import express from 'express';
import { body } from 'express-validator';
import AuthController from '../controllers/authController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Validaciones
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 1 }).withMessage('Contraseña requerida'),
  handleValidationErrors
];

const validatePasswordChange = [
  body('currentPassword').isLength({ min: 1 }).withMessage('Contraseña actual requerida'),
  body('newPassword').isLength({ min: 8 }).withMessage('Nueva contraseña debe tener mínimo 8 caracteres'),
  handleValidationErrors
];

// Rutas públicas
router.post('/login', validateLogin, AuthController.login);
router.post('/request-password-reset', AuthController.requestPasswordReset);

// Rutas protegidas
router.get('/verify', authenticateToken, AuthController.verifySession);
router.post('/logout', authenticateToken, AuthController.logout);
router.post('/change-password', authenticateToken, validatePasswordChange, AuthController.changePassword);
router.put('/profile', authenticateToken, AuthController.updateProfile);

export default router;