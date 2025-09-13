// src/pages/Reports.jsx
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

const Reports = () => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>📊</div>
        <h1 style={styles.title}>Reportes y Análisis</h1>
        <p style={styles.description}>
          Esta sección está en desarrollo. Aquí podrás generar reportes detallados
          sobre asistencia, horas trabajadas y productividad.
        </p>
      </div>
    </div>
  );
};

export default Reports;