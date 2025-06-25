import pkg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pkg;
import { DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT } from "./config.js";

// Cargar variables de entorno
dotenv.config();

// Verificar si existe DATABASE_URL (proporcionado por Render) o usar variables individuales
let poolConfig;

if (process.env.DATABASE_URL) {
  // Usar la URL de conexión proporcionada por Render
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Necesario para conexiones SSL en Render
    },
    connectionTimeoutMillis: 120000, // Timeout de conexión: 2 minutos
    idleTimeoutMillis: 60000, // Timeout de inactividad: 1 minuto
    max: 10 // Máximo de conexiones en el pool
  };
  console.log('Usando DATABASE_URL para la conexión a PostgreSQL');
} else {
  // Usar configuración manual con variables individuales
  poolConfig = {
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASSWORD,
    port: parseInt(DB_PORT, 10),
    ssl: {
      rejectUnauthorized: false // Necesario para conexiones SSL en Render
    },
    connectionTimeoutMillis: 120000,
    idleTimeoutMillis: 60000,
    max: 10
  };
  console.log('Usando variables individuales para la conexión a PostgreSQL');
}

console.log('Configuración de conexión a PostgreSQL establecida');

export const pool = new Pool(poolConfig);

// Verificar la conexión a la base de datos
pool.connect()
  .then(client => {
    console.log('✅ Conexión a la base de datos PostgreSQL establecida correctamente');
    client.release();
  })
  .catch(error => {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    console.error('Detalles adicionales del error:', error);
    console.error('Asegúrese de que la cadena de conexión sea correcta y que la base de datos exista.');
  });