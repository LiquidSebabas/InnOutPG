// src/routes/employees.js
import express from 'express';
import EmployeeController from '../controllers/employeeController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateUUID } from '../middleware/validation.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas especiales primero
router.get('/expiring-documents', EmployeeController.getExpiringDocuments);
router.post('/check-email', EmployeeController.checkEmailExists);

// Rutas GET - todos pueden leer
router.get('/', EmployeeController.getAll);
router.get('/:id', validateUUID('id'), EmployeeController.getById);

// Rutas de escritura - solo admin/hr (sin validateEmployee por ahora)
router.post('/', requireAdmin, EmployeeController.create);
router.put('/:id', requireAdmin, validateUUID('id'), EmployeeController.update);
router.delete('/:id', requireAdmin, validateUUID('id'), EmployeeController.delete);

export default router;