// src/controllers/shiftController.js
import Database from '../models/database.js';
import { timesOverlap, timeToMinutes } from '../utils/dateUtils.js';

class ShiftController {
  // Obtener asignaciones con filtros
  static async getAssignments(req, res) {
    try {
      const { 
        startDate, 
        endDate, 
        employeeId, 
        empresaId, 
        areaId, 
        estado,
        limit = 50,
        offset = 0 
      } = req.query;

      let query = `
        SELECT 
          ag.*,
          t.tur_fecha,
          t.tur_hora_inicio,
          t.tur_hora_fin,
          t.tur_puesto,
          t.tur_notas,
          e.empl_nombre_completo as empleado_nombre,
          e.empl_telefono as empleado_telefono,
          emp.emp_nombre as empresa_nombre,
          a.are_nombre as area_nombre
        FROM ino_agendar_turnos ag
        JOIN ino_turnos t ON ag.age_turno_id = t.tur_id
        JOIN ino_empleados e ON ag.age_empleado_id = e.empl_id
        JOIN ino_empresas emp ON t.tur_empresa_id = emp.emp_id
        JOIN ino_areas a ON t.tur_area_id = a.are_id
        WHERE e.empl_deleted_at IS NULL
      `;

      const params = [];
      let paramIndex = 1;

      // Aplicar filtros
      if (startDate) {
        query += ` AND ag.age_fecha >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND ag.age_fecha <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      if (employeeId) {
        query += ` AND ag.age_empleado_id = $${paramIndex}`;
        params.push(employeeId);
        paramIndex++;
      }

      if (empresaId) {
        query += ` AND t.tur_empresa_id = $${paramIndex}`;
        params.push(empresaId);
        paramIndex++;
      }

      if (areaId) {
        query += ` AND t.tur_area_id = $${paramIndex}`;
        params.push(areaId);
        paramIndex++;
      }

      if (estado) {
        query += ` AND ag.age_estado_asignacion = $${paramIndex}`;
        params.push(estado);
        paramIndex++;
      }

      // Agregar límite y offset
      query += ` ORDER BY ag.age_fecha DESC, t.tur_hora_inicio DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), parseInt(offset));

      const assignments = await Database.queryMany(query, params);

      // Query para contar total (sin limit/offset)
      let countQuery = query.split('ORDER BY')[0].replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
      const countParams = params.slice(0, -2); // Remover limit y offset
      const totalResult = await Database.queryOne(countQuery, countParams);

      res.json({
        assignments,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: parseInt(totalResult.count),
          hasMore: (parseInt(offset) + parseInt(limit)) < parseInt(totalResult.count)
        },
        filters: { startDate, endDate, employeeId, empresaId, areaId, estado }
      });

    } catch (error) {
      console.error('Error obteniendo asignaciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Crear turno con asignación
  static async createShiftWithAssignment(req, res) {
  try {
    console.log('📦 Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    // El frontend envía directamente los datos, no en shiftData y employeeId
    const { 
      empleado_id,
      fecha,
      hora_inicio,
      hora_fin,
      tipo,
      notas,
      empresa_id,
      area_id
    } = req.body;
    
    // Validaciones básicas
    if (!empleado_id || !fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({
        error: 'Se requieren: empleado_id, fecha, hora_inicio y hora_fin'
      });
    }

    // Si no vienen empresa_id y area_id, usar defaults
    const defaultEmpresa = empresa_id || 'TU_EMPRESA_ID_DEFAULT'; // Necesitas poner un UUID real aquí
    const defaultArea = area_id || 'TU_AREA_ID_DEFAULT'; // Necesitas poner un UUID real aquí

    // Validar que el empleado existe
    const employee = await Database.queryOne(
      'SELECT empl_id FROM ino_empleados WHERE empl_id = $1 AND empl_deleted_at IS NULL',
      [empleado_id]
    );

    if (!employee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Validar traslape de horarios
    const hasOverlap = await ShiftController.validateShiftOverlap(
      empleado_id,
      fecha,
      hora_inicio,
      hora_fin
    );

    if (hasOverlap) {
      return res.status(409).json({
        error: 'El empleado ya tiene un turno asignado que se traslapa en ese horario'
      });
    }

    // Usar transacción
    const result = await Database.transaction(async (client) => {
      // Crear turno
      const newShift = await client.query(
        `INSERT INTO ino_turnos (
          tur_fecha, tur_hora_inicio, tur_hora_fin, 
          tur_empresa_id, tur_area_id, tur_puesto, tur_notas
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          fecha,
          hora_inicio,
          hora_fin,
          defaultEmpresa,
          defaultArea,
          null,
          notas || null
        ]
      );

      const shift = newShift.rows[0];

      // Crear asignación
      const newAssignment = await client.query(
        `INSERT INTO ino_agendar_turnos (
          age_turno_id, age_empleado_id, age_fecha, 
          age_estado_asignacion, age_rol_en_turno
        ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          shift.tur_id,
          empleado_id,
          fecha,
          'asignado',
          null
        ]
      );

      return {
        shift,
        assignment: newAssignment.rows[0]
      };
    });

    res.status(201).json({
      message: 'Turno creado y asignado exitosamente',
      shift: {
        tur_id: result.shift.tur_id,
        // ... otros campos que el frontend espera
      }
    });

  } catch (error) {
    console.error('Error creando turno:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}

  // Validar traslape de horarios
  static async validateShiftOverlap(employeeId, fecha, horaInicio, horaFin, excludeAssignmentId = null) {
    try {
      let query = `
        SELECT 
          ag.age_id,
          t.tur_hora_inicio,
          t.tur_hora_fin
        FROM ino_agendar_turnos ag
        JOIN ino_turnos t ON ag.age_turno_id = t.tur_id
        WHERE ag.age_empleado_id = $1 
        AND ag.age_fecha = $2 
        AND ag.age_estado_asignacion != 'cancelado'
      `;

      const params = [employeeId, fecha];

      if (excludeAssignmentId) {
        query += ' AND ag.age_id != $3';
        params.push(excludeAssignmentId);
      }

      const existingAssignments = await Database.queryMany(query, params);

      // Verificar traslapes usando la función utilitaria
      for (const assignment of existingAssignments) {
        if (timesOverlap(
          { start: assignment.tur_hora_inicio, end: assignment.tur_hora_fin },
          { start: horaInicio, end: horaFin }
        )) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error validando traslape:', error);
      throw error;
    }
  }

  // Actualizar estado de asignación
  static async updateAssignmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { estado, motivo } = req.body;

      const validStates = ['asignado', 'completado', 'cancelado', 'ausente'];
      if (!validStates.includes(estado)) {
        return res.status(400).json({ 
          error: `Estado inválido. Estados válidos: ${validStates.join(', ')}` 
        });
      }

      const updatedAssignment = await Database.queryOne(
        `UPDATE ino_agendar_turnos 
         SET age_estado_asignacion = $1, age_motivo = $2
         WHERE age_id = $3 
         RETURNING *`,
        [estado, motivo || null, id]
      );

      if (!updatedAssignment) {
        return res.status(404).json({ error: 'Asignación no encontrada' });
      }

      res.json({
        message: 'Estado actualizado exitosamente',
        assignment: updatedAssignment
      });

    } catch (error) {
      console.error('Error actualizando estado:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener asignación por ID
  static async getAssignmentById(req, res) {
    try {
      const { id } = req.params;

      const assignment = await Database.queryOne(`
        SELECT 
          ag.*,
          t.*,
          e.empl_nombre_completo as empleado_nombre,
          e.empl_telefono as empleado_telefono,
          e.empl_email as empleado_email,
          emp.emp_nombre as empresa_nombre,
          a.are_nombre as area_nombre
        FROM ino_agendar_turnos ag
        JOIN ino_turnos t ON ag.age_turno_id = t.tur_id
        JOIN ino_empleados e ON ag.age_empleado_id = e.empl_id
        JOIN ino_empresas emp ON t.tur_empresa_id = emp.emp_id
        JOIN ino_areas a ON t.tur_area_id = a.are_id
        WHERE ag.age_id = $1
      `, [id]);

      if (!assignment) {
        return res.status(404).json({ error: 'Asignación no encontrada' });
      }

      res.json(assignment);

    } catch (error) {
      console.error('Error obteniendo asignación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Cancelar asignación
  static async cancelAssignment(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      const cancelledAssignment = await Database.queryOne(
        `UPDATE ino_agendar_turnos 
         SET age_estado_asignacion = 'cancelado', age_motivo = $1
         WHERE age_id = $2 
         RETURNING *`,
        [motivo || 'Cancelado por administrador', id]
      );

      if (!cancelledAssignment) {
        return res.status(404).json({ error: 'Asignación no encontrada' });
      }

      res.json({
        message: 'Asignación cancelada exitosamente',
        assignment: cancelledAssignment
      });

    } catch (error) {
      console.error('Error cancelando asignación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener turnos disponibles (sin asignar)
  static async getAvailableShifts(req, res) {
    try {
      const { fecha, empresaId, areaId } = req.query;

      let query = `
        SELECT 
          t.*,
          emp.emp_nombre as empresa_nombre,
          a.are_nombre as area_nombre,
          COUNT(ag.age_id) as asignaciones_count
        FROM ino_turnos t
        JOIN ino_empresas emp ON t.tur_empresa_id = emp.emp_id
        JOIN ino_areas a ON t.tur_area_id = a.are_id
        LEFT JOIN ino_agendar_turnos ag ON t.tur_id = ag.age_turno_id 
          AND ag.age_estado_asignacion != 'cancelado'
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (fecha) {
        query += ` AND t.tur_fecha = $${paramIndex}`;
        params.push(fecha);
        paramIndex++;
      }

      if (empresaId) {
        query += ` AND t.tur_empresa_id = $${paramIndex}`;
        params.push(empresaId);
        paramIndex++;
      }

      if (areaId) {
        query += ` AND t.tur_area_id = $${paramIndex}`;
        params.push(areaId);
        paramIndex++;
      }

      query += `
        GROUP BY t.tur_id, emp.emp_nombre, a.are_nombre
        ORDER BY t.tur_fecha, t.tur_hora_inicio
      `;

      const shifts = await Database.queryMany(query, params);

      res.json({
        shifts,
        filters: { fecha, empresaId, areaId },
        total: shifts.length
      });

    } catch (error) {
      console.error('Error obteniendo turnos disponibles:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Verificar disponibilidad de empleado
  static async checkEmployeeAvailability(req, res) {
    try {
      const { employeeId, fecha, horaInicio, horaFin } = req.query;

      if (!employeeId || !fecha || !horaInicio || !horaFin) {
        return res.status(400).json({
          error: 'Se requieren: employeeId, fecha, horaInicio, horaFin'
        });
      }

      const hasOverlap = await ShiftController.validateShiftOverlap(
        employeeId, fecha, horaInicio, horaFin
      );

      // Obtener turnos existentes del empleado en esa fecha
      const existingShifts = await Database.queryMany(`
        SELECT 
          ag.*,
          t.tur_hora_inicio,
          t.tur_hora_fin,
          emp.emp_nombre as empresa_nombre,
          a.are_nombre as area_nombre
        FROM ino_agendar_turnos ag
        JOIN ino_turnos t ON ag.age_turno_id = t.tur_id
        JOIN ino_empresas emp ON t.tur_empresa_id = emp.emp_id
        JOIN ino_areas a ON t.tur_area_id = a.are_id
        WHERE ag.age_empleado_id = $1 
        AND ag.age_fecha = $2 
        AND ag.age_estado_asignacion != 'cancelado'
        ORDER BY t.tur_hora_inicio
      `, [employeeId, fecha]);

      res.json({
        available: !hasOverlap,
        employeeId,
        fecha,
        proposedTime: { horaInicio, horaFin },
        existingShifts,
        message: hasOverlap ? 'El empleado tiene conflictos de horario' : 'El empleado está disponible'
      });

    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener turnos para el calendario (método para el frontend)
  static async getShiftsForCalendar(req, res) {
  try {
    const shifts = await Database.queryMany(`
      SELECT 
        ag.age_id,
        t.tur_id,
        t.tur_fecha,
        t.tur_hora_inicio,
        t.tur_hora_fin,
        t.tur_notas,
        t.tur_puesto,
        e.empl_nombre_completo as empleado_nombre,
        ag.age_empleado_id as empleado_id,
        ag.age_estado_asignacion as estado,
        ag.age_rol_en_turno as rol,
        ag.age_motivo as motivo_cancelacion,
        CASE 
          WHEN t.tur_hora_inicio >= '06:00' AND t.tur_hora_inicio < '14:00' THEN 'matutino'
          WHEN t.tur_hora_inicio >= '14:00' AND t.tur_hora_inicio < '22:00' THEN 'vespertino'  
          WHEN t.tur_hora_inicio >= '22:00' OR t.tur_hora_inicio < '06:00' THEN 'nocturno'
          ELSE 'regular'
        END as tipo,
        emp.emp_nombre as empresa,
        a.are_nombre as area
      FROM ino_agendar_turnos ag
      JOIN ino_turnos t ON ag.age_turno_id = t.tur_id  
      JOIN ino_empleados e ON ag.age_empleado_id = e.empl_id
      LEFT JOIN ino_empresas emp ON t.tur_empresa_id = emp.emp_id
      LEFT JOIN ino_areas a ON t.tur_area_id = a.are_id
      WHERE e.empl_deleted_at IS NULL
      ORDER BY t.tur_fecha DESC, t.tur_hora_inicio
    `);

    const transformedShifts = shifts.map(shift => ({
      tur_id: shift.age_id || shift.tur_id, // Usar age_id como ID principal
      tur_fecha: shift.tur_fecha,
      tur_hora_inicio: shift.tur_hora_inicio,
      tur_hora_fin: shift.tur_hora_fin,
      tur_notas: shift.tur_notas,
      tur_puesto: shift.tur_puesto,
      empleado_nombre: shift.empleado_nombre,
      empleado_id: shift.empleado_id,
      estado: shift.estado,
      tipo: shift.tipo,
      motivo_cancelacion: shift.motivo_cancelacion,
      empresa: shift.empresa,
      area: shift.area
    }));

    console.log(`📅 Enviando ${transformedShifts.length} turnos al frontend`);
    res.json({ shifts: transformedShifts });
  } catch (error) {
    console.error('Error obteniendo turnos para calendario:', error);
    res.status(500).json({ error: 'Error al obtener turnos' });
  }
}

// Crear turno con asignación (ACTUALIZADO)
static async createShiftWithAssignment(req, res) {
  try {
    console.log('📦 Datos recibidos del frontend:', JSON.stringify(req.body, null, 2));
    
    const { 
      empleado_id,
      fecha,
      hora_inicio,
      hora_fin,
      tipo,
      notas
    } = req.body;
    
    // Validaciones básicas
    if (!empleado_id || !fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({
        error: 'Se requieren: empleado_id, fecha, hora_inicio y hora_fin'
      });
    }

    // Usar IDEALSA y Recursos Humanos como defaults
    const defaultEmpresa = 'a64e65f2-40be-432b-abd3-02555b21c4ce'; // IDEALSA
    const defaultArea = 'db5ecbcb-e67e-4aee-84d0-176c96910cc7'; // Recursos Humanos

    // Validar que el empleado existe
    const employee = await Database.queryOne(
      'SELECT empl_id, empl_nombre_completo FROM ino_empleados WHERE empl_id = $1 AND empl_deleted_at IS NULL',
      [empleado_id]
    );

    if (!employee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Validar traslape de horarios
    const hasOverlap = await ShiftController.validateShiftOverlap(
      empleado_id,
      fecha,
      hora_inicio,
      hora_fin
    );

    if (hasOverlap) {
      return res.status(409).json({
        error: 'El empleado ya tiene un turno asignado que se traslapa en ese horario'
      });
    }

    // Usar transacción
    const result = await Database.transaction(async (client) => {
      // Crear turno
      const newShift = await client.query(
        `INSERT INTO ino_turnos (
          tur_fecha, tur_hora_inicio, tur_hora_fin, 
          tur_empresa_id, tur_area_id, tur_puesto, tur_notas
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          fecha,
          hora_inicio,
          hora_fin,
          defaultEmpresa,
          defaultArea,
          null,
          notas || null
        ]
      );

      const shift = newShift.rows[0];

      // Crear asignación
      const newAssignment = await client.query(
        `INSERT INTO ino_agendar_turnos (
          age_turno_id, age_empleado_id, age_fecha, 
          age_estado_asignacion, age_rol_en_turno
        ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          shift.tur_id,
          empleado_id,
          fecha,
          'asignado',
          null
        ]
      );

      return {
        shift,
        assignment: newAssignment.rows[0],
        employee
      };
    });

    // Responder con el formato que espera el frontend
    res.status(201).json({
      message: 'Turno creado y asignado exitosamente',
      shift: {
        tur_id: result.assignment.age_id, // Usar age_id como ID principal
        tur_fecha: result.shift.tur_fecha,
        tur_hora_inicio: result.shift.tur_hora_inicio,
        tur_hora_fin: result.shift.tur_hora_fin,
        empleado_nombre: result.employee.empl_nombre_completo,
        empleado_id: empleado_id,
        tipo: tipo || 'regular',
        estado: 'asignado',
        tur_notas: notas
      }
    });

  } catch (error) {
    console.error('Error creando turno:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}

// Cancelar turno (ACTUALIZADO para manejar age_id)
static async cancelAssignment(req, res) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const cancelledAssignment = await Database.queryOne(
      `UPDATE ino_agendar_turnos 
       SET age_estado_asignacion = 'cancelado', age_motivo = $1, age_updated_at = NOW()
       WHERE age_id = $2 
       RETURNING *`,
      [motivo || 'Cancelado por administrador', id]
    );

    if (!cancelledAssignment) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    res.json({
      message: 'Turno cancelado exitosamente',
      assignment: cancelledAssignment
    });

  } catch (error) {
    console.error('Error cancelando turno:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
}

export default ShiftController;