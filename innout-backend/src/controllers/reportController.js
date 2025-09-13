// src/controllers/reportController.js
import Database from '../models/database.js';

class ReportController {
  // Obtener estadísticas del dashboard
  static async getDashboardStats(req, res) {
    try {
      const stats = await Database.queryOne('SELECT * FROM get_dashboard_stats()');
      
      res.json({
        totalEmpleadosActivos: parseInt(stats.total_empleados_activos || 0),
        totalEmpresasActivas: parseInt(stats.total_empresas_activas || 0),
        turnosHoy: parseInt(stats.turnos_hoy || 0),
        documentosVencen30Dias: parseInt(stats.documentos_vencen_30_dias || 0),
        documentosVencidos: parseInt(stats.documentos_vencidos || 0),
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Reporte quincenal
  static async getBiweeklyReport(req, res) {
    try {
      const { startDate, endDate, empresaId, areaId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: 'Se requieren las fechas de inicio y fin (startDate, endDate)' 
        });
      }

      // Validar formato de fechas
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ 
          error: 'Formato de fecha inválido. Use YYYY-MM-DD' 
        });
      }

      if (start > end) {
        return res.status(400).json({ 
          error: 'La fecha de inicio debe ser menor o igual a la fecha de fin' 
        });
      }

      const reportData = await Database.queryMany(
        'SELECT * FROM get_biweekly_report($1, $2, $3, $4)',
        [startDate, endDate, empresaId || null, areaId || null]
      );

      // Calcular totales
      const totals = reportData.reduce((acc, row) => ({
        totalTurnos: acc.totalTurnos + parseInt(row.total_turnos || 0),
        turnosAsignados: acc.turnosAsignados + parseInt(row.turnos_asignados || 0),
        turnosCompletados: acc.turnosCompletados + parseInt(row.turnos_completados || 0),
        turnosCancelados: acc.turnosCancelados + parseInt(row.turnos_cancelados || 0),
        turnosAusente: acc.turnosAusente + parseInt(row.turnos_ausente || 0),
        horasTrabajadas: acc.horasTrabajadas + parseFloat(row.horas_trabajadas || 0)
      }), {
        totalTurnos: 0,
        turnosAsignados: 0,
        turnosCompletados: 0,
        turnosCancelados: 0,
        turnosAusente: 0,
        horasTrabajadas: 0
      });

      res.json({
        period: { startDate, endDate },
        filters: { empresaId, areaId },
        data: reportData,
        totals,
        employeeCount: reportData.length,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error generando reporte quincenal:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Reporte de empleados por área
  static async getEmployeesByArea(req, res) {
    try {
      const { empresaId, areaId } = req.query;

      let query = `
        SELECT 
          e.empl_id,
          e.empl_nombre_completo,
          e.empl_telefono,
          e.empl_email,
          e.empl_fecha_contratacion,
          e.empl_created_at,
          ep.est_estado as estado_documentos,
          ep.est_vencimiento_consolidado,
          COUNT(ag.age_id) FILTER (WHERE ag.age_fecha >= CURRENT_DATE - INTERVAL '30 days') as turnos_recientes,
          MAX(ag.age_fecha) as ultimo_turno
        FROM ino_empleados e
        LEFT JOIN ino_estado_papeleria ep ON e.empl_id = ep.est_empleado_id
        LEFT JOIN ino_agendar_turnos ag ON e.empl_id = ag.age_empleado_id
        WHERE e.empl_deleted_at IS NULL
      `;

      const params = [];
      let paramIndex = 1;

      if (empresaId) {
        query += ` AND EXISTS (
          SELECT 1 FROM ino_agendar_turnos ag2 
          JOIN ino_turnos t ON ag2.age_turno_id = t.tur_id 
          WHERE ag2.age_empleado_id = e.empl_id AND t.tur_empresa_id = $${paramIndex}
        )`;
        params.push(empresaId);
        paramIndex++;
      }

      if (areaId) {
        query += ` AND EXISTS (
          SELECT 1 FROM ino_agendar_turnos ag3 
          JOIN ino_turnos t2 ON ag3.age_turno_id = t2.tur_id 
          WHERE ag3.age_empleado_id = e.empl_id AND t2.tur_area_id = $${paramIndex}
        )`;
        params.push(areaId);
        paramIndex++;
      }

      query += `
        GROUP BY e.empl_id, e.empl_nombre_completo, e.empl_telefono, e.empl_email, 
                 e.empl_fecha_contratacion, e.empl_created_at, ep.est_estado, ep.est_vencimiento_consolidado
        ORDER BY e.empl_nombre_completo
      `;

      const employees = await Database.queryMany(query, params);

      res.json({
        filters: { empresaId, areaId },
        employees,
        totalEmployees: employees.length,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error generando reporte por área:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Reporte de documentos próximos a vencer
  static async getExpiringDocuments(req, res) {
    try {
      const { days = 30 } = req.query;
      const daysAhead = parseInt(days);

      if (isNaN(daysAhead) || daysAhead < 1 || daysAhead > 365) {
        return res.status(400).json({ 
          error: 'El parámetro days debe ser un número entre 1 y 365' 
        });
      }

      const expiringDocs = await Database.queryMany(
        'SELECT * FROM get_expiring_documents($1)',
        [daysAhead]
      );

      // Agrupar por estado
      const grouped = expiringDocs.reduce((acc, doc) => {
        const estado = doc.estado;
        if (!acc[estado]) {
          acc[estado] = [];
        }
        acc[estado].push(doc);
        return acc;
      }, {});

      res.json({
        daysAhead,
        documents: expiringDocs,
        groupedByStatus: grouped,
        totalDocuments: expiringDocs.length,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error obteniendo documentos por vencer:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Resumen de turnos por empresa
  static async getTurnosSummaryByCompany(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: 'Se requieren las fechas de inicio y fin' 
        });
      }

      const summary = await Database.queryMany(`
        SELECT 
          e.emp_nombre as empresa,
          COUNT(ag.age_id) as total_turnos,
          COUNT(ag.age_id) FILTER (WHERE ag.age_estado_asignacion = 'completado') as completados,
          COUNT(ag.age_id) FILTER (WHERE ag.age_estado_asignacion = 'cancelado') as cancelados,
          COUNT(ag.age_id) FILTER (WHERE ag.age_estado_asignacion = 'ausente') as ausentes,
          ROUND(AVG(EXTRACT(EPOCH FROM (t.tur_hora_fin - t.tur_hora_inicio))/3600), 2) as promedio_horas_turno
        FROM ino_empresas e
        LEFT JOIN ino_turnos t ON e.emp_id = t.tur_empresa_id
        LEFT JOIN ino_agendar_turnos ag ON t.tur_id = ag.age_turno_id
          AND ag.age_fecha BETWEEN $1 AND $2
        WHERE e.emp_is_active = true
        GROUP BY e.emp_id, e.emp_nombre
        ORDER BY total_turnos DESC
      `, [startDate, endDate]);

      res.json({
        period: { startDate, endDate },
        summary,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error generando resumen por empresa:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

export default ReportController;