# 📋 Sistema de Logging de API

## Descripción General

El sistema de logging de API registra automáticamente todas las llamadas realizadas a los endpoints del backend, proporcionando una auditoría completa de las acciones realizadas en el sistema.

## 🏗️ Arquitectura

### 1. Modelo de Base de Datos (`ApiLog`)

```prisma
model ApiLog {
  id          Int      @id @default(autoincrement())
  userId      Int?     // ID del usuario que realizó la acción (histórico)
  userName    String?  // Nombre del usuario (guardado para histórico)
  userCode    String?  // Código del usuario (guardado para histórico)
  userRole    String?  // Rol del usuario en el momento de la acción
  method      String   // GET, POST, PUT, DELETE
  endpoint    String   // Ruta de la API
  statusCode  Int      // Código de respuesta HTTP
  ipAddress   String?  // IP del cliente
  userAgent   String?  // Información del navegador
  requestBody String?  // Cuerpo de la petición (sanitizado)
  responseTime Int     // Tiempo de respuesta en ms
  errorMessage String? // Mensaje de error si falló
  timestamp   DateTime @default(now())
  
  // Sin relaciones - datos históricos independientes
}
```

**⚠️ Importante:** La tabla no tiene relaciones foreign key con la tabla User para preservar el histórico completo aunque se eliminen usuarios.

### 2. Middleware de Logging (`apiLogger.js`)

El middleware se ejecuta automáticamente en todas las rutas `/api/*` y registra:

- **Información de la petición**: método HTTP, endpoint, IP, User-Agent
- **Usuario**: ID, nombre, código y rol del usuario autenticado (guardado históricamente)
- **Cuerpo de la petición**: sanitizado (sin códigos PIN, contraseñas, tokens)
- **Respuesta**: código de estado, tiempo de respuesta, mensajes de error
- **Timestamp**: fecha y hora exacta de la petición

**🏛️ Preservación Histórica:** Los datos del usuario se guardan directamente en la tabla de logs, permitiendo mantener el historial completo aunque el usuario sea eliminado del sistema.

## 🚫 Rutas Excluidas

Para evitar spam en los logs, las siguientes rutas están excluidas por defecto:

### Rutas Completamente Excluidas (con startsWith):
- `/api/inventory` - Listado de inventario (solo GET, modificaciones sí se registran)
- `/api/auth/verify` - Verificación de tokens
- `/api/health` - Health checks
- `/api/ping` - Ping endpoints
- `/api/logs` - **Todas las rutas de logs** (incluyendo `/api/logs/stats`, `/api/logs/cleanup`, etc.)

**Nota:** El sistema ahora usa `startsWith()` para la comparación, por lo que `/api/logs` excluye automáticamente todas las sub-rutas como `/api/logs/stats` y `/api/logs/cleanup`.

### Métodos Específicos Excluidos:
- `/api/inventory` - Solo GET (POST, PUT, DELETE sí se registran)
- `/api/orders` - Solo GET (modificaciones sí se registran)

## 🔧 Configuración

### Agregar Rutas Excluidas

```javascript
import { addExcludedRoute } from './middlewares/apiLogger.js';

// Agregar nueva ruta excluida
addExcludedRoute('/api/status');
```

### Ver Rutas Excluidas

```javascript
import { getExcludedRoutes } from './middlewares/apiLogger.js';

const excludedRoutes = getExcludedRoutes();
console.log(excludedRoutes);
```

## 📊 Endpoints de Consulta

### GET `/api/logs`
Obtiene logs con paginación y filtros.

**Parámetros de consulta:**
- `page` - Página (default: 1)
- `limit` - Elementos por página (default: 50)
- `method` - Filtrar por método HTTP
- `endpoint` - Filtrar por endpoint (búsqueda parcial)
- `userName` - Filtrar por nombre de usuario (búsqueda parcial)
- `statusCode` - Filtrar por código de estado
- `startDate` - Fecha inicio (ISO string)
- `endDate` - Fecha fin (ISO string)

**Ejemplo:**
```
GET /api/logs?page=1&limit=25&method=POST&statusCode=200&userName=admin
```

### GET `/api/logs/stats`
Obtiene estadísticas resumidas de los logs.

**Respuesta incluye:**
- Total de peticiones
- Peticiones con error
- Tasa de éxito
- Distribución por método HTTP
- Top 10 endpoints más utilizados
- Top 10 usuarios más activos

### DELETE `/api/logs/cleanup`
Limpia logs antiguos (solo administradores).

**Body:**
```json
{
  "daysOld": 30
}
```

## 🛡️ Seguridad

### Datos Sanitizados
El middleware automáticamente elimina información sensible del `requestBody`:
- `code` - Códigos PIN
- `password` - Contraseñas
- `token` - Tokens de autenticación

### Control de Acceso
- Los endpoints de logs requieren autenticación
- La limpieza de logs requiere rol de administrador
- Los datos del usuario se incluyen solo si está autenticado

## 🧹 Mantenimiento

### Limpieza Automática
Se recomienda implementar una tarea programada para limpiar logs antiguos:

```javascript
import { cleanOldLogs } from './middlewares/apiLogger.js';

// Limpiar logs de más de 90 días
const deletedCount = await cleanOldLogs(90);
console.log(`Se eliminaron ${deletedCount} logs antiguos`);
```

### Monitoreo de Performance
El sistema registra el tiempo de respuesta de cada petición, útil para:
- Identificar endpoints lentos
- Detectar problemas de performance
- Optimizar consultas de base de datos

## 📈 Casos de Uso

### 1. Auditoría de Seguridad
- Detectar intentos de acceso no autorizados
- Rastrear cambios críticos en el inventario
- Monitorear patrones de uso sospechosos

### 2. Análisis de Performance
- Identificar endpoints más utilizados
- Detectar problemas de rendimiento
- Optimizar recursos del servidor

### 3. Debug y Troubleshooting
- Rastrear errores específicos
- Analizar secuencias de acciones problemáticas
- Verificar el correcto funcionamiento de funcionalidades

### 4. Reportes de Actividad
- Generar reportes de uso por usuario
- Analizar patrones de actividad
- Crear métricas de adopción de funcionalidades

## ⚡ Performance

### Consideraciones de Rendimiento
- El logging es **asíncrono** y no bloquea las peticiones
- Los logs se escriben después de enviar la respuesta al cliente
- En caso de error en el logging, la aplicación continúa normalmente
- Se recomienda limpiar logs periódicamente para mantener performance

### Índices Recomendados
Para mejorar la performance de consultas, se pueden agregar índices:

```sql
-- Índice para consultas por usuario
CREATE INDEX idx_apilog_userid ON ApiLog(userId);

-- Índice para consultas por fecha
CREATE INDEX idx_apilog_timestamp ON ApiLog(timestamp);

-- Índice para consultas por endpoint
CREATE INDEX idx_apilog_endpoint ON ApiLog(endpoint);

-- Índice compuesto para consultas filtradas
CREATE INDEX idx_apilog_user_date ON ApiLog(userId, timestamp);
```

## 🔄 Integración

El sistema está completamente integrado en la aplicación:

1. **Automático**: Se ejecuta en todas las rutas `/api/*`
2. **Transparente**: No requiere modificaciones en controladores existentes
3. **Configurable**: Fácil agregar/quitar rutas excluidas
4. **Escalable**: Diseñado para manejar alto volumen de peticiones
