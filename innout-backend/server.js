// server.js
import app from './src/app.js';
import Database from './src/models/database.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor InnOut...');
    
    // Verificar conexión a la base de datos
    const dbHealth = await Database.healthCheck();
    console.log('🗄️  Database status:', dbHealth.status);

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`✅ Servidor corriendo en puerto ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();