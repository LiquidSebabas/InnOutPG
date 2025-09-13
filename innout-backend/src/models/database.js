import pool from '../config/database.js';

class Database {
  // Ejecutar query con parámetros
  static async query(text, params) {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Query ejecutada:', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Error en query:', { text, error: error.message });
      throw error;
    }
  }

  // Obtener una sola fila
  static async queryOne(text, params) {
    const result = await this.query(text, params);
    return result.rows[0] || null;
  }

  // Obtener múltiples filas
  static async queryMany(text, params) {
    const result = await this.query(text, params);
    return result.rows;
  }

  // Transacciones
  static async transaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Health check
  static async healthCheck() {
    try {
      const result = await this.query('SELECT NOW() as current_time');
      return { status: 'healthy', time: result.rows[0].current_time };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

export default Database;