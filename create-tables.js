import { pool } from './db.js';
import fs from 'fs';

async function createTables() {
  try {
    console.log('🔄 Creando tablas en la base de datos...');
    
    // Leer el archivo SQL
    const schema = fs.readFileSync('./schema.sql', 'utf8');
    
    // Ejecutar el schema
    await pool.query(schema);
    
    console.log('✅ Tablas creadas exitosamente');
    
    // Verificar que las tablas se crearon
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tablas creadas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Verificar categorías
    const categoriesResult = await pool.query('SELECT COUNT(*) as count FROM categories');
    console.log(`📦 Categorías disponibles: ${categoriesResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error creando tablas:', error.message);
    console.error('🔍 Detalles:', error);
  } finally {
    await pool.end();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar
createTables();