// src/utils/dateUtils.js

// Formatear fecha para display (DD/MM/YYYY)
export const formatDateForDisplay = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

// Formatear fecha para input HTML (YYYY-MM-DD)
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toISOString().split('T')[0];
};

// Obtener días hasta una fecha
export const getDaysUntilDate = (targetDate) => {
  if (!targetDate) return null;
  
  const target = new Date(targetDate);
  const today = new Date();
  
  // Resetear horas para comparar solo fechas
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Determinar estado de documento basado en vencimiento
export const getDocumentStatus = (expiryDate) => {
  const daysUntil = getDaysUntilDate(expiryDate);
  
  if (daysUntil === null) return 'sin_definir';
  if (daysUntil < 0) return 'vencido';
  if (daysUntil <= 30) return 'por_vencer';
  return 'vigente';
};

// Verificar si es fecha de hoy
export const isToday = (date) => {
  if (!date) return false;
  
  const inputDate = new Date(date);
  const today = new Date();
  
  return inputDate.toDateString() === today.toDateString();
};

// Agregar días a una fecha
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Obtener inicio de semana (lunes)
export const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que lunes sea el primer día
  return new Date(d.setDate(diff));
};

// Obtener rango quincenal
export const getBiweeklyRange = (date = new Date()) => {
  const start = getStartOfWeek(date);
  const end = addDays(start, 13); // 2 semanas
  
  return {
    startDate: formatDateForInput(start),
    endDate: formatDateForInput(end)
  };
};

// Validar que el turno no sea en el pasado
export const isValidShiftDate = (shiftDate) => {
  const shift = new Date(shiftDate);
  const today = new Date();
  
  shift.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  return shift >= today;
};

// Convertir tiempo a minutos desde medianoche
export const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Verificar traslape de horarios
export const timesOverlap = (time1, time2) => {
  const start1 = timeToMinutes(time1.start);
  const end1 = timeToMinutes(time1.end);
  const start2 = timeToMinutes(time2.start);
  const end2 = timeToMinutes(time2.end);

  // Manejar turnos nocturnos (cruzan medianoche)
  if (end1 < start1) { // Primer turno es nocturno
    return !(end2 <= start1 && start2 >= end1);
  }
  
  if (end2 < start2) { // Segundo turno es nocturno
    return !(end1 <= start2 && start1 >= end2);
  }
  
  // Turnos normales
  return start1 < end2 && end1 > start2;
};