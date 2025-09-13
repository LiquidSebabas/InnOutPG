// src/routes/shifts.js
import express from 'express';
import ShiftController from '../controllers/shiftController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateShift, validateUUID } from '../middleware/validation.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas GET - todos pueden leer
router.get('/', ShiftController.getShiftsForCalendar);        // Para el frontend
router.get('/assignments', ShiftController.getAssignments);  // Para uso interno/admin
router.get('/available', ShiftController.getAvailableShifts);
router.get('/check-availability', ShiftController.checkEmployeeAvailability);
router.get('/:id', validateUUID('id'), ShiftController.getAssignmentById);

// Rutas de escritura - solo admin/hr
router.post('/', requireAdmin, validateShift, ShiftController.createShiftWithAssignment);
router.put('/:id/status', requireAdmin, validateUUID('id'), ShiftController.updateAssignmentStatus);
router.put('/:id/cancel', authenticateToken, validateUUID('id'), ShiftController.cancelAssignment);

export default router;