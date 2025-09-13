// scripts/debugDatabase.js
import Database from '../src/models/database.js';
import dotenv from 'dotenv';

dotenv.config();

const debugDatabase = async () => {
  try {
    console.log('🔍 InnOut - Diagnóstico de Base de Datos');
    console.log('========================================\n');

    // ============================================================================
    // 1. VERIFICAR CONEXIÓN
    // ============================================================================
    console.log('🔌 Verificando conexión...');
    
    const testResult = await Database.queryOne('SELECT NOW() as current_time');
    console.log(`✅ Conexión exitosa. Hora del servidor: ${testResult.current_time}\n`);

    // ============================================================================
    // 2. CONTAR REGISTROS EN CADA TABLA
    // ============================================================================
    console.log('📊 Conteo de registros por tabla:');
    console.log('================================');

    const tablas = [
      'ino_empleados',
      'ino_empresas', 
      'ino_areas',
      'ino_turnos',
      'ino_agendar_turnos',
      'ino_papeleria',
      'ino_estado_papeleria',
      'ino_user_profiles'
    ];

    const conteos = {};
    
    for (const tabla of tablas) {
      try {
        const result = await Database.queryOne(`SELECT COUNT(*) as total FROM ${tabla}`);
        conteos[tabla] = parseInt(result.total);
        console.log(`📋 ${tabla}: ${result.total} registros`);
      } catch (error) {
        console.log(`❌ ${tabla}: Error - ${error.message}`);
        conteos[tabla] = 0;
      }
    }

    console.log('');

    // ============================================================================
    // 3. DETALLES DE EMPLEADOS
    // ============================================================================
    if (conteos.ino_empleados > 0) {
      console.log('👥 Detalles de empleados:');
      console.log('========================');
      
      const empleados = await Database.queryMany(`
        SELECT 
          empl_id,
          empl_nombre_completo,
          empl_email,
          empl_telefono,
          empl_fecha_contratacion,
          empl_created_at,
          empl_deleted_at
        FROM ino_empleados 
        ORDER BY empl_created_at DESC
        LIMIT 10
      `);
      
      empleados.forEach((emp, i) => {
        console.log(`${i + 1}. ${emp.empl_nombre_completo}`);
        console.log(`   📧 ${emp.empl_email}`);
        console.log(`   📞 ${emp.empl_telefono || 'Sin teléfono'}`);
        console.log(`   📅 Contratado: ${emp.empl_fecha_contratacion || 'No especificada'}`);
        console.log(`   🗑️  Eliminado: ${emp.empl_deleted_at ? 'SÍ' : 'NO'}`);
        console.log(`   🆔 ID: ${emp.empl_id.substring(0, 8)}...`);
        console.log('');
      });
    }

    // ============================================================================
    // 4. DETALLES DE EMPRESAS Y ÁREAS
    // ============================================================================
    if (conteos.ino_empresas > 0) {
      console.log('🏢 Empresas y sus áreas:');
      console.log('========================');
      
      const empresasConAreas = await Database.queryMany(`
        SELECT 
          e.emp_id,
          e.emp_nombre,
          e.emp_is_active,
          COUNT(a.are_id) as total_areas
        FROM ino_empresas e
        LEFT JOIN ino_areas a ON e.emp_id = a.are_empresa_id AND a.are_is_active = true
        GROUP BY e.emp_id, e.emp_nombre, e.emp_is_active
        ORDER BY e.emp_nombre
      `);
      
      for (const empresa of empresasConAreas) {
        console.log(`🏢 ${empresa.emp_nombre} ${empresa.emp_is_active ? '✅' : '❌'}`);
        console.log(`   📊 ${empresa.total_areas} áreas`);
        
        if (parseInt(empresa.total_areas) > 0) {
          const areas = await Database.queryMany(`
            SELECT are_nombre FROM ino_areas 
            WHERE are_empresa_id = $1 AND are_is_active = true
            ORDER BY are_nombre
          `, [empresa.emp_id]);
          
          areas.forEach(area => {
            console.log(`      - ${area.are_nombre}`);
          });
        }
        console.log('');
      }
    }

    // ============================================================================
    // 5. TURNOS RECIENTES
    // ============================================================================
    if (conteos.ino_turnos > 0) {
      console.log('📅 Turnos recientes:');
      console.log('===================');
      
      const turnos = await Database.queryMany(`
        SELECT 
          t.tur_id,
          t.tur_fecha,
          t.tur_hora_inicio,
          t.tur_hora_fin,
          t.tur_puesto,
          e.emp_nombre,
          a.are_nombre,
          COUNT(at.age_id) as empleados_asignados
        FROM ino_turnos t
        LEFT JOIN ino_empresas e ON t.tur_empresa_id = e.emp_id
        LEFT JOIN ino_areas a ON t.tur_area_id = a.are_id
        LEFT JOIN ino_agendar_turnos at ON t.tur_id = at.age_turno_id
        GROUP BY t.tur_id, t.tur_fecha, t.tur_hora_inicio, t.tur_hora_fin, 
                 t.tur_puesto, e.emp_nombre, a.are_nombre
        ORDER BY t.tur_fecha DESC, t.tur_hora_inicio
        LIMIT 10
      `);
      
      turnos.forEach((turno, i) => {
        console.log(`${i + 1}. ${turno.tur_fecha} ${turno.tur_hora_inicio}-${turno.tur_hora_fin}`);
        console.log(`   🏢 ${turno.emp_nombre || 'Sin empresa'}`);
        console.log(`   🏗️  ${turno.are_nombre || 'Sin área'}`);
        console.log(`   💼 ${turno.tur_puesto || 'Sin puesto'}`);
        console.log(`   👥 ${turno.empleados_asignados} empleados asignados`);
        console.log('');
      });
    } else {
      console.log('📅 No hay turnos creados aún\n');
    }

    // ============================================================================
    // 6. ASIGNACIONES DE TURNOS
    // ============================================================================
    if (conteos.ino_agendar_turnos > 0) {
      console.log('👷 Asignaciones de turnos:');
      console.log('=========================');
      
      const asignaciones = await Database.queryMany(`
        SELECT 
          at.age_id,
          at.age_fecha,
          at.age_estado_asignacion,
          at.age_rol_en_turno,
          e.empl_nombre_completo,
          t.tur_fecha,
          t.tur_hora_inicio,
          t.tur_hora_fin,
          emp.emp_nombre
        FROM ino_agendar_turnos at
        LEFT JOIN ino_empleados e ON at.age_empleado_id = e.empl_id
        LEFT JOIN ino_turnos t ON at.age_turno_id = t.tur_id
        LEFT JOIN ino_empresas emp ON t.tur_empresa_id = emp.emp_id
        ORDER BY at.age_fecha DESC, t.tur_hora_inicio
        LIMIT 15
      `);
      
      asignaciones.forEach((asig, i) => {
        console.log(`${i + 1}. ${asig.empl_nombre_completo || 'Empleado eliminado'}`);
        console.log(`   📅 Turno: ${asig.tur_fecha} ${asig.tur_hora_inicio}-${asig.tur_hora_fin}`);
        console.log(`   🏢 ${asig.emp_nombre || 'Sin empresa'}`);
        console.log(`   📊 Estado: ${asig.age_estado_asignacion}`);
        console.log(`   🎭 Rol: ${asig.age_rol_en_turno || 'Sin rol'}`);
        console.log('');
      });
    } else {
      console.log('👷 No hay asignaciones de turnos aún\n');
    }

    // ============================================================================
    // 7. USUARIOS Y PERFILES
    // ============================================================================
    if (conteos.ino_user_profiles > 0) {
      console.log('👤 Usuarios del sistema:');
      console.log('=======================');
      
      const usuarios = await Database.queryMany(`
        SELECT 
          usr_id,
          usr_email,
          usr_name,
          usr_role,
          usr_created_at
        FROM ino_user_profiles
        ORDER BY usr_created_at DESC
      `);
      
      usuarios.forEach((user, i) => {
        console.log(`${i + 1}. ${user.usr_name || 'Sin nombre'}`);
        console.log(`   📧 ${user.usr_email}`);
        console.log(`   🛡️  ${user.usr_role}`);
        console.log(`   📅 ${new Date(user.usr_created_at).toLocaleDateString()}`);
        console.log('');
      });
    }

    // ============================================================================
    // 8. VERIFICACIONES ESPECÍFICAS PARA DEBUGGING
    // ============================================================================
    console.log('🔍 Verificaciones específicas:');
    console.log('=============================');

    const empleadosActivos = await Database.queryOne(`
      SELECT COUNT(*) as total 
      FROM ino_empleados 
      WHERE empl_deleted_at IS NULL
    `);
    console.log(`👥 Empleados activos (no eliminados): ${empleadosActivos.total}`);

    const empresasActivas = await Database.queryOne(`
      SELECT COUNT(*) as total 
      FROM ino_empresas 
      WHERE emp_is_active = true
    `);
    console.log(`🏢 Empresas activas: ${empresasActivas.total}`);

    const areasActivas = await Database.queryOne(`
      SELECT COUNT(*) as total 
      FROM ino_areas 
      WHERE are_is_active = true
    `);
    console.log(`🏗️  Áreas activas: ${areasActivas.total}`);

    const turnosFuturos = await Database.queryOne(`
      SELECT COUNT(*) as total 
      FROM ino_turnos 
      WHERE tur_fecha >= CURRENT_DATE
    `);
    console.log(`📅 Turnos futuros: ${turnosFuturos.total}`);

    console.log('\n🎯 DIAGNÓSTICO DEL PROBLEMA:');
    console.log('============================');

    if (conteos.ino_empleados === 0) {
      console.log('❌ CRÍTICO: No hay empleados en la base de datos');
    } else if (parseInt(empleadosActivos.total) === 0) {
      console.log('⚠️  PROBLEMA: Todos los empleados están marcados como eliminados');
    } else {
      console.log(`✅ Empleados: ${empleadosActivos.total} activos disponibles`);
    }

    if (conteos.ino_empresas === 0) {
      console.log('❌ CRÍTICO: No hay empresas en la base de datos');
    } else if (parseInt(empresasActivas.total) === 0) {
      console.log('⚠️  PROBLEMA: Todas las empresas están inactivas');
    } else {
      console.log(`✅ Empresas: ${empresasActivas.total} activas disponibles`);
    }

    if (parseInt(areasActivas.total) === 0) {
      console.log('⚠️  FALTA: No hay áreas creadas - esto puede afectar el dashboard');
    } else {
      console.log(`✅ Áreas: ${areasActivas.total} disponibles`);
    }

    if (parseInt(empleadosActivos.total) > 0 && parseInt(turnosFuturos.total) === 0) {
      console.log('⚠️  FALTA: No hay turnos futuros - esto puede afectar la sección de turnos');
    } else if (parseInt(turnosFuturos.total) > 0) {
      console.log(`✅ Turnos: ${turnosFuturos.total} futuros programados`);
    }

    if (conteos.ino_agendar_turnos === 0 && conteos.ino_turnos > 0) {
      console.log('⚠️  INCONSISTENCIA: Hay turnos pero sin empleados asignados');
    }

    console.log('\n💡 RECOMENDACIONES:');
    console.log('===================');
    
    if (parseInt(areasActivas.total) === 0) {
      console.log('1. 🏗️  Ejecutar seedDatabase.js para crear áreas');
    }
    
    if (parseInt(turnosFuturos.total) === 0) {
      console.log('2. 📅 Ejecutar seedDatabase.js para crear turnos');
    }
    
    if (conteos.ino_agendar_turnos === 0) {
      console.log('3. 👷 Ejecutar seedDatabase.js para crear asignaciones');
    }
    
    console.log('4. 🔄 Verificar consultas del frontend (filtros de empleados eliminados)');
    console.log('5. 🧹 Limpiar cache del navegador (Ctrl+F5)');
    
    console.log('\n✅ Diagnóstico completado');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

debugDatabase();