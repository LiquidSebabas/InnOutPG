// src/routes/companies.js
import express from 'express';
import Database from '../models/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener todas las empresas
router.get('/', async (req, res) => {
  try {
    const companies = await Database.queryMany(
      'SELECT * FROM ino_empresas WHERE emp_is_active = true ORDER BY emp_nombre',
      []
    );
    res.json(companies);
  } catch (error) {
    console.error('Error obteniendo empresas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener áreas por empresa
router.get('/:companyId/areas', async (req, res) => {
  try {
    const { companyId } = req.params;
    const areas = await Database.queryMany(
      'SELECT * FROM ino_areas WHERE are_empresa_id = $1 AND are_is_active = true ORDER BY are_nombre',
      [companyId]
    );
    res.json(areas);
  } catch (error) {
    console.error('Error obteniendo áreas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todas las áreas con información de empresa
router.get('/areas', async (req, res) => {
  try {
    const areas = await Database.queryMany(`
      SELECT 
        a.*,
        e.emp_nombre as empresa_nombre
      FROM ino_areas a
      JOIN ino_empresas e ON a.are_empresa_id = e.emp_id
      WHERE a.are_is_active = true AND e.emp_is_active = true
      ORDER BY e.emp_nombre, a.are_nombre
    `);
    res.json(areas);
  } catch (error) {
    console.error('Error obteniendo áreas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear empresa (solo admin)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { emp_nombre, emp_telefono, emp_direccion } = req.body;
    
    const newCompany = await Database.queryOne(
      'INSERT INTO ino_empresas (emp_nombre, emp_telefono, emp_direccion) VALUES ($1, $2, $3) RETURNING *',
      [emp_nombre, emp_telefono || null, emp_direccion || null]
    );
    
    res.status(201).json({
      message: 'Empresa creada exitosamente',
      company: newCompany
    });
  } catch (error) {
    console.error('Error creando empresa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear área (solo admin)
router.post('/:companyId/areas', requireAdmin, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { are_nombre, are_descripcion } = req.body;
    
    const newArea = await Database.queryOne(
      'INSERT INTO ino_areas (are_empresa_id, are_nombre, are_descripcion) VALUES ($1, $2, $3) RETURNING *',
      [companyId, are_nombre, are_descripcion || null]
    );
    
    res.status(201).json({
      message: 'Área creada exitosamente',
      area: newArea
    });
  } catch (error) {
    console.error('Error creando área:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;