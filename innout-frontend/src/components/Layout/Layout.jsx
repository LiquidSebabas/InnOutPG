// src/components/Layout/Layout.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh'
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#1f2937',
    color: 'white',
    padding: '20px 0',
    position: 'fixed',
    height: '100vh',
    overflowY: 'auto'
  },
  sidebarHeader: {
    padding: '0 20px 20px',
    borderBottom: '1px solid #374151',
    marginBottom: '20px'
  },
  sidebarTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0
  },
  nav: {
    listStyle: 'none',
    margin: 0,
    padding: 0
  },
  navItem: {
    margin: 0
  },
  navLink: {
    display: 'block',
    padding: '12px 20px',
    color: '#d1d5db',
    textDecoration: 'none',
    transition: 'all 0.2s',
    borderLeft: '3px solid transparent'
  },
  navLinkActive: {
    backgroundColor: '#374151',
    color: 'white',
    borderLeftColor: '#3b82f6'
  },
  navLinkHover: {
    backgroundColor: '#374151',
    color: 'white'
  },
  main: {
    flex: 1,
    marginLeft: '250px',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '0 24px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  userInfo: {
    fontSize: '14px',
    color: '#374151'
  },
  badge: {
    padding: '4px 8px',
    fontSize: '12px',
    borderRadius: '12px',
    backgroundColor: '#ddd6fe',
    color: '#5b21b6',
    fontWeight: '500'
  },
  logoutBtn: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  content: {
    flex: 1,
    padding: '24px',
    backgroundColor: '#f9fafb'
  }
};

const Layout = ({ children, user, onLogout }) => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Empleados', path: '/employees', icon: '👥' },
    { name: 'Turnos', path: '/shifts', icon: '🕐' },
    { name: 'Reportes', path: '/reports', icon: '📄' }
  ];

  const getPageTitle = () => {
    const currentNav = navigation.find(nav => nav.path === location.pathname);
    return currentNav ? currentNav.name : 'InnOut';
  };

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h1 style={styles.sidebarTitle}>InnOut</h1>
        </div>
        
        <nav>
          <ul style={styles.nav}>
            {navigation.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path} style={styles.navItem}>
                  <Link
                    to={item.path}
                    style={{
                      ...styles.navLink,
                      ...(isActive ? styles.navLinkActive : {})
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        Object.assign(e.target.style, styles.navLinkHover);
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        Object.assign(e.target.style, styles.navLink);
                      }
                    }}
                  >
                    <span style={{ marginRight: '8px' }}>{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Header */}
        <header style={styles.header}>
          <h2 style={styles.headerTitle}>{getPageTitle()}</h2>
          
          <div style={styles.headerRight}>
            <span style={styles.userInfo}>
              Hola, {user.usr_name}
            </span>
            <span style={styles.badge}>
              {user.usr_role}
            </span>
            <button
              onClick={onLogout}
              style={styles.logoutBtn}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#dc2626';
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div style={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;