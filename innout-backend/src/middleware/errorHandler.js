// Error handler global
export const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  // Error de PostgreSQL
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return res.status(409).json({
          error: 'Ya existe un registro con esa información',
          details: 'Violación de restricción única'
        });
      case '23503': // Foreign key violation
        return res.status(400).json({
          error: 'Referencia inválida',
          details: 'El registro referenciado no existe'
        });
      case '23514': // Check violation
        return res.status(400).json({
          error: 'Datos inválidos',
          details: 'Los datos no cumplen las restricciones'
        });
    }
  }

  // Error de validación
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: error.message
    });
  }

  // Error por defecto
  res.status(500).json({
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
};

// 404 handler
export const notFound = (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl
  });
};