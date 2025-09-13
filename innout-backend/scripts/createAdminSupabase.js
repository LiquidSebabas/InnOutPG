// scripts/createAdminSupabase.js
import { createClient } from '@supabase/supabase-js';
import Database from '../src/models/database.js';
import dotenv from 'dotenv';

dotenv.config();

// Cliente Supabase con service role para operaciones admin
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRole) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada en .env');
  console.log('💡 Ve a Supabase → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const createAdminUser = async () => {
  try {
    console.log('🚀 Creando usuario administrador con Supabase Auth...');
    
    const email = 'admin@innout.com';
    const password = 'Admin123!';
    const name = 'Administrador InnOut';
    const role = 'admin';

    // Verificar si ya existe en auth.users
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Error listando usuarios: ${listError.message}`);
    }

    const existingUser = existingUsers.users.find(user => user.email === email);
    
    if (existingUser) {
      console.log('❌ El usuario admin ya existe en Supabase Auth');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      console.log('🆔 User ID:', existingUser.id);
      
      // Verificar/actualizar perfil
      const profile = await Database.queryOne(
        'SELECT * FROM ino_user_profiles WHERE usr_id = $1',
        [existingUser.id]
      );
      
      if (!profile) {
        console.log('🔧 Creando perfil faltante...');
        await Database.query(
          'INSERT INTO ino_user_profiles (usr_id, usr_email, usr_name, usr_role) VALUES ($1, $2, $3, $4)',
          [existingUser.id, email, name, role]
        );
        console.log('✅ Perfil creado');
      } else {
        console.log('✅ Perfil existe');
      }
      
      process.exit(0);
    }

    // Crear usuario en Supabase Auth
    console.log('👤 Creando usuario en Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        name: name,
        role: role
      }
    });

    if (authError) {
      throw new Error(`Error creando usuario en Auth: ${authError.message}`);
    }

    console.log('🔧 Creando perfil de usuario...');
    
    // Crear perfil con rol admin
    await Database.query(
      'INSERT INTO ino_user_profiles (usr_id, usr_email, usr_name, usr_role) VALUES ($1, $2, $3, $4)',
      [authData.user.id, email, name, role]
    );

    console.log('✅ Usuario admin creado exitosamente!');
    console.log('');
    console.log('📋 CREDENCIALES DE ACCESO:');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Nombre:', name);
    console.log('🛡️  Rol:', role);
    console.log('🆔 Auth ID:', authData.user.id);
    console.log('📅 Creado:', authData.user.created_at);
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    console.log('🌐 Login en: http://localhost:5173/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando usuario admin:', error.message);
    
    if (error.message.includes('service_role')) {
      console.log('💡 Necesitas configurar SUPABASE_SERVICE_ROLE_KEY en tu .env');
      console.log('   Ve a Supabase → Settings → API → service_role key');
    }
    
    process.exit(1);
  }
};

console.log('🏗️  InnOut - Creador de Usuario Admin (Supabase Auth)');
console.log('======================================================');
createAdminUser();