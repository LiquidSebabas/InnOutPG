// src/utils/constants.js

// Estados de documentos
export const DOCUMENT_STATUS = {
  VIGENTE: 'vigente',
  POR_VENCER: 'por_vencer',
  VENCIDO: 'vencido'
};

// Estados de asignación de turnos
export const ASSIGNMENT_STATUS = {
  ASIGNADO: 'asignado',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado',
  AUSENTE: 'ausente'
};

// Roles de usuario
export const USER_ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  MANAGER: 'manager'
};

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 200
};

// Configuración de documentos
export const DOCUMENT_TYPES = {
  SALUD: 'salud',
  ALIMENTOS: 'alimentos',
  PULMONES: 'pulmones',
  JUDICIAL: 'judicial',
  POLICIA: 'policia'
};

// Días de alerta por defecto
export const ALERT_DAYS = {
  DOCUMENT_EXPIRY: 30
};

// Códigos de error PostgreSQL comunes
export const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  CHECK_VIOLATION: '23514',
  NOT_NULL_VIOLATION: '23502'
};