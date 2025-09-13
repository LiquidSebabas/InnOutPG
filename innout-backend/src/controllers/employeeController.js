// src/controllers/employeeController.js - Actualizado con papelería
import Database from '../models/database.js';

class EmployeeController {
  // Obtener todos los empleados con papelería
  static async getAll(req, res) {
    try {
      const { search, limit = 50, offset = 0 } = req.query;

      let query = `
        SELECT 
          e.empl_id,
          e.empl_nombre_completo,
          e.empl_telefono,
          e.empl_email,
          e.empl_fecha_nacimiento,
          e.empl_fecha_contratacion,
          e.empl_fecha_baja,
          e.empl_created_at,
          e.empl_updated_at,
          
          -- Información de papelería
          p.pap_judicial,
          p.pap_policia,
          p.pap_salud_emision,
          p.pap_salud_vencimiento,
          p.pap_alimentos_emision,
          p.pap_alimentos_vencimiento,
          p.pap_pulmones_emision,
          p.pap_pulmones_vencimiento,
          
          -- Estado consolidado
          ep.est_vencimiento_consolidado,
          ep.est_estado,
          ep.est_alertar_desde_consolidado
          
        FROM ino_empleados e
        LEFT JOIN ino_papeleria p ON e.empl_id = p.pap_empleado_id
        LEFT JOIN ino_estado_papeleria ep ON e.empl_id = ep.est_empleado_id
        WHERE e.empl_deleted_at IS NULL
      `;

      const params = [];

      // Búsqueda por nombre
      if (search) {
        query += ' AND e.empl_nombre_completo_lower ILIKE $1';
        params.push(`%${search.toLowerCase()}%`);
      }

      query += ' ORDER BY e.empl_nombre_completo LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(parseInt(limit), parseInt(offset));

      const employees = await Database.queryMany(query, params);

      // Contar total para paginación
      let countQuery = 'SELECT COUNT(*) FROM ino_empleados WHERE empl_deleted_at IS NULL';
      const countParams = [];
      
      if (search) {
        countQuery += ' AND empl_nombre_completo_lower ILIKE $1';
        countParams.push(`%${search.toLowerCase()}%`);
      }

      const totalResult = await Database.queryOne(countQuery, countParams);
      const total = parseInt(totalResult.count);

      res.json({
        employees,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      });

    } catch (error) {
      console.error('Error obteniendo empleados:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener empleado por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const employee = await Database.queryOne(`
        SELECT 
          e.*,
          p.*,
          ep.*
        FROM ino_empleados e
        LEFT JOIN ino_papeleria p ON e.empl_id = p.pap_empleado_id
        LEFT JOIN ino_estado_papeleria ep ON e.empl_id = ep.est_empleado_id
        WHERE e.empl_id = $1 AND e.empl_deleted_at IS NULL
      `, [id]);

      if (!employee) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      res.json(employee);

    } catch (error) {
      console.error('Error obteniendo empleado:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Crear empleado con papelería
  static async create(req, res) {
    try {
      const employeeData = req.body;
      
      // Validaciones básicas
      if (!employeeData.empl_nombre_completo || !employeeData.empl_email) {
        return res.status(400).json({ 
          error: 'Nombre completo y email son requeridos' 
        });
      }

      // Usar transacción para crear empleado y papelería
      const result = await Database.transaction(async (client) => {
        // 1. Crear empleado
        const newEmployee = await client.query(
          `INSERT INTO ino_empleados (
            empl_nombre_completo, 
            empl_nombre_completo_lower,
            empl_email, 
            empl_telefono, 
            empl_fecha_nacimiento, 
            empl_fecha_contratacion,
            empl_fecha_baja
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
          RETURNING *`,
          [
            employeeData.empl_nombre_completo,
            employeeData.empl_nombre_completo.toLowerCase(), // Generar automáticamente
            employeeData.empl_email,
            employeeData.empl_telefono || null,
            employeeData.empl_fecha_nacimiento || null,
            employeeData.empl_fecha_contratacion || new Date().toISOString().split('T')[0],
            employeeData.empl_fecha_baja || null
          ]
        );

        const employee = newEmployee.rows[0];

        // 2. Crear registro de papelería
        const papeleria = employeeData.papeleria || {};
        
        await client.query(
          `INSERT INTO ino_papeleria (
            pap_empleado_id, 
            pap_judicial, 
            pap_policia,
            pap_salud_emision,
            pap_salud_vencimiento,
            pap_alimentos_emision,
            pap_alimentos_vencimiento,
            pap_pulmones_emision,
            pap_pulmones_vencimiento
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            employee.empl_id,
            papeleria.pap_judicial || false,
            papeleria.pap_policia || false,
            papeleria.pap_salud_emision || null,
            papeleria.pap_salud_vencimiento || null,
            papeleria.pap_alimentos_emision || null,
            papeleria.pap_alimentos_vencimiento || null,
            papeleria.pap_pulmones_emision || null,
            papeleria.pap_pulmones_vencimiento || null
          ]
        );

        // 3. Calcular y crear estado de papelería consolidado
        await EmployeeController.calculatePapeleriaStatus(client, employee.empl_id);

        // 4. Obtener el empleado completo con papelería para retornar
        const completeEmployee = await client.query(`
          SELECT 
            e.*,
            p.pap_judicial,
            p.pap_policia,
            p.pap_salud_emision,
            p.pap_salud_vencimiento,
            p.pap_alimentos_emision,
            p.pap_alimentos_vencimiento,
            p.pap_pulmones_emision,
            p.pap_pulmones_vencimiento,
            ep.est_estado,
            ep.est_vencimiento_consolidado
          FROM ino_empleados e
          LEFT JOIN ino_papeleria p ON e.empl_id = p.pap_empleado_id
          LEFT JOIN ino_estado_papeleria ep ON e.empl_id = ep.est_empleado_id
          WHERE e.empl_id = $1
        `, [employee.empl_id]);

        return completeEmployee.rows[0];
      });

      res.status(201).json({
        message: 'Empleado creado exitosamente',
        employee: result
      });

    } catch (error) {
      console.error('Error creando empleado:', error);
      
      // Manejar errores específicos de PostgreSQL
      if (error.code === '23505') { // Violación de constraint unique
        if (error.constraint === 'ino_empleados_empl_email_key') {
          return res.status(400).json({ 
            error: 'Este email ya está registrado. Por favor usa un email diferente.'
          });
        }
        if (error.constraint === 'ino_empleados_empl_telefono_key') {
          return res.status(400).json({ 
            error: 'Este teléfono ya está registrado. Por favor usa un teléfono diferente.'
          });
        }
      }
      
      if (error.code === '23502') { // Campo NOT NULL violado
        return res.status(400).json({ 
          error: 'Faltan campos requeridos.'
        });
      }

      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Actualizar empleado con papelería
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const result = await Database.transaction(async (client) => {
        // 1. Actualizar datos del empleado
        const updatedEmployee = await client.query(
          `UPDATE ino_empleados 
           SET empl_nombre_completo = $1,
               empl_nombre_completo_lower = $2,
               empl_email = $3,
               empl_telefono = $4,
               empl_fecha_nacimiento = $5,
               empl_fecha_contratacion = $6,
               empl_fecha_baja = $7,
               empl_updated_at = NOW()
           WHERE empl_id = $8 AND empl_deleted_at IS NULL
           RETURNING *`,
          [
            updates.empl_nombre_completo,
            updates.empl_nombre_completo.toLowerCase(),
            updates.empl_email,
            updates.empl_telefono || null,
            updates.empl_fecha_nacimiento || null,
            updates.empl_fecha_contratacion || null,
            updates.empl_fecha_baja || null,
            id
          ]
        );

        if (updatedEmployee.rows.length === 0) {
          throw new Error('Empleado no encontrado');
        }

        // 2. Actualizar papelería si se proporciona
        if (updates.papeleria) {
          const papeleria = updates.papeleria;
          
          await client.query(
            `UPDATE ino_papeleria 
             SET pap_judicial = $1,
                 pap_policia = $2,
                 pap_salud_emision = $3,
                 pap_salud_vencimiento = $4,
                 pap_alimentos_emision = $5,
                 pap_alimentos_vencimiento = $6,
                 pap_pulmones_emision = $7,
                 pap_pulmones_vencimiento = $8,
                 pap_updated_at = NOW()
             WHERE pap_empleado_id = $9`,
            [
              papeleria.pap_judicial || false,
              papeleria.pap_policia || false,
              papeleria.pap_salud_emision || null,
              papeleria.pap_salud_vencimiento || null,
              papeleria.pap_alimentos_emision || null,
              papeleria.pap_alimentos_vencimiento || null,
              papeleria.pap_pulmones_emision || null,
              papeleria.pap_pulmones_vencimiento || null,
              id
            ]
          );

          // 3. Recalcular estado de papelería
          await EmployeeController.calculatePapeleriaStatus(client, id);
        }

        // 4. Obtener empleado completo actualizado
        const completeEmployee = await client.query(`
          SELECT 
            e.*,
            p.pap_judicial,
            p.pap_policia,
            p.pap_salud_emision,
            p.pap_salud_vencimiento,
            p.pap_alimentos_emision,
            p.pap_alimentos_vencimiento,
            p.pap_pulmones_emision,
            p.pap_pulmones_vencimiento,
            ep.est_estado,
            ep.est_vencimiento_consolidado
          FROM ino_empleados e
          LEFT JOIN ino_papeleria p ON e.empl_id = p.pap_empleado_id
          LEFT JOIN ino_estado_papeleria ep ON e.empl_id = ep.est_empleado_id
          WHERE e.empl_id = $1
        `, [id]);

        return completeEmployee.rows[0];
      });

      res.json({
        message: 'Empleado actualizado exitosamente',
        employee: result
      });

    } catch (error) {
      console.error('Error actualizando empleado:', error);
      
      if (error.message === 'Empleado no encontrado') {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }
      
      // Manejar errores de constraint unique
      if (error.code === '23505') {
        if (error.constraint === 'ino_empleados_empl_email_key') {
          return res.status(400).json({ 
            error: 'Este email ya está registrado por otro empleado.'
          });
        }
        if (error.constraint === 'ino_empleados_empl_telefono_key') {
          return res.status(400).json({ 
            error: 'Este teléfono ya está registrado por otro empleado.'
          });
        }
      }

      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Eliminar empleado (soft delete)
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const deletedEmployee = await Database.queryOne(
        'UPDATE ino_empleados SET empl_deleted_at = NOW() WHERE empl_id = $1 AND empl_deleted_at IS NULL RETURNING empl_id, empl_nombre_completo',
        [id]
      );

      if (!deletedEmployee) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      res.json({
        message: 'Empleado eliminado exitosamente',
        employee: deletedEmployee
      });

    } catch (error) {
      console.error('Error eliminando empleado:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Función auxiliar para calcular estado consolidado de papelería
  static async calculatePapeleriaStatus(client, empleadoId) {
    try {
      // Obtener fechas de vencimiento de todos los documentos
      const papeleria = await client.query(`
        SELECT 
          pap_salud_vencimiento,
          pap_alimentos_vencimiento,
          pap_pulmones_vencimiento
        FROM ino_papeleria 
        WHERE pap_empleado_id = $1
      `, [empleadoId]);

      if (papeleria.rows.length === 0) return;

      const docs = papeleria.rows[0];
      const today = new Date();
      const fechas = [
        docs.pap_salud_vencimiento,
        docs.pap_alimentos_vencimiento,
        docs.pap_pulmones_vencimiento
      ].filter(fecha => fecha !== null).map(fecha => new Date(fecha));

      let estado = 'vigente';
      let vencimientoConsolidado = null;
      let alertarDesde = null;

      if (fechas.length > 0) {
        // La fecha más próxima de vencimiento
        vencimientoConsolidado = new Date(Math.min(...fechas));
        
        // Calcular días hasta vencimiento
        const diasHastaVencimiento = Math.ceil((vencimientoConsolidado - today) / (1000 * 60 * 60 * 24));
        
        if (diasHastaVencimiento < 0) {
          estado = 'vencido';
        } else if (diasHastaVencimiento <= 30) {
          estado = 'por_vencer';
        }
        
        // Alertar 60 días antes del vencimiento
        alertarDesde = new Date(vencimientoConsolidado);
        alertarDesde.setDate(alertarDesde.getDate() - 60);
      }

      // Insertar o actualizar estado consolidado
      await client.query(`
        INSERT INTO ino_estado_papeleria 
        (est_empleado_id, est_vencimiento_consolidado, est_alertar_desde_consolidado, est_estado, est_calculated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (est_empleado_id) 
        DO UPDATE SET 
          est_vencimiento_consolidado = EXCLUDED.est_vencimiento_consolidado,
          est_alertar_desde_consolidado = EXCLUDED.est_alertar_desde_consolidado,
          est_estado = EXCLUDED.est_estado,
          est_calculated_at = NOW()
      `, [empleadoId, vencimientoConsolidado, alertarDesde, estado]);

    } catch (error) {
      console.error('Error calculando estado de papelería:', error);
      throw error;
    }
  }

  // Obtener empleados con documentos próximos a vencer
  static async getExpiringDocuments(req, res) {
    try {
      const { days = 30 } = req.query;

      const expiringEmployees = await Database.queryMany(`
        SELECT 
          e.empl_id,
          e.empl_nombre_completo,
          e.empl_email,
          ep.est_estado,
          ep.est_vencimiento_consolidado,
          p.pap_salud_vencimiento,
          p.pap_alimentos_vencimiento,
          p.pap_pulmones_vencimiento
        FROM ino_empleados e
        INNER JOIN ino_estado_papeleria ep ON e.empl_id = ep.est_empleado_id
        LEFT JOIN ino_papeleria p ON e.empl_id = p.pap_empleado_id
        WHERE e.empl_deleted_at IS NULL 
          AND ep.est_vencimiento_consolidado IS NOT NULL
          AND ep.est_vencimiento_consolidado <= (CURRENT_DATE + INTERVAL '${parseInt(days)} days')
        ORDER BY ep.est_vencimiento_consolidado ASC
      `);

      res.json({
        employees: expiringEmployees,
        total: expiringEmployees.length
      });

    } catch (error) {
      console.error('Error obteniendo documentos por vencer:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Endpoint para verificar si email existe (para validación en tiempo real)
  static async checkEmailExists(req, res) {
    try {
      const { email } = req.body;
      const { excludeId } = req.query; // Para excluir el empleado actual en edición

      let query = 'SELECT empl_id FROM ino_empleados WHERE empl_email = $1 AND empl_deleted_at IS NULL';
      const params = [email];

      if (excludeId) {
        query += ' AND empl_id != $2';
        params.push(excludeId);
      }

      const existing = await Database.queryOne(query, params);

      res.json({ exists: !!existing });

    } catch (error) {
      console.error('Error verificando email:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

export default EmployeeController;