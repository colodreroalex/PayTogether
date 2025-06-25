import { pool } from './db.js';

async function testConnection() {
  try {
    console.log('🔄 Probando conexión a la base de datos...');
    
    // Probar conexión básica
    const client = await pool.connect();
    console.log('✅ Conexión establecida exitosamente');
    
    // Probar una consulta simple
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('📅 Hora del servidor:', result.rows[0].current_time);
    console.log('🐘 Versión de PostgreSQL:', result.rows[0].postgres_version);
    
    // Verificar si existen tablas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📋 Tablas existentes en la base de datos:');
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No se encontraron tablas en la base de datos');
      console.log('💡 Necesitarás crear las tablas para tu aplicación');
    }
    
    client.release();
    console.log('✅ Prueba de conexión completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba de conexión:', error.message);
    console.error('🔍 Detalles del error:', error);
  } finally {
    await pool.end();
    console.log('🔌 Pool de conexiones cerrado');
  }
}

// Ejecutar la prueba
testConnection();