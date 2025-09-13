// src/pages/PagesBundle.jsx
import React from 'react';

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '32px',
    textAlign: 'center'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '16px'
  },
  description: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '24px'
  },
  icon: {
    fontSize: '64px',
    marginBottom: '16px'
  }
};

export const Shifts = () => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>🕐</div>
        <h1 style={styles.title}>Gestión de Turnos</h1>
        <p style={styles.description}>
          Esta sección está en desarrollo. Aquí podrás gestionar los turnos de trabajo,
          registrar entradas y salidas, y revisar los horarios de los empleados.
        </p>
        <p style={styles.description}>
          <strong>Próximamente:</strong> Control de asistencia, reportes de turnos, 
          configuración de horarios y más.
        </p>
      </div>
    </div>
  );
};

export const Reports = () => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>📊</div>
        <h1 style={styles.title}>Reportes y Análisis</h1>
        <p style={styles.description}>
          Esta sección está en desarrollo. Aquí podrás generar reportes detallados
          sobre asistencia, horas trabajadas y productividad.
        </p>
        <p style={styles.description}>
          <strong>Próximamente:</strong> Reportes de asistencia, gráficos de productividad,
          exportación a PDF/Excel y análisis de tendencias.
        </p>
      </div>
    </div>
  );
};