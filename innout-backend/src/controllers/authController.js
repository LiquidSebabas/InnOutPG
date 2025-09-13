// src/controllers/authController.js
import { createClient } from '@supabase/supabase-js';
import Database from '../models/database.js';

// Cliente Supabase normal (no service role)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || 'your_anon_key'
);

class AuthController {
  // Login con Supabase Auth
  // Cambia el método login por esto (solo temporalmente para debug):

static async login(req, res) {
  try {
    console.log('=== LOGIN DEBUG ===');
    console.log('Request body:', req.body);
    console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
    console.log('SUPABASE_ANON_KEY length:', process.env.SUPABASE_ANON_KEY?.length);
    
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    console.log('Attempting Supabase login for:', email);

    // Intentar login con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log('Supabase response - data:', !!data);
    console.log('Supabase response - error:', error);

    if (error) {
      console.log('Supabase auth error:', error.message);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    console.log('Auth successful, fetching profile for user ID:', data.user.id);

    // Obtener perfil del usuario
    const userProfile = await Database.queryOne(
      'SELECT usr_id, usr_email, usr_role, usr_name FROM ino_user_profiles WHERE usr_id = $1',
      [data.user.id]
    );

    console.log('User profile found:', !!userProfile);

    if (!userProfile) {
      return res.status(401).json({ error: 'Perfil de usuario no encontrado' });
    }

    res.json({
      message: 'Login exitoso',
      user: userProfile,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });

  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('==================');
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

  // Verificar sesión actual
  static async verifySession(req, res) {
    try {
      // El middleware auth ya validó el token
      res.json({
        valid: true,
        user: req.user
      });
    } catch (error) {
      console.error('Error verificando sesión:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Logout
  static async logout(req, res) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        // Invalidar sesión en Supabase
        await supabase.auth.admin.signOut(token);
      }

      res.json({ message: 'Logout exitoso' });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Cambiar contraseña
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          error: 'Contraseña actual y nueva contraseña son requeridas' 
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ 
          error: 'La nueva contraseña debe tener al menos 8 caracteres' 
        });
      }

      // Verificar contraseña actual haciendo login
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: req.user.usr_email,
        password: currentPassword
      });

      if (verifyError) {
        return res.status(400).json({ error: 'Contraseña actual incorrecta' });
      }

      // Cambiar contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        return res.status(400).json({ 
          error: `Error actualizando contraseña: ${updateError.message}` 
        });
      }

      res.json({ message: 'Contraseña actualizada exitosamente' });

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Solicitar reset de contraseña
  static async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email es requerido' });
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });

      if (error) {
        return res.status(400).json({ 
          error: `Error enviando email de reset: ${error.message}` 
        });
      }

      res.json({ 
        message: 'Email de recuperación enviado (si el email existe en el sistema)' 
      });

    } catch (error) {
      console.error('Error solicitando reset:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Actualizar perfil
  static async updateProfile(req, res) {
    try {
      const { usr_name } = req.body;
      const userId = req.user.usr_id;

      if (!usr_name || !usr_name.trim()) {
        return res.status(400).json({ error: 'Nombre es requerido' });
      }

      const updatedProfile = await Database.queryOne(
        'UPDATE ino_user_profiles SET usr_name = $1 WHERE usr_id = $2 RETURNING *',
        [usr_name.trim(), userId]
      );

      if (!updatedProfile) {
        return res.status(404).json({ error: 'Perfil no encontrado' });
      }

      res.json({
        message: 'Perfil actualizado exitosamente',
        user: updatedProfile
      });

    } catch (error) {
      console.error('Error actualizando perfil:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

export default AuthController;