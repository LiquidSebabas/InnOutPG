
// src/services/shiftService.js
import Database from '../models/database.js';
import { timesOverlap } from '../utils/dateUtils.js';

class ShiftService {
  // Lógica de negocio para turnos
  static async getShiftConflicts(employeeId, fecha, horaInicio, horaFin) {
    try {
      const conflicts = await Database.queryMany(`
        SELECT 
          ag.*,
          t.tur_hora_inicio,
          t.tur_hora_fin,
          emp.emp_nombre as empresa,
          a.are_nombre as area
        FROM ino_agendar_turnos ag
        JOIN ino_turnos t ON ag.age_turno_id = t.tur_id
        JOIN ino_empresas emp ON t.tur_empresa_id = emp.emp_id
        JOIN ino_areas a ON t.tur_area_id = a.are_id
        WHERE ag.age_empleado_id = $1 
        AND ag.age_fecha = $2 
        AND ag.age_estado_asignacion != 'cancelado'
      `, [employeeId, fecha]);

      return conflicts.filter(conflict => 
        timesOverlap(
          { start: conflict.tur_hora_inicio, end: conflict.tur_hora_fin },
          { start: horaInicio, end: horaFin }
        )
      );
    } catch (error) {
      console.error('Error verificando conflictos:', error);
      throw error;
    }
  }

  static async calculateShiftDuration(horaInicio, horaFin) {
    const [startHour, startMin] = horaInicio.split(':').map(Number);
    const [endHour, endMin] = horaFin.split(':').map(Number);
    
    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    // Manejar turnos nocturnos
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60; // Agregar 24 horas
    }
    
    return (endMinutes - startMinutes) / 60; // Retornar en horas
  }
}

export default ShiftService;