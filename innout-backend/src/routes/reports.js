// src/routes/reports.js
import express from 'express';
import ReportController from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de reportes
router.get('/dashboard-stats', ReportController.getDashboardStats);
router.get('/biweekly', ReportController.getBiweeklyReport);
router.get('/employees-by-area', ReportController.getEmployeesByArea);
router.get('/expiring-documents', ReportController.getExpiringDocuments);
router.get('/turnos-summary-by-company', ReportController.getTurnosSummaryByCompany);

export default router;