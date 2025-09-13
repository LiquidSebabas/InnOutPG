// src/controllers/companyController.js
import Database from '../models/database.js';

class CompanyController {
  // Obtener todas las empresas
  static async getAll(req, res) {
    try {
      const companies = await Database.queryMany(
        'SELECT * FROM ino_empresas WHERE emp_is_active = true ORDER BY emp_nombre',
        []
      );
      
      res.json({
        companies,
        total: companies.length
      });
    } catch (error) {
      console.error('Error obteniendo empresas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener empresa por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const company = await Database.queryOne(
        'SELECT * FROM ino_empresas WHERE emp_id = $1 AND emp_is_active = true',
        [id]
      );

      if (!company) {
        return res.status(404).json({ error: 'Empresa no encontrada' });
      }

      res.json(company);
    } catch (error) {
      console.error('Error obteniendo empresa:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Crear empresa
  static async create(req, res) {
    try {
      const { emp_nombre, emp_telefono, emp_direccion } = req.body;
      
      if (!emp_nombre?.trim()) {
        return res.status(400).json({ error: 'El nombre de la empresa es requerido' });
      }

      const newCompany = await Database.queryOne(
        'INSERT INTO ino_empresas (emp_nombre, emp_telefono, emp_direccion) VALUES ($1, $2, $3) RETURNING *',
        [emp_nombre.trim(), emp_telefono || null, emp_direccion || null]
      );
      
      res.status(201).json({
        message: 'Empresa creada exitosamente',
        company: newCompany
      });
    } catch (error) {
      console.error('Error creando empresa:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Actualizar empresa
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { emp_nombre, emp_telefono, emp_direccion } = req.body;

      if (!emp_nombre?.trim()) {
        return res.status(400).json({ error: 'El nombre de la empresa es requerido' });
      }

      const updatedCompany = await Database.queryOne(
        `UPDATE ino_empresas 
         SET emp_nombre = $1, emp_telefono = $2, emp_direccion = $3
         WHERE emp_id = $4 AND emp_is_active = true 
         RETURNING *`,
        [emp_nombre.trim(), emp_telefono || null, emp_direccion || null, id]
      );

      if (!updatedCompany) {
        return res.status(404).json({ error: 'Empresa no encontrada' });
      }

      res.json({
        message: 'Empresa actualizada exitosamente',
        company: updatedCompany
      });
    } catch (error) {
      console.error('Error actualizando empresa:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Desactivar empresa
  static async deactivate(req, res) {
    try {
      const { id } = req.params;

      const deactivatedCompany = await Database.queryOne(
        'UPDATE ino_empresas SET emp_is_active = false WHERE emp_id = $1 RETURNING emp_id, emp_nombre',
        [id]
      );

      if (!deactivatedCompany) {
        return res.status(404).json({ error: 'Empresa no encontrada' });
      }

      res.json({
        message: 'Empresa desactivada exitosamente',
        company: deactivatedCompany
      });
    } catch (error) {
      console.error('Error desactivando empresa:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener áreas de una empresa
  static async getAreas(req, res) {
    try {
      const { companyId } = req.params;
      
      const areas = await Database.queryMany(
        'SELECT * FROM ino_areas WHERE are_empresa_id = $1 AND are_is_active = true ORDER BY are_nombre',
        [companyId]
      );
      
      res.json({
        areas,
        total: areas.length,
        companyId
      });
    } catch (error) {
      console.error('Error obteniendo áreas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Crear área para una empresa
  static async createArea(req, res) {
    try {
      const { companyId } = req.params;
      const { are_nombre, are_descripcion } = req.body;
      
      if (!are_nombre?.trim()) {
        return res.status(400).json({ error: 'El nombre del área es requerido' });
      }

      // Verificar que la empresa existe
      const company = await Database.queryOne(
        'SELECT emp_id FROM ino_empresas WHERE emp_id = $1 AND emp_is_active = true',
        [companyId]
      );

      if (!company) {
        return res.status(404).json({ error: 'Empresa no encontrada' });
      }

      const newArea = await Database.queryOne(
        'INSERT INTO ino_areas (are_empresa_id, are_nombre, are_descripcion) VALUES ($1, $2, $3) RETURNING *',
        [companyId, are_nombre.trim(), are_descripcion || null]
      );
      
      res.status(201).json({
        message: 'Área creada exitosamente',
        area: newArea
      });
    } catch (error) {
      console.error('Error creando área:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

export default CompanyController;