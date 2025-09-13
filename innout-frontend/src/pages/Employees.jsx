// src/pages/Employees.jsx - Con validaciones automáticas y reglas de negocio
import React, { useState, useEffect } from 'react';

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  searchContainer: {
    marginBottom: '20px'
  },
  searchInput: {
    width: '100%',
    maxWidth: '400px',
    padding: '10px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    backgroundColor: '#f9fafb',
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e5e7eb'
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '14px',
    color: '#1f2937'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  statusActive: {
    backgroundColor: '#dcfce7',
    color: '#166534'
  },
  statusInactive: {
    backgroundColor: '#fee2e2',
    color: '#dc2626'
  },
  foodCertValid: {
    backgroundColor: '#dcfce7',
    color: '#166534'
  },
  foodCertExpiring: {
    backgroundColor: '#fef3c7',
    color: '#92400e'
  },
  foodCertExpired: {
    backgroundColor: '#fee2e2',
    color: '#dc2626'
  },
  foodCertNone: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280'
  },
  actionButton: {
    padding: '6px 12px',
    margin: '0 4px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  editButton: {
    backgroundColor: '#f3f4f6',
    color: '#374151'
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    color: '#dc2626'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '100%',
    maxWidth: '800px',
    margin: '20px',
    maxHeight: '80vh',
    overflowY: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280'
  },
  form: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  formGroupFull: {
    display: 'flex',
    flexDirection: 'column',
    gridColumn: '1 / -1'
  },
  formSection: {
    gridColumn: '1 / -1',
    backgroundColor: '#f9fafb',
    padding: '16px',
    borderRadius: '6px',
    marginTop: '16px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  },
  inputError: {
    borderColor: '#ef4444'
  },
  checkbox: {
    marginRight: '8px'
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px'
  },
  dateGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  toggleButton: {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '16px'
  },
  toggleButtonActive: {
    backgroundColor: '#3b82f6',
    color: 'white',
    borderColor: '#3b82f6'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px',
    gridColumn: '1 / -1'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280'
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280'
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  success: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  validationError: {
    color: '#dc2626',
    fontSize: '12px',
    marginTop: '4px'
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '16px'
  },
  warningTitle: {
    fontWeight: '600',
    color: '#92400e',
    marginBottom: '4px'
  },
  warningText: {
    color: '#92400e',
    fontSize: '14px'
  }
};

// Servicio API
const employeeAPI = {
  async getAll() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employees`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar empleados');
    }
    
    return response.json();
  },

  async create(employeeData) {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employees`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(employeeData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear empleado');
    }
    
    return response.json();
  },

  async update(id, employeeData) {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(employeeData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar empleado');
    }
    
    return response.json();
  },

  async delete(id) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employees/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar empleado');
    }
    
    return response.json();
  }
};

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showHealthSection, setShowHealthSection] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    empl_nombre_completo: '',
    empl_email: '',
    empl_telefono: '',
    empl_fecha_nacimiento: '',
    empl_fecha_contratacion: '',
    empl_fecha_baja: '',
    // Campos de papelería
    pap_judicial: false,
    pap_policia: false,
    pap_salud_emision: '',
    pap_salud_vencimiento: '',
    pap_alimentos_emision: '',
    pap_alimentos_vencimiento: '',
    pap_pulmones_emision: '',
    pap_pulmones_vencimiento: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await employeeAPI.getAll();
      setEmployees(data.employees || []);
      
    } catch (err) {
      console.error('Error loading employees:', err);
      setError(`Error de conexión: ${err.message}. Mostrando datos de ejemplo.`);
      
      // Datos mock
      setEmployees([
        {
          empl_id: '1',
          empl_nombre_completo: 'Juan Pérez López',
          empl_email: 'juan.perez@innout.com',
          empl_telefono: '+50212345678',
          empl_fecha_contratacion: '2024-01-15',
          empl_fecha_baja: null,
          pap_judicial: true,
          pap_policia: true,
          pap_alimentos_emision: '2024-01-15',
          pap_alimentos_vencimiento: '2025-01-15',
          pap_salud_emision: '2024-02-01',
          pap_salud_vencimiento: '2025-02-01',
          pap_pulmones_emision: '2024-01-20',
          pap_pulmones_vencimiento: '2025-01-20'
        },
        {
          empl_id: '2',
          empl_nombre_completo: 'María González',
          empl_email: 'maria.gonzalez@innout.com',
          empl_telefono: '+50287654321',
          empl_fecha_contratacion: '2024-01-20',
          empl_fecha_baja: null,
          pap_judicial: true,
          pap_policia: false,
          pap_alimentos_emision: '2024-01-20',
          pap_alimentos_vencimiento: '2024-12-20',
          pap_salud_emision: null,
          pap_salud_vencimiento: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Función para auto-calcular fecha de vencimiento (1 año después)
  const calculateExpirationDate = (emissionDate) => {
    if (!emissionDate) return '';
    const date = new Date(emissionDate);
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  };

  // Validar campos requeridos si tiene certificado de salud
  const validateHealthCertificates = () => {
    const errors = {};
    
    // Si tiene certificado de salud, debe tener alimentos y pulmones
    if (formData.pap_salud_emision && (
        !formData.pap_alimentos_emision || 
        !formData.pap_pulmones_emision
      )) {
      errors.healthCertificates = 'Si tiene certificado de salud, debe completar también los certificados de manejo de alimentos y pulmones';
    }

    return errors;
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowHealthSection(false);
    setValidationErrors({});
    setFormData({
      empl_nombre_completo: '',
      empl_email: '',
      empl_telefono: '',
      empl_fecha_nacimiento: '',
      empl_fecha_contratacion: new Date().toISOString().split('T')[0],
      empl_fecha_baja: '',
      pap_judicial: false,
      pap_policia: false,
      pap_salud_emision: '',
      pap_salud_vencimiento: '',
      pap_alimentos_emision: '',
      pap_alimentos_vencimiento: '',
      pap_pulmones_emision: '',
      pap_pulmones_vencimiento: ''
    });
    setShowModal(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowHealthSection(!!(employee.pap_salud_emision || employee.pap_alimentos_emision || employee.pap_pulmones_emision));
    setValidationErrors({});
    setFormData({
      empl_nombre_completo: employee.empl_nombre_completo,
      empl_email: employee.empl_email,
      empl_telefono: employee.empl_telefono || '',
      empl_fecha_nacimiento: employee.empl_fecha_nacimiento || '',
      empl_fecha_contratacion: employee.empl_fecha_contratacion || '',
      empl_fecha_baja: employee.empl_fecha_baja || '',
      pap_judicial: employee.pap_judicial || false,
      pap_policia: employee.pap_policia || false,
      pap_salud_emision: employee.pap_salud_emision || '',
      pap_salud_vencimiento: employee.pap_salud_vencimiento || '',
      pap_alimentos_emision: employee.pap_alimentos_emision || '',
      pap_alimentos_vencimiento: employee.pap_alimentos_vencimiento || '',
      pap_pulmones_emision: employee.pap_pulmones_emision || '',
      pap_pulmones_vencimiento: employee.pap_pulmones_vencimiento || ''
    });
    setShowModal(true);
  };

  const handleDeleteEmployee = async (employee) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar a ${employee.empl_nombre_completo}?`)) {
      return;
    }

    try {
      await employeeAPI.delete(employee.empl_id);
      setEmployees(employees.filter(emp => emp.empl_id !== employee.empl_id));
      setSuccess(`Empleado ${employee.empl_nombre_completo} eliminado exitosamente`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar certificados de salud
    const healthErrors = validateHealthCertificates();
    if (Object.keys(healthErrors).length > 0) {
      setValidationErrors(healthErrors);
      return;
    }

    setFormLoading(true);
    setError('');
    setValidationErrors({});

    try {
      // Preparar datos con estructura de papelería
      const dataToSend = {
        empl_nombre_completo: formData.empl_nombre_completo,
        empl_telefono: formData.empl_telefono || null,
        empl_email: formData.empl_email,
        empl_fecha_nacimiento: formData.empl_fecha_nacimiento || null,
        empl_fecha_contratacion: formData.empl_fecha_contratacion,
        empl_fecha_baja: formData.empl_fecha_baja || null,
        papeleria: {
          pap_judicial: formData.pap_judicial,
          pap_policia: formData.pap_policia,
          pap_salud_emision: formData.pap_salud_emision || null,
          pap_salud_vencimiento: formData.pap_salud_vencimiento || null,
          pap_alimentos_emision: formData.pap_alimentos_emision || null,
          pap_alimentos_vencimiento: formData.pap_alimentos_vencimiento || null,
          pap_pulmones_emision: formData.pap_pulmones_emision || null,
          pap_pulmones_vencimiento: formData.pap_pulmones_vencimiento || null
        }
      };

      if (editingEmployee) {
        const updatedEmployee = await employeeAPI.update(editingEmployee.empl_id, dataToSend);
        setEmployees(employees.map(emp => 
          emp.empl_id === editingEmployee.empl_id ? updatedEmployee.employee : emp
        ));
        setSuccess(`Empleado ${formData.empl_nombre_completo} actualizado exitosamente`);
      } else {
        const newEmployee = await employeeAPI.create(dataToSend);
        setEmployees([...employees, newEmployee.employee]);
        setSuccess(`Empleado ${formData.empl_nombre_completo} creado exitosamente`);
      }
      
      setShowModal(false);
      setEditingEmployee(null);
    } catch (err) {
      console.error('Error creating/updating employee:', err);
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      
      // Auto-calcular fechas de vencimiento cuando cambia la emisión
      if (name.endsWith('_emision') && value) {
        const vencimientoField = name.replace('_emision', '_vencimiento');
        updated[vencimientoField] = calculateExpirationDate(value);
      }
      
      return updated;
    });

    // Limpiar errores de validación cuando el usuario corrige
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const toggleHealthSection = () => {
    setShowHealthSection(!showHealthSection);
  };

  const filteredEmployees = employees.filter(employee =>
    employee.empl_nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.empl_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEmployeeStatus = (employee) => {
    return employee.empl_fecha_baja ? 'Inactivo' : 'Activo';
  };

  const getStatusStyle = (employee) => {
    return employee.empl_fecha_baja ? styles.statusInactive : styles.statusActive;
  };

  const getFoodCertificationStatus = (employee) => {
    if (!employee.pap_alimentos_vencimiento) {
      return { status: 'Sin certificar', style: styles.foodCertNone };
    }

    const today = new Date();
    const vencimiento = new Date(employee.pap_alimentos_vencimiento);
    const diasParaVencer = Math.ceil((vencimiento - today) / (1000 * 60 * 60 * 24));

    if (diasParaVencer < 0) {
      return { status: 'Vencido', style: styles.foodCertExpired };
    } else if (diasParaVencer <= 30) {
      return { status: 'Por vencer', style: styles.foodCertExpiring };
    } else {
      return { status: 'Vigente', style: styles.foodCertValid };
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Gestión de Empleados</h1>
        <button
          style={styles.addButton}
          onClick={handleAddEmployee}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          + Agregar Empleado
        </button>
      </div>

      {/* Search */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Buscar empleados por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Messages */}
      {success && (
        <div style={styles.success}>
          {success}
          <button 
            onClick={() => setSuccess('')}
            style={{ float: 'right', background: 'none', border: 'none', color: 'inherit' }}
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div style={styles.error}>
          {error}
          <button 
            onClick={() => setError('')}
            style={{ float: 'right', background: 'none', border: 'none', color: 'inherit' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Employee Table */}
      <div style={styles.card}>
        {loading ? (
          <div style={styles.loading}>Cargando empleados...</div>
        ) : filteredEmployees.length === 0 ? (
          <div style={styles.noData}>
            {searchTerm ? 'No se encontraron empleados con ese criterio.' : 'No hay empleados registrados.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Teléfono</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Cert. Alimentos</th>
                  <th style={styles.th}>Antecedentes</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => {
                  const foodCert = getFoodCertificationStatus(employee);
                  return (
                    <tr key={employee.empl_id}>
                      <td style={styles.td}>{employee.empl_nombre_completo}</td>
                      <td style={styles.td}>{employee.empl_email}</td>
                      <td style={styles.td}>{employee.empl_telefono || 'N/A'}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          ...getStatusStyle(employee)
                        }}>
                          {getEmployeeStatus(employee)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          ...foodCert.style
                        }}>
                          {foodCert.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div>
                          <span style={{
                            ...styles.statusBadge,
                            ...(employee.pap_judicial ? styles.statusActive : styles.statusInactive),
                            marginRight: '4px'
                          }}>
                            J: {employee.pap_judicial ? 'Sí' : 'No'}
                          </span>
                          <span style={{
                            ...styles.statusBadge,
                            ...(employee.pap_policia ? styles.statusActive : styles.statusInactive)
                          }}>
                            P: {employee.pap_policia ? 'Sí' : 'No'}
                          </span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={{...styles.actionButton, ...styles.editButton}}
                          onClick={() => handleEditEmployee(employee)}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit Employee */}
      {showModal && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingEmployee ? 'Editar Empleado' : 'Agregar Empleado'}
              </h2>
              <button
                style={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form style={styles.form} onSubmit={handleSubmit}>
              {/* Información Personal */}
              <div style={styles.formGroupFull}>
                <label style={styles.label}>Nombre Completo *</label>
                <input
                  type="text"
                  name="empl_nombre_completo"
                  value={formData.empl_nombre_completo}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                  placeholder="Ingresa el nombre completo"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  name="empl_email"
                  value={formData.empl_email}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                  placeholder="empleado@innout.com"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Teléfono</label>
                <input
                  type="tel"
                  name="empl_telefono"
                  value={formData.empl_telefono}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="+502XXXXXXXX"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Fecha de Nacimiento</label>
                <input
                  type="date"
                  name="empl_fecha_nacimiento"
                  value={formData.empl_fecha_nacimiento}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Fecha de Contratación *</label>
                <input
                  type="date"
                  name="empl_fecha_contratacion"
                  value={formData.empl_fecha_contratacion}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>

              {editingEmployee && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Fecha de Baja</label>
                  <input
                    type="date"
                    name="empl_fecha_baja"
                    value={formData.empl_fecha_baja}
                    onChange={handleInputChange}
                    style={styles.input}
                  />
                  <small style={{color: '#6b7280', marginTop: '4px'}}>
                    Deja vacío si el empleado sigue activo
                  </small>
                </div>
              )}

              {/* Sección de Antecedentes */}
              <div style={styles.formSection}>
                <h3 style={styles.sectionTitle}>Antecedentes</h3>
                
                <div style={styles.formGroupFull}>
                  <div style={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      name="pap_judicial"
                      checked={formData.pap_judicial}
                      onChange={handleInputChange}
                      style={styles.checkbox}
                      id="pap_judicial"
                    />
                    <label htmlFor="pap_judicial" style={styles.label}>
                      Antecedentes Judiciales
                    </label>
                  </div>
                  
                  <div style={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      name="pap_policia"
                      checked={formData.pap_policia}
                      onChange={handleInputChange}
                      style={styles.checkbox}
                      id="pap_policia"
                    />
                    <label htmlFor="pap_policia" style={styles.label}>
                      Antecedentes Policiales
                    </label>
                  </div>
                </div>
              </div>

              {/* Botón para mostrar/ocultar certificados de salud */}
              <div style={styles.formGroupFull}>
                <button
                  type="button"
                  style={{
                    ...styles.toggleButton,
                    ...(showHealthSection ? styles.toggleButtonActive : {})
                  }}
                  onClick={toggleHealthSection}
                >
                  {showHealthSection ? '📋 Ocultar' : '📋 Agregar'} Certificados de Salud
                </button>
              </div>

              {/* Sección de Certificados de Salud (condicional) */}
              {showHealthSection && (
                <div style={styles.formSection}>
                  <h3 style={styles.sectionTitle}>Certificados de Salud</h3>
                  
                  {/* Validación de error */}
                  {validationErrors.healthCertificates && (
                    <div style={styles.warningBox}>
                      <div style={styles.warningTitle}>⚠️ Certificados Requeridos</div>
                      <div style={styles.warningText}>
                        {validationErrors.healthCertificates}
                      </div>
                    </div>
                  )}

                  {/* Certificado de Salud */}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Certificado de Salud General</label>
                    <div style={styles.dateGroup}>
                      <div>
                        <label style={{...styles.label, fontSize: '12px'}}>Fecha Emisión</label>
                        <input
                          type="date"
                          name="pap_salud_emision"
                          value={formData.pap_salud_emision}
                          onChange={handleInputChange}
                          style={styles.input}
                        />
                      </div>
                      <div>
                        <label style={{...styles.label, fontSize: '12px'}}>Fecha Vencimiento</label>
                        <input
                          type="date"
                          name="pap_salud_vencimiento"
                          value={formData.pap_salud_vencimiento}
                          onChange={handleInputChange}
                          style={styles.input}
                          placeholder="Se calcula automáticamente"
                        />
                        <small style={{color: '#6b7280', fontSize: '11px'}}>
                          Se calcula automáticamente (+1 año)
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Certificado de Alimentos */}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      Certificado de Manejo de Alimentos
                      <span style={{color: '#f59e0b', marginLeft: '4px'}}>⭐ Requerido</span>
                    </label>
                    <div style={styles.dateGroup}>
                      <div>
                        <label style={{...styles.label, fontSize: '12px'}}>Fecha Emisión</label>
                        <input
                          type="date"
                          name="pap_alimentos_emision"
                          value={formData.pap_alimentos_emision}
                          onChange={handleInputChange}
                          style={styles.input}
                        />
                      </div>
                      <div>
                        <label style={{...styles.label, fontSize: '12px'}}>Fecha Vencimiento</label>
                        <input
                          type="date"
                          name="pap_alimentos_vencimiento"
                          value={formData.pap_alimentos_vencimiento}
                          onChange={handleInputChange}
                          style={styles.input}
                        />
                        <small style={{color: '#6b7280', fontSize: '11px'}}>
                          Se calcula automáticamente (+1 año)
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Certificado de Pulmones */}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Certificado de Pulmones</label>
                    <div style={styles.dateGroup}>
                      <div>
                        <label style={{...styles.label, fontSize: '12px'}}>Fecha Emisión</label>
                        <input
                          type="date"
                          name="pap_pulmones_emision"
                          value={formData.pap_pulmones_emision}
                          onChange={handleInputChange}
                          style={styles.input}
                        />
                      </div>
                      <div>
                        <label style={{...styles.label, fontSize: '12px'}}>Fecha Vencimiento</label>
                        <input
                          type="date"
                          name="pap_pulmones_vencimiento"
                          value={formData.pap_pulmones_vencimiento}
                          onChange={handleInputChange}
                          style={styles.input}
                        />
                        <small style={{color: '#6b7280', fontSize: '11px'}}>
                          Se calcula automáticamente (+1 año)
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div style={styles.warningBox}>
                    <div style={styles.warningTitle}>ℹ️ Información Importante</div>
                    <div style={styles.warningText}>
                      • Si completa el certificado de salud general, debe completar también los certificados de manejo de alimentos y pulmones<br/>
                      • Las fechas de vencimiento se calculan automáticamente (1 año después de la emisión)<br/>
                      • El sistema alertará 30 días antes del vencimiento
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowModal(false)}
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.saveButton,
                    ...(formLoading ? { backgroundColor: '#9ca3af', cursor: 'not-allowed' } : {})
                  }}
                  disabled={formLoading}
                >
                  {formLoading ? 'Guardando...' : (editingEmployee ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;