// src/config/jwt.js
import jwt from 'jsonwebtoken';

// Configuración JWT
export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRE || '7d',
  algorithm: 'HS256'
};

// Generar token JWT
export const generateToken = (payload) => {
  if (!JWT_CONFIG.secret) {
    throw new Error('JWT_SECRET no está configurado');
  }

  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn,
    algorithm: JWT_CONFIG.algorithm
  });
};

// Verificar token JWT
export const verifyToken = (token) => {
  if (!JWT_CONFIG.secret) {
    throw new Error('JWT_SECRET no está configurado');
  }

  return jwt.verify(token, JWT_CONFIG.secret);
};

// Decodificar token sin verificar (para debugging)
export const decodeToken = (token) => {
  return jwt.decode(token);
};