import Database from '../models/database.js';

class ReportService {
  // Lógica de negocio para reportes
  static async generateCustomReport(filters) {
    try {
      const { startDate, endDate, employeeIds, empresaIds } = filters;
      
      let query = `
        SELECT 
          e.empl_nombre_completo,
          emp.emp_nombre,
          a.are_nombre,
          ag.age_fecha,
          ag.age_estado_asignacion,
          t.tur_hora_inicio,
          t.tur_hora_fin
        FROM ino_agendar_turnos ag
        JOIN ino_turnos t ON ag.age_turno_id = t.tur_id
        JOIN ino_empleados e ON ag.age_empleado_id = e.empl_id
        JOIN ino_empresas emp ON t.tur_empresa_id = emp.emp_id
        JOIN ino_areas a ON t.tur_area_id = a.are_id
        WHERE ag.age_fecha BETWEEN $1 AND $2
      `;

      const params = [startDate, endDate];
      let paramIndex = 3;

      if (employeeIds && employeeIds.length > 0) {
        query += ` AND ag.age_empleado_id = ANY($${paramIndex})`;
        params.push(employeeIds);
        paramIndex++;
      }

      if (empresaIds && empresaIds.length > 0) {
        query += ` AND t.tur_empresa_id = ANY($${paramIndex})`;
        params.push(empresaIds);
        paramIndex++;
      }

      query += ' ORDER BY ag.age_fecha, e.empl_nombre_completo';

      const data = await Database.queryMany(query, params);
      return data;
    } catch (error) {
      console.error('Error generando reporte personalizado:', error);
      throw error;
    }
  }

  static async getProductivityMetrics(startDate, endDate) {
    try {
      const metrics = await Database.queryOne(`
        SELECT 
          COUNT(ag.age_id) as total_asignaciones,
          COUNT(ag.age_id) FILTER (WHERE ag.age_estado_asignacion = 'completado') as completadas,
          COUNT(ag.age_id) FILTER (WHERE ag.age_estado_asignacion = 'cancelado') as canceladas,
          COUNT(ag.age_id) FILTER (WHERE ag.age_estado_asignacion = 'ausente') as ausencias,
          ROUND(
            COUNT(ag.age_id) FILTER (WHERE ag.age_estado_asignacion = 'completado') * 100.0 / 
            NULLIF(COUNT(ag.age_id), 0), 
            2
          ) as porcentaje_completado
        FROM ino_agendar_turnos ag
        WHERE ag.age_fecha BETWEEN $1 AND $2
      `, [startDate, endDate]);

      return metrics;
    } catch (error) {
      console.error('Error calculando métricas de productividad:', error);
      throw error;
    }
  }
}

export default ReportService;