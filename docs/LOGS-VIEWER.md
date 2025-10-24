# 📋 Vista de Logs en Panel de Administración

## Descripción General

Se ha añadido una nueva pestaña "📋 Logs" en el Panel de Administración que permite a los administradores visualizar, filtrar y gestionar los logs del sistema de manera completa.

## 🎯 Características Principales

### 1. **Visualización de Logs Ordenados por Usuario**
- **Vista tabular completa** con información detallada de cada log
- **Ordenación por fecha** (más recientes primero)
- **Información del usuario** que realizó la acción:
  - Nombre del usuario
  - Código PIN del usuario
  - Rol del usuario (admin/user)
  - Identificación visual para usuarios anónimos

### 2. **Filtros Avanzados**
- **Método HTTP**: GET, POST, PUT, DELETE, PATCH
- **Endpoint**: Búsqueda parcial por ruta de API
- **Usuario ID**: Filtrar por ID específico de usuario
- **Código de Estado**: 200, 201, 400, 401, 403, 404, 500, etc.
- **Rango de Fechas**: Fecha inicio y fecha fin
- **Limpieza de filtros**: Botón para resetear todos los filtros

### 3. **Información Mostrada por Log**
- **📅 Fecha y Hora**: Timestamp exacto de la petición
- **👤 Usuario**: Nombre, código y rol del usuario
- **🔧 Método HTTP**: Con código de colores para fácil identificación
- **🌐 Endpoint**: Ruta de la API llamada
- **📊 Código de Estado**: Con colores según tipo (éxito, error, etc.)
- **⏱️ Tiempo de Respuesta**: En milisegundos o segundos
- **🌍 Dirección IP**: IP del cliente que realizó la petición
- **❌ Mensajes de Error**: Si la petición falló

### 4. **Estadísticas Resumidas**
- **Total de Requests**: Número total de peticiones
- **Errores**: Número de peticiones con error
- **Tasa de Éxito**: Porcentaje de peticiones exitosas
- **Métodos**: Número de tipos de métodos HTTP utilizados

### 5. **Paginación y Configuración**
- **Elementos por página**: 10, 25, 50, 100
- **Navegación**: Botones Anterior/Siguiente
- **Indicador**: Página actual y total de páginas

### 6. **Gestión de Logs**
- **Limpieza de logs antiguos**: Modal para eliminar logs por antigüedad
- **Configuración de días**: Especificar cuántos días de antigüedad
- **Vista previa**: Muestra fecha límite antes de eliminar

## 🎨 Códigos de Color

### **Métodos HTTP:**
- 🔵 **GET** - Azul
- 🟢 **POST** - Verde
- 🟡 **PUT** - Amarillo
- 🔴 **DELETE** - Rojo
- 🟣 **PATCH** - Púrpura

### **Códigos de Estado:**
- 🟢 **2xx** (200-299) - Verde (Éxito)
- 🔵 **3xx** (300-399) - Azul (Redirección)
- 🟡 **4xx** (400-499) - Amarillo (Error del cliente)
- 🔴 **5xx** (500-599) - Rojo (Error del servidor)

### **Roles de Usuario:**
- 🟣 **Admin** - Púrpura
- 🔵 **User** - Azul

## 🚀 Cómo Acceder

1. **Iniciar sesión** como administrador
2. **Ir al Dashboard** principal
3. **Hacer clic** en "⚙️ Administración"
4. **Seleccionar** la pestaña "📋 Logs"

## 📊 Casos de Uso

### **1. Auditoría de Seguridad**
```
Filtros útiles:
- Método: POST (para ver intentos de modificación)
- Código: 401, 403 (accesos no autorizados)
- Usuario: Sin especificar (ver intentos anónimos)
```

### **2. Análisis de Performance**
```
Filtros útiles:
- Ordenar por tiempo de respuesta
- Ver endpoints más lentos
- Identificar cuellos de botella
```

### **3. Debugging de Errores**
```
Filtros útiles:
- Código: 500 (errores del servidor)
- Código: 400 (errores de validación)
- Revisar mensajes de error específicos
```

### **4. Monitoreo de Actividad por Usuario**
```
Filtros útiles:
- Usuario ID: Específico
- Rango de fechas: Última semana/mes
- Ver patrones de uso
```

### **5. Análisis de Endpoints**
```
Filtros útiles:
- Endpoint: /api/inventory (actividad de inventario)
- Endpoint: /api/auth (intentos de autenticación)
- Endpoint: /api/orders (gestión de pedidos)
```

## ⚡ Funcionalidades de Gestión

### **Limpieza de Logs Antiguos**
- **Acceso**: Botón "🗑️ Limpiar Logs Antiguos"
- **Configuración**: Especificar días de antigüedad (1-365)
- **Vista previa**: Muestra fecha límite antes de eliminar
- **Confirmación**: Requiere confirmación antes de eliminar
- **Resultado**: Muestra número de logs eliminados

### **Exportación de Datos**
Los logs se pueden filtrar y la información mostrada incluye todos los datos necesarios para:
- Reportes de auditoría
- Análisis de performance
- Investigación de incidentes
- Monitoreo de compliance

## 🔐 Seguridad y Privacidad

### **Datos Sanitizados**
- **Códigos PIN**: No se muestran en request body
- **Contraseñas**: Eliminadas automáticamente
- **Tokens**: No se almacenan en logs

### **Control de Acceso**
- **Solo administradores** pueden acceder a la vista de logs
- **Autenticación requerida** para todas las operaciones
- **Limpieza de logs** restringida a administradores

### **Preservación Histórica**
- **Sin relaciones FK**: Los logs persisten aunque se elimine el usuario
- **Datos completos**: Nombre, código y rol guardados en cada log
- **Historial inmutable**: Los logs no se pueden editar

## 📈 Métricas y Estadísticas

La vista de logs proporciona métricas en tiempo real:

- **Actividad general**: Total de requests y errores
- **Rendimiento**: Tasa de éxito del sistema
- **Distribución**: Tipos de métodos HTTP utilizados
- **Usuarios activos**: Top usuarios más activos
- **Endpoints populares**: Rutas más utilizadas

## 🔧 Configuración Técnica

### **Paginación**
- **Elementos por página**: Configurable (10, 25, 50, 100)
- **Navegación**: Botones de página anterior/siguiente
- **Performance**: Solo carga logs de la página actual

### **Filtros en Tiempo Real**
- **Aplicación automática**: Los filtros se aplican al cambiar
- **Reset de página**: Vuelve a página 1 al filtrar
- **Persistencia**: Los filtros se mantienen entre páginas

### **Actualización de Datos**
- **Carga inicial**: Al acceder a la pestaña
- **Recarga automática**: Después de limpiar logs
- **Estadísticas**: Se actualizan con cada filtro

La vista de logs proporciona una herramienta completa y profesional para la gestión y monitoreo del sistema de inventario Koloa.