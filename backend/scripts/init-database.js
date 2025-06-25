const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initializeDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado a PostgreSQL');

    // Leer el archivo SQL
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 Ejecutando script de inicialización...');
    await client.query(schema);
    console.log('✅ Base de datos inicializada correctamente');

    // Verificar que las tablas se crearon
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📋 Tablas creadas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Verificar categorías por defecto
    const categoriesResult = await client.query('SELECT COUNT(*) as count FROM categories WHERE is_default = true');
    console.log(`📦 Categorías por defecto: ${categoriesResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Inicialización completada exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error durante la inicialización:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };