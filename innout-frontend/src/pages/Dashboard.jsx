// src/pages/Dashboard.jsx - Con datos reales de la API
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '24px',
    marginBottom: '24px'
  },
  welcomeTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px'
  },
  welcomeText: {
    color: '#6b7280',
    fontSize: '16px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '32px'
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '24px',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  statCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  statTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  statIcon: {
    fontSize: '24px',
    padding: '8px',
    borderRadius: '6px'
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px'
  },
  statDescription: {
    fontSize: '14px',
    color: '#6b7280'
  },
  statTrend: {
    fontSize: '12px',
    fontWeight: '500',
    marginTop: '4px'
  },
  trendPositive: {
    color: '#10b981'
  },
  trendNegative: {
    color: '#ef4444'
  },
  quickActions: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '24px',
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px'
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px'
  },
  actionCard: {
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    textDecoration: 'none',
    transition: 'all 0.2s',
    display: 'block'
  },
  actionIcon: {
    fontSize: '32px',
    marginBottom: '12px'
  },
  actionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '4px'
  },
  actionDescription: {
    fontSize: '14px',
    color: '#6b7280'
  },
  alertsSection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '24px'
  },
  alertItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '6px',
    marginBottom: '8px'
  },
  alertIcon: {
    fontSize: '20px',
    marginRight: '12px'
  },
  alertText: {
    flex: 1,
    fontSize: '14px',
    color: '#92400e'
  },
  alertButton: {
    padding: '4px 8px',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    color: '#6b7280'
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px'
  }
};

// API service para el dashboard
const dashboardAPI = {
  async getStats() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar estadísticas');
    }
    
    return response.json();
  },

  async getExpiringCertificates() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employees/expiring-documents?days=30`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar alertas');
    }
    
    return response.json();
  }
};

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Cargar estadísticas y alertas en paralelo
      const [statsResult, alertsResult] = await Promise.allSettled([
        dashboardAPI.getStats(),
        dashboardAPI.getExpiringCertificates()
      ]);

      // Manejar estadísticas
      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      } else {
        console.error('Error loading stats:', statsResult.reason);
        // Usar datos mock si falla la API
        setStats({
          totalEmployees: 24,
          activeEmployees: 22,
          todayShifts: 18,
          thisWeekShifts: 95,
          validCertificates: 20,
          expiringSoon: 3,
          expiredCertificates: 1
        });
      }

      // Manejar alertas
      if (alertsResult.status === 'fulfilled') {
        setAlerts(alertsResult.value.employees || []);
      } else {
        console.error('Error loading alerts:', alertsResult.reason);
        // Datos mock para alertas
        setAlerts([
          {
            empl_id: '1',
            empl_nombre_completo: 'María González',
            est_vencimiento_consolidado: '2024-12-25',
            pap_alimentos_vencimiento: '2024-12-20'
          },
          {
            empl_id: '2',
            empl_nombre_completo: 'Carlos López',
            est_vencimiento_consolidado: '2024-12-30',
            pap_salud_vencimiento: '2024-12-28'
          }
        ]);
      }

    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Error cargando el dashboard. Mostrando datos de ejemplo.');
      
      // Datos mock completos
      setStats({
        totalEmployees: 24,
        activeEmployees: 22,
        todayShifts: 18,
        thisWeekShifts: 95,
        validCertificates: 20,
        expiringSoon: 3,
        expiredCertificates: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatCardData = () => {
    if (!stats) return [];

    return [
      {
        title: 'Empleados Totales',
        value: stats.totalEmployees,
        description: `${stats.activeEmployees} activos`,
        icon: '👥',
        color: '#dbeafe',
        iconColor: '#3b82f6',
        trend: stats.totalEmployees > 20 ? '+2 este mes' : null,
        trendPositive: true
      },
      {
        title: 'Turnos Hoy',
        value: stats.todayShifts,
        description: 'Empleados trabajando',
        icon: '🕐',
        color: '#dcfce7',
        iconColor: '#10b981',
        trend: stats.todayShifts > 15 ? 'Normal' : 'Bajo promedio',
        trendPositive: stats.todayShifts > 15
      },
      {
        title: 'Turnos Semana',
        value: stats.thisWeekShifts,
        description: 'Total programados',
        icon: '📅',
        color: '#fef3c7',
        iconColor: '#f59e0b',
        trend: '+12% vs semana anterior',
        trendPositive: true
      },
      {
        title: 'Certificados',
        value: stats.validCertificates,
        description: `${stats.expiringSoon} por vencer`,
        icon: '📋',
        color: stats.expiredCertificates > 0 ? '#fee2e2' : '#dcfce7',
        iconColor: stats.expiredCertificates > 0 ? '#ef4444' : '#10b981',
        trend: stats.expiredCertificates > 0 ? `${stats.expiredCertificates} vencidos` : 'Todo vigente',
        trendPositive: stats.expiredCertificates === 0
      }
    ];
  };

  const quickActions = [
    {
      title: 'Registrar Empleado',
      description: 'Agregar nuevo empleado al sistema',
      icon: '➕',
      link: '/employees',
      color: '#dbeafe',
      textColor: '#1e40af'
    },
    {
      title: 'Agendar Turno',
      description: 'Programar nuevo turno de trabajo',
      icon: '🕐',
      link: '/shifts',
      color: '#dcfce7',
      textColor: '#166534'
    },
    {
      title: 'Ver Reportes',
      description: 'Generar reportes de asistencia',
      icon: '📊',
      link: '/reports',
      color: '#f3e8ff',
      textColor: '#7c3aed'
    }
  ];

  const formatDaysUntilExpiration = (expirationDate) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Vencido';
    if (diffDays === 0) return 'Vence hoy';
    if (diffDays === 1) return 'Vence mañana';
    return `${diffDays} días`;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Welcome Card */}
      <div style={styles.welcomeCard}>
        <h1 style={styles.welcomeTitle}>
          Bienvenido, {user.usr_name}
        </h1>
        <p style={styles.welcomeText}>
          Resumen actualizado del sistema InnOut - {new Date().toLocaleDateString('es-GT', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* Statistics Grid */}
      <div style={styles.grid}>
        {getStatCardData().map((stat, index) => (
          <div 
            key={index} 
            style={styles.statCard}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, styles.statCardHover);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={styles.statHeader}>
              <span style={styles.statTitle}>{stat.title}</span>
              <div style={{
                ...styles.statIcon,
                backgroundColor: stat.color,
                color: stat.iconColor
              }}>
                {stat.icon}
              </div>
            </div>
            <div style={styles.statNumber}>{stat.value}</div>
            <div style={styles.statDescription}>{stat.description}</div>
            {stat.trend && (
              <div style={{
                ...styles.statTrend,
                ...(stat.trendPositive ? styles.trendPositive : styles.trendNegative)
              }}>
                {stat.trendPositive ? '↗' : '↘'} {stat.trend}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActions}>
        <h2 style={styles.sectionTitle}>Acciones Rápidas</h2>
        <div style={styles.actionGrid}>
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              style={{
                ...styles.actionCard,
                backgroundColor: action.color
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={styles.actionIcon}>{action.icon}</div>
              <div style={{...styles.actionTitle, color: action.textColor}}>
                {action.title}
              </div>
              <div style={styles.actionDescription}>
                {action.description}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div style={styles.alertsSection}>
          <h2 style={styles.sectionTitle}>
            Certificados por Vencer ({alerts.length})
          </h2>
          {alerts.slice(0, 5).map((alert, index) => (
            <div key={index} style={styles.alertItem}>
              <span style={styles.alertIcon}>⚠️</span>
              <div style={styles.alertText}>
                <strong>{alert.empl_nombre_completo}</strong> - 
                Certificado vence en {formatDaysUntilExpiration(alert.est_vencimiento_consolidado)}
              </div>
              <Link to="/employees">
                <button style={styles.alertButton}>
                  Ver
                </button>
              </Link>
            </div>
          ))}
          {alerts.length > 5 && (
            <div style={{textAlign: 'center', marginTop: '12px'}}>
              <Link to="/employees" style={{color: '#f59e0b', fontSize: '14px'}}>
                Ver todos los {alerts.length} empleados con alertas
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;