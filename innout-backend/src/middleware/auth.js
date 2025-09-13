// src/middleware/auth.js
import { createClient } from '@supabase/supabase-js';
import Database from '../models/database.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verificar token de Supabase
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    // Verificar token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Obtener perfil del usuario
    const userProfile = await Database.queryOne(
      'SELECT usr_id, usr_email, usr_role, usr_name FROM ino_user_profiles WHERE usr_id = $1',
      [user.id]
    );

    if (!userProfile) {
      return res.status(401).json({ error: 'Perfil de usuario no encontrado' });
    }

    req.user = userProfile;
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Verificar roles específicos
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!roles.includes(req.user.usr_role)) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }

    next();
  };
};

// Middleware para admin/hr solamente
export const requireAdmin = requireRole('admin', 'hr');