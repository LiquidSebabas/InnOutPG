// scripts/seedAreasYTurnos.js
import Database from '../src/models/database.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAreasYTurnos = async () => {
  try {
    console.log('🏗️  InnOut - Crear Áreas y Turnos');
    console.log('=================================\n');

    // ============================================================================
    // 1. OBTENER EMPRESAS EXISTENTES
    // ============================================================================
    console.log('🏢 Obteniendo empresas existentes...');
    
    const empresas = await Database.queryMany('SELECT emp_id, emp_nombre FROM ino_empresas WHERE emp_is_active = true');
    console.log(`✅ Encontradas ${empresas.length} empresas activas:`);
    empresas.forEach(emp => console.log(`   - ${emp.emp_nombre}`));

    if (empresas.length === 0) {
      console.log('❌ No hay empresas activas. No se pueden crear áreas.');
      process.exit(1);
    }

    // ============================================================================
    // 2. CREAR ÁREAS (pueden repetirse entre empresas)
    // ============================================================================
    console.log('\n🏗️  Creando áreas...');
    
    // Áreas comunes que pueden existir en múltiples empresas
    const tiposAreas = [
      'Limpieza',
      'Seguridad', 
      'Mantenimiento',
      'Administración',
      'Producción',
      'Logística',
      'Control de Calidad',
      'Recursos Humanos'
    ];

    const areasCreadas = [];

    for (const empresa of empresas) {
      console.log(`\n   📋 Creando áreas para ${empresa.emp_nombre}:`);
      
      // Crear entre 3-6 áreas por empresa (aleatorio)
      const numAreas = Math.floor(Math.random() * 4) + 3; // 3-6 áreas
      const areasEmpresa = [...tiposAreas].sort(() => 0.5 - Math.random()).slice(0, numAreas);
      
      for (const nombreArea of areasEmpresa) {
        // Verificar si ya existe esta área para esta empresa
        const areaExistente = await Database.queryOne(
          'SELECT are_id FROM ino_areas WHERE are_empresa_id = $1 AND are_nombre = $2',
          [empresa.emp_id, nombreArea]
        );
        
        if (!areaExistente) {
          const area = await Database.queryOne(
            'INSERT INTO ino_areas (are_empresa_id, are_nombre, are_descripcion, are_is_active) VALUES ($1, $2, $3, $4) RETURNING are_id, are_nombre',
            [
              empresa.emp_id,
              nombreArea,
              `Área de ${nombreArea} en ${empresa.emp_nombre}`,
              true
            ]
          );
          areasCreadas.push({ ...area, empresa_id: empresa.emp_id, empresa_nombre: empresa.emp_nombre });
          console.log(`      ✅ ${area.are_nombre}`);
        } else {
          console.log(`      ⏭️  ${nombreArea} (ya existe)`);
        }
      }
    }

    console.log(`\n✅ Total de áreas procesadas: ${areasCreadas.length} nuevas`);

    // ============================================================================
    // 3. OBTENER EMPLEADOS DISPONIBLES
    // ============================================================================
    console.log('\n👥 Obteniendo empleados disponibles...');
    
    const empleados = await Database.queryMany('SELECT empl_id, empl_nombre_completo FROM ino_empleados WHERE empl_deleted_at IS NULL');
    console.log(`✅ Encontrados ${empleados.length} empleados activos`);

    if (empleados.length === 0) {
      console.log('❌ No hay empleados disponibles para asignar a turnos.');
      process.exit(1);
    }

    // ============================================================================
    // 4. CREAR TURNOS
    // ============================================================================
    console.log('\n📅 Creando turnos para los próximos 14 días...');
    
    const horarios = [
      { inicio: '06:00', fin: '14:00', nombre: 'Matutino' },
      { inicio: '14:00', fin: '22:00', nombre: 'Vespertino' },
      { inicio: '22:00', fin: '06:00', nombre: 'Nocturno' }
    ];

    const puestos = [
      'Supervisor',
      'Operario', 
      'Técnico',
      'Coordinador',
      'Asistente',
      'Encargado'
    ];

    const turnosCreados = [];
    const todasLasAreas = await Database.queryMany('SELECT are_id, are_nombre, are_empresa_id FROM ino_areas WHERE are_is_active = true');

    // Crear turnos para los próximos 14 días
    for (let dia = 0; dia < 14; dia++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + dia);
      const fechaStr = fecha.toISOString().split('T')[0];
      
      console.log(`📅 Creando turnos para ${fechaStr}...`);
      
      // Crear turnos para algunas áreas (no todas las áreas tienen turnos todos los días)
      const areasConTurnos = todasLasAreas.filter(() => Math.random() > 0.4); // 60% de probabilidad
      
      for (const area of areasConTurnos) {
        // Algunas áreas pueden tener múltiples turnos en el día
        const numTurnos = Math.random() > 0.7 ? 2 : 1; // 30% probabilidad de 2 turnos
        
        for (let t = 0; t < numTurnos; t++) {
          const horarioRandom = horarios[Math.floor(Math.random() * horarios.length)];
          const puestoRandom = puestos[Math.floor(Math.random() * puestos.length)];
          
          // Verificar que no exista ya este turno
          const turnoExistente = await Database.queryOne(
            'SELECT tur_id FROM ino_turnos WHERE tur_fecha = $1 AND tur_hora_inicio = $2 AND tur_area_id = $3',
            [fechaStr, horarioRandom.inicio, area.are_id]
          );
          
          if (!turnoExistente) {
            const turno = await Database.queryOne(
              `INSERT INTO ino_turnos 
               (tur_fecha, tur_hora_inicio, tur_hora_fin, tur_empresa_id, 
                tur_area_id, tur_puesto, tur_notas) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) 
               RETURNING tur_id, tur_fecha, tur_hora_inicio, tur_puesto`,
              [
                fechaStr,
                horarioRandom.inicio,
                horarioRandom.fin,
                area.are_empresa_id,
                area.are_id,
                puestoRandom,
                `Turno ${horarioRandom.nombre} - ${puestoRandom} en ${area.are_nombre}`
              ]
            );
            
            turnosCreados.push({...turno, area_nombre: area.are_nombre});
          }
        }
      }
    }
    
    console.log(`✅ ${turnosCreados.length} turnos creados`);

    // ============================================================================
    // 5. ASIGNAR ALGUNOS EMPLEADOS A TURNOS (CON ESTRUCTURA CORRECTA)
    // ============================================================================
    console.log('\n👷 Asignando empleados a turnos...');
    
    let asignacionesCreadas = 0;
    
    // Asignar empleados a algunos turnos
    const turnosParaAsignar = turnosCreados.slice(0, Math.min(25, turnosCreados.length));
    
    for (const turno of turnosParaAsignar) {
      // Asignar 1-2 empleados por turno
      const numEmpleados = Math.floor(Math.random() * 2) + 1;
      const empleadosAsignados = [];
      
      for (let i = 0; i < numEmpleados; i++) {
        let empleadoRandom;
        do {
          empleadoRandom = empleados[Math.floor(Math.random() * empleados.length)];
        } while (empleadosAsignados.includes(empleadoRandom.empl_id));
        
        empleadosAsignados.push(empleadoRandom.empl_id);
        
        const estados = ['asignado', 'completado'];
        const roles = ['Principal', 'Apoyo'];
        
        // Verificar que no exista ya esta asignación
        const asignacionExistente = await Database.queryOne(
          'SELECT age_id FROM ino_agendar_turnos WHERE age_turno_id = $1 AND age_empleado_id = $2',
          [turno.tur_id, empleadoRandom.empl_id]
        );
        
        if (!asignacionExistente) {
          await Database.query(
            `INSERT INTO ino_agendar_turnos 
             (age_turno_id, age_empleado_id, age_fecha, age_estado_asignacion, age_rol_en_turno) 
             VALUES ($1, $2, $3, $4, $5)`,
            [
              turno.tur_id,
              empleadoRandom.empl_id,
              turno.tur_fecha,
              estados[Math.floor(Math.random() * estados.length)],
              roles[Math.floor(Math.random() * roles.length)]
            ]
          );
          
          asignacionesCreadas++;
        }
      }
    }
    
    console.log(`✅ ${asignacionesCreadas} asignaciones creadas`);

    // ============================================================================
    // 6. RESUMEN FINAL
    // ============================================================================
    console.log('\n🎉 ¡Áreas y turnos creados exitosamente!');
    console.log('========================================');
    
    const resumenFinal = await Database.queryOne(`
      SELECT 
        (SELECT COUNT(*) FROM ino_areas WHERE are_is_active = true) as total_areas,
        (SELECT COUNT(*) FROM ino_turnos WHERE tur_fecha >= CURRENT_DATE) as turnos_futuros,
        (SELECT COUNT(*) FROM ino_agendar_turnos) as total_asignaciones,
        (SELECT COUNT(*) FROM ino_empleados WHERE empl_deleted_at IS NULL) as empleados_activos,
        (SELECT COUNT(*) FROM ino_empresas WHERE emp_is_active = true) as empresas_activas
    `);
    
    console.log(`🏗️  Áreas activas: ${resumenFinal.total_areas}`);
    console.log(`🏢 Empresas activas: ${resumenFinal.empresas_activas}`);
    console.log(`👥 Empleados activos: ${resumenFinal.empleados_activos}`);
    console.log(`📅 Turnos futuros: ${resumenFinal.turnos_futuros}`);
    console.log(`👷 Total asignaciones: ${resumenFinal.total_asignaciones}`);
    
    console.log('\n✅ Listo para probar el dashboard y la sección de turnos');
    console.log('💡 Ahora deberían aparecer datos en ambas secciones de tu aplicación');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creando áreas y turnos:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

console.log('🏗️  InnOut - Crear Áreas y Turnos');
console.log('=================================');
seedAreasYTurnos();