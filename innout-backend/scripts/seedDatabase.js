// scripts/seedDatabase.js
import { createClient } from '@supabase/supabase-js';
import Database from '../src/models/database.js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRole) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const seedDatabase = async () => {
  try {
    console.log('🌱 Iniciando población de base de datos...\n');

    // ============================================================================
    // 1. EMPLEADOS
    // ============================================================================
    console.log('👥 Creando empleados...');
    
    const empleados = [
      {
        nombre: 'María Elena Rodríguez',
        telefono: '+502-5555-1001',
        email: 'maria.rodriguez@innout.com',
        fecha_nacimiento: '1985-03-15',
        fecha_contratacion: '2022-01-10'
      },
      {
        nombre: 'Carlos Antonio Méndez',
        telefono: '+502-5555-1002', 
        email: 'carlos.mendez@innout.com',
        fecha_nacimiento: '1990-07-22',
        fecha_contratacion: '2022-03-15'
      },
      {
        nombre: 'Ana Sofía García',
        telefono: '+502-5555-1003',
        email: 'ana.garcia@innout.com', 
        fecha_nacimiento: '1988-11-08',
        fecha_contratacion: '2022-05-20'
      },
      {
        nombre: 'Roberto Daniel López',
        telefono: '+502-5555-1004',
        email: 'roberto.lopez@innout.com',
        fecha_nacimiento: '1992-02-14',
        fecha_contratacion: '2022-08-12'
      },
      {
        nombre: 'Carmen Isabel Morales',
        telefono: '+502-5555-1005',
        email: 'carmen.morales@innout.com',
        fecha_nacimiento: '1987-09-30',
        fecha_contratacion: '2022-10-05'
      },
      {
        nombre: 'José Miguel Herrera',
        telefono: '+502-5555-1006',
        email: 'jose.herrera@innout.com',
        fecha_nacimiento: '1991-12-18',
        fecha_contratacion: '2023-01-15'
      },
      {
        nombre: 'Luisa Fernanda Castillo',
        telefono: '+502-5555-1007',
        email: 'luisa.castillo@innout.com',
        fecha_nacimiento: '1989-04-25',
        fecha_contratacion: '2023-03-10'
      },
      {
        nombre: 'Diego Alejandro Vásquez',
        telefono: '+502-5555-1008',
        email: 'diego.vasquez@innout.com',
        fecha_nacimiento: '1993-06-12',
        fecha_contratacion: '2023-06-01'
      }
    ];

    const empleadosCreados = [];
    
    for (const emp of empleados) {
      const result = await Database.queryOne(
        `INSERT INTO ino_empleados 
         (empl_nombre_completo, empl_nombre_completo_lower, empl_telefono, 
          empl_email, empl_fecha_nacimiento, empl_fecha_contratacion) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING empl_id, empl_nombre_completo`,
        [
          emp.nombre,
          emp.nombre.toLowerCase(),
          emp.telefono,
          emp.email,
          emp.fecha_nacimiento,
          emp.fecha_contratacion
        ]
      );
      empleadosCreados.push(result);
      console.log(`✅ ${result.empl_nombre_completo}`);
    }

    // ============================================================================
    // 2. OBTENER EMPRESAS EXISTENTES
    // ============================================================================
    console.log('\n🏢 Obteniendo empresas existentes...');
    
    const empresas = await Database.queryAll('SELECT emp_id, emp_nombre FROM ino_empresas WHERE emp_is_active = true');
    console.log(`✅ Encontradas ${empresas.length} empresas`);
    empresas.forEach(emp => console.log(`   - ${emp.emp_nombre}`));

    if (empresas.length === 0) {
      console.log('⚠️  No hay empresas. Creando empresas de ejemplo...');
      
      const nuevasEmpresas = [
        { nombre: 'TechCorp Guatemala', telefono: '+502-2222-0001', direccion: 'Zona 10, Ciudad de Guatemala' },
        { nombre: 'Manufacturas del Norte', telefono: '+502-2222-0002', direccion: 'Zona Industrial, Guatemala' },
        { nombre: 'Servicios Logísticos SA', telefono: '+502-2222-0003', direccion: 'Zona 12, Ciudad de Guatemala' }
      ];
      
      for (const empresa of nuevasEmpresas) {
        const result = await Database.queryOne(
          'INSERT INTO ino_empresas (emp_nombre, emp_telefono, emp_direccion) VALUES ($1, $2, $3) RETURNING emp_id, emp_nombre',
          [empresa.nombre, empresa.telefono, empresa.direccion]
        );
        empresas.push(result);
        console.log(`✅ ${result.emp_nombre}`);
      }
    }

    // ============================================================================
    // 3. CREAR ÁREAS
    // ============================================================================
    console.log('\n🏗️  Creando áreas por empresa...');
    
    const areas = ['Producción', 'Administración', 'Logística', 'Seguridad', 'Mantenimiento'];
    const areasCreadas = [];

    for (const empresa of empresas) {
      console.log(`\n   📋 ${empresa.emp_nombre}:`);
      
      for (const nombreArea of areas) {
        const area = await Database.queryOne(
          'INSERT INTO ino_areas (are_empresa_id, are_nombre, are_descripcion) VALUES ($1, $2, $3) RETURNING are_id, are_nombre',
          [
            empresa.emp_id,
            nombreArea,
            `Área de ${nombreArea} para ${empresa.emp_nombre}`
          ]
        );
        areasCreadas.push({ ...area, empresa_id: empresa.emp_id, empresa_nombre: empresa.emp_nombre });
        console.log(`      ✅ ${area.are_nombre}`);
      }
    }

    // ============================================================================
    // 4. CREAR TURNOS DE EJEMPLO
    // ============================================================================
    console.log('\n📅 Creando turnos de ejemplo...');
    
    const horarios = [
      { inicio: '06:00', fin: '14:00', nombre: 'Matutino' },
      { inicio: '14:00', fin: '22:00', nombre: 'Vespertino' },
      { inicio: '22:00', fin: '06:00', nombre: 'Nocturno' }
    ];

    const puestos = ['Supervisor', 'Operario', 'Técnico', 'Coordinador'];
    const turnosCreados = [];

    // Crear turnos para los próximos 14 días
    for (let i = 0; i < 14; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + i);
      const fechaStr = fecha.toISOString().split('T')[0];
      
      // Crear 2-3 turnos por día
      const turnosDia = Math.floor(Math.random() * 2) + 2; // 2 o 3 turnos
      
      for (let j = 0; j < turnosDia; j++) {
        const empresaRandom = empresas[Math.floor(Math.random() * empresas.length)];
        const areaEmpresa = areasCreadas.filter(a => a.empresa_id === empresaRandom.emp_id);
        const areaRandom = areaEmpresa[Math.floor(Math.random() * areaEmpresa.length)];
        const horarioRandom = horarios[Math.floor(Math.random() * horarios.length)];
        const puestoRandom = puestos[Math.floor(Math.random() * puestos.length)];
        
        const turno = await Database.queryOne(
          `INSERT INTO ino_turnos 
           (tur_fecha, tur_hora_inicio, tur_hora_fin, tur_empresa_id, 
            tur_area_id, tur_puesto, tur_notas) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING tur_id`,
          [
            fechaStr,
            horarioRandom.inicio,
            horarioRandom.fin,
            empresaRandom.emp_id,
            areaRandom.are_id,
            puestoRandom,
            `Turno ${horarioRandom.nombre} - ${puestoRandom} en ${areaRandom.are_nombre}`
          ]
        );
        
        turnosCreados.push(turno);
      }
    }
    
    console.log(`✅ ${turnosCreados.length} turnos creados para los próximos 14 días`);

    // ============================================================================
    // 5. ASIGNAR EMPLEADOS A TURNOS
    // ============================================================================
    console.log('\n👷 Asignando empleados a turnos...');
    
    let asignacionesCreadas = 0;
    
    for (const turno of turnosCreados.slice(0, 20)) { // Solo los primeros 20 turnos
      // Asignar 1-3 empleados por turno
      const numEmpleados = Math.floor(Math.random() * 3) + 1;
      const empleadosAsignados = [];
      
      for (let i = 0; i < numEmpleados; i++) {
        let empleadoRandom;
        do {
          empleadoRandom = empleadosCreados[Math.floor(Math.random() * empleadosCreados.length)];
        } while (empleadosAsignados.includes(empleadoRandom.empl_id));
        
        empleadosAsignados.push(empleadoRandom.empl_id);
        
        const estados = ['asignado', 'completado'];
        const roles = ['Principal', 'Apoyo', 'Suplente'];
        
        await Database.execute(
          `INSERT INTO ino_agendar_turnos 
           (age_turno_id, age_empleado_id, age_fecha, age_estado_asignacion, age_rol_en_turno) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            turno.tur_id,
            empleadoRandom.empl_id,
            new Date().toISOString().split('T')[0],
            estados[Math.floor(Math.random() * estados.length)],
            roles[Math.floor(Math.random() * roles.length)]
          ]
        );
        
        asignacionesCreadas++;
      }
    }
    
    console.log(`✅ ${asignacionesCreadas} asignaciones de empleados creadas`);

    // ============================================================================
    // 6. CREAR PAPELERÍA DE EJEMPLO
    // ============================================================================
    console.log('\n📄 Creando registros de papelería...');
    
    for (const empleado of empleadosCreados.slice(0, 5)) { // Solo primeros 5 empleados
      const hoy = new Date();
      const vencimientoSalud = new Date(hoy);
      vencimientoSalud.setMonth(vencimientoSalud.getMonth() + 6);
      
      const vencimientoAlimentos = new Date(hoy);
      vencimientoAlimentos.setMonth(vencimientoAlimentos.getMonth() + 12);
      
      const vencimientoPulmones = new Date(hoy);
      vencimientoPulmones.setMonth(vencimientoPulmones.getMonth() + 8);
      
      await Database.execute(
        `INSERT INTO ino_papeleria 
         (pap_empleado_id, pap_judicial, pap_policia, 
          pap_salud_emision, pap_salud_vencimiento,
          pap_alimentos_emision, pap_alimentos_vencimiento,
          pap_pulmones_emision, pap_pulmones_vencimiento) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          empleado.empl_id,
          true,
          true,
          hoy.toISOString().split('T')[0],
          vencimientoSalud.toISOString().split('T')[0],
          hoy.toISOString().split('T')[0],
          vencimientoAlimentos.toISOString().split('T')[0],
          hoy.toISOString().split('T')[0],
          vencimientoPulmones.toISOString().split('T')[0]
        ]
      );
      
      console.log(`✅ Papelería creada para ${empleado.empl_nombre_completo}`);
    }

    // ============================================================================
    // 7. RESUMEN FINAL
    // ============================================================================
    console.log('\n🎉 ¡Base de datos poblada exitosamente!');
    console.log('=====================================');
    console.log(`👥 Empleados: ${empleadosCreados.length}`);
    console.log(`🏢 Empresas: ${empresas.length}`);
    console.log(`🏗️  Áreas: ${areasCreadas.length}`);
    console.log(`📅 Turnos: ${turnosCreados.length}`);
    console.log(`👷 Asignaciones: ${asignacionesCreadas}`);
    console.log(`📄 Registros de papelería: 5`);
    
    console.log('\n📋 DATOS DISPONIBLES:');
    console.log('=====================');
    console.log(`👥 Total empleados activos: ${empleadosCreados.length}`);
    console.log(`🆕 Empleados nuevos creados: ${empleadosNuevos.length}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error poblando base de datos:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

console.log('🌱 InnOut - Poblar Base de Datos');
console.log('================================');
seedDatabase();