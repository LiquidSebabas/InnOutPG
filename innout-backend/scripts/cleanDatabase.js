// scripts/cleanDatabase.js
import Database from '../src/models/database.js';
import dotenv from 'dotenv';

dotenv.config();

const cleanDatabase = async () => {
  try {
    console.log('🧹 InnOut - Limpieza de Base de Datos');
    console.log('====================================\n');

    // ============================================================================
    // 1. VERIFICAR ESTADO ACTUAL
    // ============================================================================
    console.log('🔍 Verificando estado actual...');
    
    const estadoActual = await Database.queryOne(`
      SELECT 
        COUNT(*) as total_empleados,
        COUNT(*) FILTER (WHERE empl_deleted_at IS NULL) as empleados_activos,
        COUNT(*) FILTER (WHERE empl_deleted_at IS NOT NULL) as empleados_eliminados
      FROM ino_empleados
    `);
    
    console.log(`📊 Total empleados: ${estadoActual.total_empleados}`);
    console.log(`✅ Activos: ${estadoActual.empleados_activos}`);
    console.log(`❌ Eliminados: ${estadoActual.empleados_eliminados}\n`);

    // ============================================================================
    // 2. MOSTRAR OPCIONES DE LIMPIEZA
    // ============================================================================
    console.log('🛠️  OPCIONES DE LIMPIEZA DISPONIBLES:');
    console.log('====================================');
    console.log('1. 🗑️  Eliminar empleados marcados como eliminados (empl_deleted_at)');
    console.log('2. ↩️  Restaurar empleados eliminados (marcar como activos)');
    console.log('3. 🔄 Actualizar campos faltantes (nombre_lower, etc.)');
    console.log('4. 🧽 Limpiar asignaciones huérfanas (sin empleado o turno)');
    console.log('5. 📄 Crear registros de papelería faltantes');
    console.log('6. 🏢 Activar empresas inactivas');
    console.log('7. 🏗️  Activar áreas inactivas');
    console.log('8. 🔥 RESET COMPLETO (eliminar todos los datos de prueba)');
    console.log('');

    // Para este ejemplo, implementemos algunas limpiezas automáticas
    let limpiezasRealizadas = 0;

    // ============================================================================
    // 3. LIMPIAR ASIGNACIONES HUÉRFANAS
    // ============================================================================
    console.log('🧽 Limpiando asignaciones huérfanas...');
    
    const asignacionesHuerfanas = await Database.query(`
      SELECT at.age_id, at.age_empleado_id, at.age_turno_id
      FROM ino_agendar_turnos at
      LEFT JOIN ino_empleados e ON at.age_empleado_id = e.empl_id
      LEFT JOIN ino_turnos t ON at.age_turno_id = t.tur_id
      WHERE e.empl_id IS NULL OR t.tur_id IS NULL
    `);
    
    if (asignacionesHuerfanas.length > 0) {
      console.log(`⚠️  Encontradas ${asignacionesHuerfanas.length} asignaciones huérfanas:`);
      
      for (const asig of asignacionesHuerfanas) {
        console.log(`   - Asignación ${asig.age_id}: empleado ${asig.age_empleado_id}, turno ${asig.age_turno_id}`);
      }
      
      await Database.query(`
        DELETE FROM ino_agendar_turnos 
        WHERE age_id IN (
          SELECT at.age_id
          FROM ino_agendar_turnos at
          LEFT JOIN ino_empleados e ON at.age_empleado_id = e.empl_id
          LEFT JOIN ino_turnos t ON at.age_turno_id = t.tur_id
          WHERE e.empl_id IS NULL OR t.tur_id IS NULL
        )
      `);
      
      console.log(`✅ ${asignacionesHuerfanas.length} asignaciones huérfanas eliminadas`);
      limpiezasRealizadas++;
    } else {
      console.log('✅ No se encontraron asignaciones huérfanas');
    }
    console.log('');

    // ============================================================================
    // 4. ACTUALIZAR CAMPOS FALTANTES
    // ============================================================================
    console.log('🔄 Actualizando campos faltantes...');
    
    const empleadosSinNombreLower = await Database.query(`
      SELECT empl_id, empl_nombre_completo 
      FROM ino_empleados 
      WHERE empl_nombre_completo_lower IS NULL 
         OR empl_nombre_completo_lower = ''
         OR empl_nombre_completo_lower != LOWER(empl_nombre_completo)
    `);
    
    if (empleadosSinNombreLower.length > 0) {
      console.log(`🔧 Actualizando ${empleadosSinNombreLower.length} nombres en minúsculas...`);
      
      for (const emp of empleadosSinNombreLower) {
        await Database.query(`
          UPDATE ino_empleados 
          SET empl_nombre_completo_lower = $1
          WHERE empl_id = $2
        `, [emp.empl_nombre_completo.toLowerCase(), emp.empl_id]);
      }
      
      console.log('✅ Nombres en minúsculas actualizados');
      limpiezasRealizadas++;
    } else {
      console.log('✅ Todos los nombres en minúsculas están correctos');
    }
    console.log('');

    // ============================================================================
    // 5. ACTIVAR EMPRESAS Y ÁREAS
    // ============================================================================
    console.log('🏢 Verificando empresas y áreas...');
    
    const empresasInactivas = await Database.queryOne(`
      SELECT COUNT(*) as total FROM ino_empresas WHERE emp_is_active = false
    `);
    
    const areasInactivas = await Database.queryOne(`
      SELECT COUNT(*) as total FROM ino_areas WHERE are_is_active = false
    `);
    
    if (parseInt(empresasInactivas.total) > 0) {
      console.log(`🔧 Activando ${empresasInactivas.total} empresas inactivas...`);
      await Database.query(`UPDATE ino_empresas SET emp_is_active = true WHERE emp_is_active = false`);
      console.log('✅ Empresas activadas');
      limpiezasRealizadas++;
    } else {
      console.log('✅ Todas las empresas están activas');
    }
    
    if (parseInt(areasInactivas.total) > 0) {
      console.log(`🔧 Activando ${areasInactivas.total} áreas inactivas...`);
      await Database.query(`UPDATE ino_areas SET are_is_active = true WHERE are_is_active = false`);
      console.log('✅ Áreas activadas');
      limpiezasRealizadas++;
    } else {
      console.log('✅ Todas las áreas están activas');
    }
    console.log('');

    // ============================================================================
    // 6. CREAR REGISTROS DE PAPELERÍA FALTANTES
    // ============================================================================
    console.log('📄 Verificando registros de papelería...');
    
    const empleadosSinPapeleria = await Database.queryMany(`
      SELECT e.empl_id, e.empl_nombre_completo
      FROM ino_empleados e
      LEFT JOIN ino_papeleria p ON e.empl_id = p.pap_empleado_id
      WHERE e.empl_deleted_at IS NULL 
        AND p.pap_id IS NULL
    `);
    
    if (empleadosSinPapeleria.length > 0) {
      console.log(`📝 Creando registros de papelería para ${empleadosSinPapeleria.length} empleados...`);
      
      for (const emp of empleadosSinPapeleria) {
        await Database.query(`
          INSERT INTO ino_papeleria (pap_empleado_id, pap_judicial, pap_policia)
          VALUES ($1, false, false)
        `, [emp.empl_id]);
        
        console.log(`   ✅ ${emp.empl_nombre_completo}`);
      }
      
      console.log('✅ Registros de papelería creados');
      limpiezasRealizadas++;
    } else {
      console.log('✅ Todos los empleados tienen registros de papelería');
    }
    console.log('');

    // ============================================================================
    // 7. VERIFICAR INTEGRIDAD DE DATOS
    // ============================================================================
    console.log('🔍 Verificando integridad de datos...');
    
    // Turnos sin empresa o área
    const turnosSinEmpresa = await Database.queryOne(`
      SELECT COUNT(*) as total 
      FROM ino_turnos t
      LEFT JOIN ino_empresas e ON t.tur_empresa_id = e.emp_id
      WHERE e.emp_id IS NULL
    `);
    
    const turnosSinArea = await Database.queryOne(`
      SELECT COUNT(*) as total 
      FROM ino_turnos t
      LEFT JOIN ino_areas a ON t.tur_area_id = a.are_id
      WHERE a.are_id IS NULL AND t.tur_area_id IS NOT NULL
    `);
    
    if (parseInt(turnosSinEmpresa.total) > 0) {
      console.log(`⚠️  ${turnosSinEmpresa.total} turnos sin empresa válida`);
    }
    
    if (parseInt(turnosSinArea.total) > 0) {
      console.log(`⚠️  ${turnosSinArea.total} turnos sin área válida`);
    }
    
    if (parseInt(turnosSinEmpresa.total) === 0 && parseInt(turnosSinArea.total) === 0) {
      console.log('✅ Integridad de turnos correcta');
    }
    console.log('');

    // ============================================================================
    // 8. RESUMEN FINAL
    // ============================================================================
    console.log('📊 RESUMEN DE LIMPIEZA:');
    console.log('======================');
    
    if (limpiezasRealizadas > 0) {
      console.log(`✅ Se realizaron ${limpiezasRealizadas} operaciones de limpieza`);
      
      // Verificar estado final
      const estadoFinal = await Database.queryOne(`
        SELECT 
          COUNT(*) as total_empleados,
          COUNT(*) FILTER (WHERE empl_deleted_at IS NULL) as empleados_activos
        FROM ino_empleados
      `);
      
      const totalEmpresas = await Database.queryOne(`
        SELECT COUNT(*) as total FROM ino_empresas WHERE emp_is_active = true
      `);
      
      const totalAreas = await Database.queryOne(`
        SELECT COUNT(*) as total FROM ino_areas WHERE are_is_active = true
      `);
      
      const totalTurnos = await Database.queryOne(`
        SELECT COUNT(*) as total FROM ino_turnos WHERE tur_fecha >= CURRENT_DATE
      `);
      
      console.log('');
      console.log('📈 ESTADO FINAL:');
      console.log(`   👥 Empleados activos: ${estadoFinal.empleados_activos}`);
      console.log(`   🏢 Empresas activas: ${totalEmpresas.total}`);
      console.log(`   🏗️  Áreas activas: ${totalAreas.total}`);
      console.log(`   📅 Turnos futuros: ${totalTurnos.total}`);
      
    } else {
      console.log('✅ La base de datos ya estaba limpia');
    }
    
    console.log('');
    console.log('💡 PRÓXIMOS PASOS:');
    console.log('  1. Ejecutar debugDatabase.js para verificar el estado');
    console.log('  2. Si necesitas más datos, ejecutar seedDatabase.js');
    console.log('  3. Revisar las consultas del frontend para incluir filtros apropiados');
    console.log('  4. Limpiar cache del navegador');
    
    console.log('\n🎉 Limpieza completada');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en limpieza:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

cleanDatabase();