// src/pages/Shifts.jsx - Con datos reales del backend
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Configurar localización en español
moment.locale('es');
const localizer = momentLocalizer(moment);

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    height: 'calc(100vh - 120px)'
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
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '20px',
    height: '600px'
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
    maxWidth: '500px',
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
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
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
  select: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white'
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    minHeight: '80px',
    resize: 'vertical'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px'
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
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '16px',
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280'
  }
};

// API service para turnos
const shiftsAPI = {
  async getAll() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar turnos');
    }
    
    return response.json();
  },

  async create(shiftData) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shiftData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear turno');
    }
    
    return response.json();
  },

  async cancel(shiftId, reason) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/shifts/${shiftId}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ motivo: reason })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cancelar turno');
    }
    
    return response.json();
  }
};

// API para empleados (para el dropdown)
const employeesAPI = {
  async getActive() {
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
    
    const data = await response.json();
    // Filtrar solo empleados activos (sin fecha de baja)
    return data.employees.filter(emp => !emp.empl_fecha_baja);
  }
};

const Shifts = () => {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [cancelingEvent, setCancelingEvent] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    empleado_id: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    tipo: 'regular',
    notas: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadInitialData();
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

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      // Cargar empleados y turnos en paralelo
      const [employeesResult, shiftsResult] = await Promise.allSettled([
        employeesAPI.getActive(),
        shiftsAPI.getAll()
      ]);

      // Manejar empleados
      if (employeesResult.status === 'fulfilled') {
        setEmployees(employeesResult.value);
      } else {
        console.error('Error loading employees:', employeesResult.reason);
        // Empleados mock
        setEmployees([
          { empl_id: '1', empl_nombre_completo: 'Juan Pérez' },
          { empl_id: '2', empl_nombre_completo: 'María González' },
          { empl_id: '3', empl_nombre_completo: 'Carlos López' },
          { empl_id: '4', empl_nombre_completo: 'Ana Rodríguez' }
        ]);
      }

      // Manejar turnos
      if (shiftsResult.status === 'fulfilled') {
        const transformedEvents = transformShiftsToEvents(shiftsResult.value.shifts || []);
        setEvents(transformedEvents);
      } else {
        console.error('Error loading shifts:', shiftsResult.reason);
        // Turnos mock
        const mockShifts = [
          {
            tur_id: '1',
            tur_fecha: '2024-12-15',
            tur_hora_inicio: '08:00',
            tur_hora_fin: '16:00',
            empleado_nombre: 'Juan Pérez',
            empleado_id: '1',
            tur_notas: 'Turno regular',
            estado: 'activo'
          },
          {
            tur_id: '2',
            tur_fecha: '2024-12-16',
            tur_hora_inicio: '14:00',
            tur_hora_fin: '22:00',
            empleado_nombre: 'María González',
            empleado_id: '2',
            tur_notas: 'Turno tarde',
            estado: 'activo'
          }
        ];
        setEvents(transformShiftsToEvents(mockShifts));
      }

    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Error cargando datos. Mostrando información de ejemplo.');
    } finally {
      setLoading(false);
    }
  };

  // Transformar datos del backend a formato del calendario
  const transformShiftsToEvents = (shifts) => {
    return shifts.map(shift => {
      const startDateTime = new Date(`${shift.tur_fecha}T${shift.tur_hora_inicio}`);
      const endDateTime = new Date(`${shift.tur_fecha}T${shift.tur_hora_fin}`);
      
      return {
        id: shift.tur_id,
        title: shift.estado === 'cancelado' 
          ? `[CANCELADO] ${shift.empleado_nombre}` 
          : `${shift.empleado_nombre} - ${getShiftTypeLabel(shift.tipo || 'regular')}`,
        start: startDateTime,
        end: endDateTime,
        empleado_id: shift.empleado_id,
        empleado_nombre: shift.empleado_nombre,
        tipo: shift.tipo || 'regular',
        notas: shift.tur_notas,
        estado: shift.estado || 'activo',
        backgroundColor: shift.estado === 'cancelado' 
          ? '#ef4444' 
          : getShiftTypeColor(shift.tipo || 'regular'),
        motivo_cancelacion: shift.motivo_cancelacion
      };
    });
  };

  const handleSelectSlot = (slotInfo) => {
    setSelectedDate(slotInfo.start);
    setFormData({
      empleado_id: '',
      fecha: moment(slotInfo.start).format('YYYY-MM-DD'),
      hora_inicio: moment(slotInfo.start).format('HH:mm'),
      hora_fin: moment(slotInfo.end).format('HH:mm'),
      tipo: 'regular',
      notas: ''
    });
    setShowModal(true);
  };

  const handleSelectEvent = (event) => {
    if (event.estado === 'cancelado') {
      alert(`Turno cancelado.\nMotivo: ${event.motivo_cancelacion || 'No especificado'}`);
      return;
    }

    const action = window.confirm(
      `Turno: ${event.empleado_nombre}\nFecha: ${new Date(event.start).toLocaleDateString('es-GT')}\nHora: ${new Date(event.start).toLocaleTimeString('es-GT')} - ${new Date(event.end).toLocaleTimeString('es-GT')}\n\n¿Deseas cancelar este turno?\n\nOK = Cancelar turno\nCancelar = Cerrar`
    );
    
    if (action) {
      setCancelingEvent(event);
      setShowCancelModal(true);
    }
  };

  const handleAddShift = () => {
    const now = new Date();
    setSelectedDate(now);
    setFormData({
      empleado_id: '',
      fecha: moment(now).format('YYYY-MM-DD'),
      hora_inicio: '08:00',
      hora_fin: '16:00',
      tipo: 'regular',
      notas: ''
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getShiftTypeLabel = (type) => {
    const types = {
      regular: 'Turno Regular',
      matutino: 'Turno Matutino',
      vespertino: 'Turno Vespertino',
      nocturno: 'Turno Nocturno',
      extra: 'Turno Extra'
    };
    return types[type] || 'Turno';
  };

  const getShiftTypeColor = (type) => {
    const colors = {
      regular: '#3b82f6',
      matutino: '#10b981',
      vespertino: '#f59e0b',
      nocturno: '#8b5cf6',
      extra: '#ef4444'
    };
    return colors[type] || '#6b7280';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      // Validaciones
      if (!formData.empleado_id) {
        throw new Error('Debes seleccionar un empleado');
      }

      if (!formData.fecha || !formData.hora_inicio || !formData.hora_fin) {
        throw new Error('Debes completar fecha y horas');
      }

      const startDateTime = new Date(`${formData.fecha}T${formData.hora_inicio}`);
      const endDateTime = new Date(`${formData.fecha}T${formData.hora_fin}`);

      if (endDateTime <= startDateTime) {
        throw new Error('La hora de fin debe ser posterior a la hora de inicio');
      }

      // Preparar datos para el backend
      const shiftData = {
        empleado_id: formData.empleado_id,
        fecha: formData.fecha,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
        tipo: formData.tipo,
        notas: formData.notas
      };

      const result = await shiftsAPI.create(shiftData);
      
      // Agregar el nuevo turno a la lista
      const selectedEmployee = employees.find(emp => emp.empl_id === formData.empleado_id);
      const newEvent = {
        id: result.shift.tur_id,
        title: `${selectedEmployee.empl_nombre_completo} - ${getShiftTypeLabel(formData.tipo)}`,
        start: startDateTime,
        end: endDateTime,
        empleado_id: formData.empleado_id,
        empleado_nombre: selectedEmployee.empl_nombre_completo,
        tipo: formData.tipo,
        notas: formData.notas,
        estado: 'activo',
        backgroundColor: getShiftTypeColor(formData.tipo)
      };

      setEvents([...events, newEvent]);
      setSuccess(`Turno para ${selectedEmployee.empl_nombre_completo} creado exitosamente`);
      setShowModal(false);
      
    } catch (err) {
      console.error('Error creating shift:', err);
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelShift = async () => {
    if (!cancelReason.trim()) {
      setError('Debes proporcionar una razón para la cancelación');
      return;
    }

    try {
      await shiftsAPI.cancel(cancelingEvent.id, cancelReason);

      // Actualizar el evento como cancelado
      const updatedEvents = events.map(event => 
        event.id === cancelingEvent.id 
          ? {
              ...event,
              title: `[CANCELADO] ${event.empleado_nombre}`,
              backgroundColor: '#ef4444',
              estado: 'cancelado',
              motivo_cancelacion: cancelReason
            }
          : event
      );

      setEvents(updatedEvents);
      setSuccess(`Turno de ${cancelingEvent.empleado_nombre} cancelado: ${cancelReason}`);
      setShowCancelModal(false);
      setCancelingEvent(null);
      setCancelReason('');
      
    } catch (err) {
      console.error('Error canceling shift:', err);
      setError('Error al cancelar el turno');
    }
  };

  // Calcular estadísticas
  const today = new Date();
  const todayShifts = events.filter(event => 
    moment(event.start).isSame(today, 'day') && event.estado === 'activo'
  );
  const thisWeekShifts = events.filter(event => 
    moment(event.start).isSame(today, 'week') && event.estado === 'activo'
  );
  const activeEmployees = new Set(
    events.filter(event => event.estado === 'activo').map(event => event.empleado_id)
  ).size;
  const canceledShifts = events.filter(event => event.estado === 'cancelado').length;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Cargando sistema de turnos...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Stats */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{todayShifts.length}</div>
          <div style={styles.statLabel}>Turnos Hoy</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{thisWeekShifts.length}</div>
          <div style={styles.statLabel}>Turnos Esta Semana</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{activeEmployees}</div>
          <div style={styles.statLabel}>Empleados Activos</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{canceledShifts}</div>
          <div style={styles.statLabel}>Turnos Cancelados</div>
        </div>
      </div>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Calendario de Turnos</h1>
        <button
          style={styles.addButton}
          onClick={handleAddShift}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          + Agendar Turno
        </button>
      </div>

      {/* Success Message */}
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

      {/* Error Message */}
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

      {/* Calendar */}
      <div style={styles.calendarContainer}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable={true}
          popup={true}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="week"
          step={60}
          showMultiDayTimes={true}
          messages={{
            allDay: 'Todo el día',
            previous: 'Anterior',
            next: 'Siguiente',
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda',
            date: 'Fecha',
            time: 'Hora',
            event: 'Evento',
            noEventsInRange: 'No hay turnos programados en este rango.',
            showMore: total => `+ Ver más (${total})`
          }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.backgroundColor,
              borderRadius: '5px',
              opacity: 0.8,
              color: 'white',
              border: '0px',
              display: 'block'
            }
          })}
        />
      </div>

      {/* Modal for Add Shift */}
      {showModal && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Agendar Nuevo Turno</h2>
              <button
                style={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form style={styles.form} onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Empleado *</label>
                <select
                  name="empleado_id"
                  value={formData.empleado_id}
                  onChange={handleInputChange}
                  required
                  style={styles.select}
                >
                  <option value="">Seleccionar empleado</option>
                  {employees.map(employee => (
                    <option key={employee.empl_id} value={employee.empl_id}>
                      {employee.empl_nombre_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Tipo de Turno *</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  style={styles.select}
                  required
                >
                  <option value="regular">Turno Regular</option>
                  <option value="matutino">Turno Matutino</option>
                  <option value="vespertino">Turno Vespertino</option>
                  <option value="nocturno">Turno Nocturno</option>
                  <option value="extra">Turno Extra</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Fecha *</label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Hora de Inicio *</label>
                <input
                  type="time"
                  name="hora_inicio"
                  value={formData.hora_inicio}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Hora de Fin *</label>
                <input
                  type="time"
                  name="hora_fin"
                  value={formData.hora_fin}
                  onChange={handleInputChange}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notas</label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleInputChange}
                  style={styles.textarea}
                  placeholder="Notas adicionales sobre el turno..."
                />
              </div>

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
                  {formLoading ? 'Agendando...' : 'Agendar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para cancelar turno */}
      {showCancelModal && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && setShowCancelModal(false)}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Cancelar Turno</h2>
              <button
                style={styles.closeButton}
                onClick={() => setShowCancelModal(false)}
              >
                ×
              </button>
            </div>

            <div style={{marginBottom: '20px'}}>
              <p><strong>Empleado:</strong> {cancelingEvent?.empleado_nombre}</p>
              <p><strong>Fecha:</strong> {cancelingEvent ? new Date(cancelingEvent.start).toLocaleDateString('es-GT') : ''}</p>
              <p><strong>Hora:</strong> {cancelingEvent ? `${new Date(cancelingEvent.start).toLocaleTimeString('es-GT')} - ${new Date(cancelingEvent.end).toLocaleTimeString('es-GT')}` : ''}</p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Razón de la cancelación *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={styles.textarea}
                placeholder="Especifica el motivo de la cancelación (enfermedad, emergencia, etc.)"
                required
              />
            </div>

            <div style={styles.buttonGroup}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
              >
                Cerrar
              </button>
              <button
                type="button"
                style={{
                  ...styles.saveButton,
                  backgroundColor: '#ef4444'
                }}
                onClick={handleCancelShift}
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shifts;