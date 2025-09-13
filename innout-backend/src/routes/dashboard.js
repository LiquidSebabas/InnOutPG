// src/routes/dashboard.js
import express from 'express';
import Database from '../models/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/stats', async (req, res) => {
  try {
    const stats = await Database.queryOne(`
      SELECT 
        (SELECT COUNT(*) FROM ino_empleados WHERE empl_deleted_at IS NULL) as total_empleados,
        (SELECT COUNT(*) FROM ino_empresas WHERE emp_is_active = true) as total_empresas,
        (SELECT COUNT(*) FROM ino_areas WHERE are_is_active = true) as total_areas,
        (SELECT COUNT(*) FROM ino_turnos WHERE tur_fecha >= CURRENT_DATE) as turnos_futuros,
        (SELECT COUNT(*) FROM ino_agendar_turnos WHERE age_estado_asignacion = 'asignado') as asignaciones_activas,
        (SELECT COUNT(*) FROM ino_papeleria WHERE pap_salud_vencimiento <= CURRENT_DATE + INTERVAL '30 days') as documentos_por_vencer
    `);
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;