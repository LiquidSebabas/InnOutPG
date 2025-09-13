// src/services/employeeService.js
import Database from '../models/database.js';

class EmployeeService {
  // Business logic específica para empleados
  static async calculateEmployeeStats(employeeId, startDate, endDate) {
    try {
      const stats = await Database.queryOne(`
        SELECT 
          COUNT(ag.age_id) as total_turnos,
          COUNT(ag.age_id) FILTER (WHERE ag.age_estado_asignacion = 'completado') as completados,
          COUNT(ag.age_id) FILTER (WHERE ag.age_estado_asignacion = 'cancelado') as cancelados,
          SUM(EXTRACT(EPOCH FROM (t.tur_hora_fin - t.tur_hora_inicio))/3600) FILTER (WHERE ag.age_estado_asignacion = 'completado') as horas_trabajadas
        FROM ino_agendar_turnos ag
        JOIN ino_turnos t ON ag.age_turno_id = t.tur_id
        WHERE ag.age_empleado_id = $1 
        AND ag.age_fecha BETWEEN $2 AND $3
      `, [employeeId, startDate, endDate]);

      return stats;
    } catch (error) {
      console.error('Error calculando estadísticas del empleado:', error);
      throw error;
    }
  }

  static async checkDocumentExpiry(employeeId) {
    try {
      const status = await Database.queryOne(`
        SELECT 
          est_estado,
          est_vencimiento_consolidado,
          est_alertar_desde_consolidado
        FROM ino_estado_papeleria 
        WHERE est_empleado_id = $1
      `, [employeeId]);

      return status;
    } catch (error) {
      console.error('Error verificando vencimiento de documentos:', error);
      throw error;
    }
  }
}

export default EmployeeService;