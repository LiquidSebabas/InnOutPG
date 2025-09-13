// src/App.jsx - Con React Router completo
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Shifts from './pages/Shifts';
import Reports from './pages/Reports';

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loginContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px'
  },
  loginCard: {
    width: '100%',
    maxWidth: '400px',
    padding: '32px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '8px',
    color: '#1f2937'
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: '32px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed'
  },
  error: {
    padding: '12px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  layout: {
    display: 'flex',
    minHeight: '100vh'
  },
  sidebar: {
    width: '200px',
    backgroundColor: '#1f2937',
    color: 'white',
    padding: '20px',
    position: 'fixed',
    height: '100vh',
    overflowY: 'auto'
  },
  main: {
    flex: 1,
    marginLeft: '200px',
    padding: '20px'
  },
  header: {
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '16px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  navLink: {
    display: 'block',
    color: '#d1d5db',
    textDecoration: 'none',
    padding: '12px 0',
    borderRadius: '4px',
    transition: 'all 0.2s',
    marginBottom: '4px'
  },
  navLinkActive: {
    backgroundColor: '#374151',
    color: 'white',
    padding: '12px 0 12px 12px'
  },
  pageContainer: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  pageCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '32px'
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '16px'
  },
  pageDescription: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '24px'
  },
  pageIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    textAlign: 'center'
  }
};

// Hook de autenticación
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.clear();
      }
    }
    
    setLoading(false);
  }, []);

  const login = (userData, session) => {
    localStorage.setItem('access_token', session.access_token);
    localStorage.setItem('refresh_token', session.refresh_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      localStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return { isAuthenticated, user, loading, login, logout };
};

// Componente de Login
const LoginComponent = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el login');
      }

      onLogin(data.user, data.session);

    } catch (error) {
      console.error('Error en login:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <h1 style={styles.title}>InnOut</h1>
        <p style={styles.subtitle}>Sistema de Control de Turnos</p>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="admin@innout.com"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#6b7280'}}>
          <p>Credenciales de prueba:</p>
          <p style={{fontFamily: 'monospace'}}>admin@innout.com</p>
        </div>
      </div>
    </div>
  );
};

// Layout con navegación
const Layout = ({ children, user, onLogout }) => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', path: '/', icon: '📊' },
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
      <div style={styles.sidebar}>
        <h2 style={{color: 'white', marginBottom: '20px'}}>InnOut</h2>
        <nav>
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...styles.navLink,
                  ...(isActive ? styles.navLinkActive : {})
                }}
              >
                <span style={{ marginRight: '8px' }}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div style={styles.main}>
        <div style={styles.header}>
          <h1>{getPageTitle()}</h1>
          <div>
            <span style={{marginRight: '16px'}}>Hola, {user.usr_name}</span>
            <span style={{
              padding: '4px 8px',
              fontSize: '12px',
              borderRadius: '12px',
              backgroundColor: '#ddd6fe',
              color: '#5b21b6',
              marginRight: '16px'
            }}>
              {user.usr_role}
            </span>
            <button style={styles.logoutBtn} onClick={onLogout}>
              Cerrar Sesión
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

// Componente de protección de rutas
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" replace />;
};

// Componente principal
function App() {
  const { isAuthenticated, user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div style={styles.loginContainer}>
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <Router>
      <div style={styles.container}>
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/" replace /> : 
                <LoginComponent onLogin={login} />
            } 
          />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout user={user} onLogout={logout}>
                <Dashboard user={user} />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/employees" element={
            <ProtectedRoute>
              <Layout user={user} onLogout={logout}>
                <Employees />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/shifts" element={
            <ProtectedRoute>
              <Layout user={user} onLogout={logout}>
                <Shifts />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute>
              <Layout user={user} onLogout={logout}>
                <Reports />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;