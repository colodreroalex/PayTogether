# Gastos Grupales

Aplicación web para gestionar gastos compartidos entre grupos de personas. Permite crear grupos, agregar gastos, dividir cuentas y calcular balances automáticamente.

## Características

- ✅ Gestión de grupos y usuarios
- ✅ Registro de gastos con categorías
- ✅ División automática de gastos
- ✅ Cálculo de balances y deudas
- ✅ Estadísticas y gráficos
- ✅ Interfaz responsive con modo oscuro
- ✅ Base de datos PostgreSQL
- ✅ API REST completa

## Tecnologías

### Frontend
- React 18
- Tailwind CSS
- Chart.js
- Date-fns

### Backend
- Node.js
- Express.js
- PostgreSQL
- CORS

## Instalación

### Prerrequisitos
- Node.js (versión 16 o superior)
- PostgreSQL (local o remoto)
- npm o yarn

### Configuración

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd GastosGrupales
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto con:

```env
# Configuración de la base de datos
DB_HOST=tu_host_postgresql
DB_PORT=5432
DB_NAME=tu_base_de_datos
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña

# O usar URL completa (recomendado para Render/Heroku)
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/base_de_datos

# Configuración JWT
JWT_SECRET=tu_clave_secreta_jwt

# Puerto del servidor
PORT=3001

# Entorno
NODE_ENV=development
```

4. **Inicializar la base de datos**
```bash
npm run init-db
```

Este comando creará todas las tablas necesarias e insertará las categorías por defecto.

## Uso

### Desarrollo

Para ejecutar en modo desarrollo (servidor y cliente simultáneamente):

```bash
npm run dev
```

Esto iniciará:
- Servidor API en `http://localhost:3001`
- Cliente React en `http://localhost:3000`

### Producción

Para ejecutar en modo producción:

```bash
# Construir la aplicación
npm run build

# Iniciar el servidor
npm start
```

La aplicación estará disponible en `http://localhost:3001`

### Scripts disponibles

- `npm start` - Inicia el servidor en modo producción
- `npm run dev` - Inicia servidor y cliente en modo desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run server` - Solo inicia el servidor API
- `npm run client` - Solo inicia el cliente React
- `npm run init-db` - Inicializa la base de datos
- `npm run setup` - Instala dependencias e inicializa la base de datos

## Estructura del proyecto

```
GastosGrupales/
├── public/                 # Archivos estáticos de React
├── src/
│   ├── components/         # Componentes React
│   ├── context/           # Context API (AppContext)
│   ├── services/          # Servicios API
│   ├── App.js             # Componente principal
│   └── index.js           # Punto de entrada React
├── config.js              # Configuración del servidor
├── db.js                  # Configuración de PostgreSQL
├── server.js              # Servidor Express
├── schema.sql             # Esquema de base de datos
├── init-db.js             # Script de inicialización
├── package.json           # Dependencias y scripts
└── README.md              # Este archivo
```

## API Endpoints

### Health Check
- `GET /api/health` - Verificar estado del servidor y base de datos

### Usuarios
- `GET /api/users` - Obtener todos los usuarios
- `POST /api/users` - Crear nuevo usuario

### Categorías
- `GET /api/categories` - Obtener todas las categorías

### Grupos
- `GET /api/groups` - Obtener todos los grupos
- `POST /api/groups` - Crear nuevo grupo

### Gastos
- `GET /api/groups/:groupId/expenses` - Obtener gastos de un grupo
- `POST /api/expenses` - Crear nuevo gasto
- `PUT /api/expenses/:expenseId` - Actualizar gasto
- `DELETE /api/expenses/:expenseId` - Eliminar gasto

## Despliegue

### Render

1. Conecta tu repositorio a Render
2. Configura las variables de entorno en el dashboard
3. Usa estos comandos de construcción:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

### Heroku

1. Instala Heroku CLI
2. Crea una nueva aplicación:
```bash
heroku create tu-app-name
```

3. Agrega PostgreSQL:
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

4. Configura variables de entorno:
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=tu_clave_secreta
```

5. Despliega:
```bash
git push heroku main
```

6. Inicializa la base de datos:
```bash
heroku run npm run init-db
```

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Soporte

Si encuentras algún problema o tienes preguntas, por favor abre un issue en el repositorio.