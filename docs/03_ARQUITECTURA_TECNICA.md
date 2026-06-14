# Arquitectura Técnica - Sistema de Gestión de Producción y Nómina

## 1. VISIÓN GENERAL DE LA ARQUITECTURA

### 1.1 Diagrama de Capas (Layered Architecture)

```
┌─────────────────────────────────────────┐
│     CAPA DE PRESENTACIÓN (Frontend)     │
│  (Web UI - Angular 20+ + Responsive)    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    CAPA DE API REST (Backend)           │
│   (Node.js + Express o Python/FastAPI)  │
│   - Autenticación JWT                   │
│   - Validación de permisos              │
│   - Manejo de excepciones               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│     CAPA DE LÓGICA DE NEGOCIO           │
│   - Servicios de dominio                │
│   - Cálculos complejos                  │
│   - Validaciones de reglas              │
│   - Orquestación de procesos            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│     CAPA DE ACCESO A DATOS (DAL)        │
│   - Repositorios                        │
│   - ORM (Sequelize, TypeORM, etc.)      │
│   - Queries optimizadas                 │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    CAPA DE PERSISTENCIA                 │
│    (Base de Datos - MySQL/PostgreSQL)   │
│    + Cache (Redis)                      │
└─────────────────────────────────────────┘
```

---

## 2. COMPONENTES PRINCIPALES

### 2.1 Backend

#### Stack Recomendado: Node.js + Express.js
```
Backend/
├── config/              # Configuraciones
│   ├── database.js
│   ├── auth.js
│   └── constants.js
├── controllers/         # Controladores HTTP
│   ├── insumoController.js
│   ├── produccionController.js
│   ├── ventasController.js
│   ├── nominaController.js
│   └── auditController.js
├── services/            # Lógica de negocio
│   ├── insumoService.js
│   ├── produccionService.js
│   ├── calculoNominaService.js
│   ├── reporteService.js
│   └── auditService.js
├── models/              # Modelos/Entidades
│   ├── Insumo.js
│   ├── Producto.js
│   ├── Empleado.js
│   └── ...
├── repositories/        # Acceso a datos
│   ├── insumoRepository.js
│   ├── produccionRepository.js
│   └── ...
├── middleware/          # Middleware Express
│   ├── authMiddleware.js
│   ├── errorHandler.js
│   └── auditMiddleware.js
├── routes/              # Rutas de API
│   ├── insumoRoutes.js
│   ├── produccionRoutes.js
│   ├── ventasRoutes.js
│   ├── nominaRoutes.js
│   └── reporteRoutes.js
├── validators/          # Validación de datos
│   └── schemas.js
├── utils/               # Funciones auxiliares
│   ├── logger.js
│   ├── emailSender.js
│   └── pdfGenerator.js
└── server.js            # Punto de entrada
```

#### Stack Alternativo: Python + FastAPI
```
Backend/
├── config/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── insumos.py
│   │   │   │   ├── produccion.py
│   │   │   │   ├── nomina.py
│   │   │   │   └── ...
│   │   │   └── __init__.py
│   │   └── __init__.py
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Lógica de negocio
│   ├── repositories/    # Acceso a datos
│   ├── core/
│   │   ├── security.py
│   │   └── config.py
│   └── __init__.py
└── main.py              # Punto de entrada
```

### 2.2 Frontend

#### Stack Recomendado: Angular 20+ con TypeScript
```
Frontend/
├── src/
│   ├── app/
│   │   ├── core/                    # Servicios y guards centrales
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── role.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   ├── error.interceptor.ts
│   │   │   │   └── loading.interceptor.ts
│   │   │   └── services/
│   │   │       ├── auth.service.ts
│   │   │       ├── user.service.ts
│   │   │       └── notification.service.ts
│   │   │
│   │   ├── shared/                  # Componentes y pipes compartidos
│   │   │   ├── components/
│   │   │   │   ├── header.component.ts
│   │   │   │   ├── sidebar.component.ts
│   │   │   │   └── layout.component.ts
│   │   │   ├── pipes/
│   │   │   │   ├── currency.pipe.ts
│   │   │   │   └── date.pipe.ts
│   │   │   └── models/
│   │   │       ├── usuario.model.ts
│   │   │       ├── insumo.model.ts
│   │   │       └── produccion.model.ts
│   │   │
│   │   ├── modules/
│   │   │   ├── inventario/
│   │   │   │   ├── components/
│   │   │   │   │   ├── tabla-insumos/
│   │   │   │   │   │   ├── tabla-insumos.component.ts
│   │   │   │   │   │   └── tabla-insumos.component.html
│   │   │   │   │   ├── form-ingreso/
│   │   │   │   │   │   ├── form-ingreso.component.ts
│   │   │   │   │   │   └── form-ingreso.component.html
│   │   │   │   │   ├── form-egreso/
│   │   │   │   │   │   ├── form-egreso.component.ts
│   │   │   │   │   │   └── form-egreso.component.html
│   │   │   │   │   └── stock-alerta/
│   │   │   │   │       ├── stock-alerta.component.ts
│   │   │   │   │       └── stock-alerta.component.html
│   │   │   │   ├── services/
│   │   │   │   │   └── insumo.service.ts
│   │   │   │   ├── inventario-routing.module.ts
│   │   │   │   └── inventario.module.ts
│   │   │   │
│   │   │   ├── produccion/
│   │   │   │   ├── components/
│   │   │   │   │   ├── form-orden/
│   │   │   │   │   ├── lista-ordenes/
│   │   │   │   │   ├── registro-consumo/
│   │   │   │   │   └── resumen-produccion/
│   │   │   │   ├── services/
│   │   │   │   │   ├── produccion.service.ts
│   │   │   │   │   └── receta.service.ts
│   │   │   │   ├── produccion-routing.module.ts
│   │   │   │   └── produccion.module.ts
│   │   │   │
│   │   │   ├── ventas/
│   │   │   │   ├── components/
│   │   │   │   │   ├── form-venta/
│   │   │   │   │   ├── lista-ventas/
│   │   │   │   │   └── resumen-venta/
│   │   │   │   ├── services/
│   │   │   │   │   └── venta.service.ts
│   │   │   │   ├── ventas-routing.module.ts
│   │   │   │   └── ventas.module.ts
│   │   │   │
│   │   │   ├── nomina/
│   │   │   │   ├── components/
│   │   │   │   │   ├── gestion-empleados/
│   │   │   │   │   ├── configuracion-salarial/
│   │   │   │   │   ├── proceso-nomina/
│   │   │   │   │   ├── recibos/
│   │   │   │   │   └── asistente-nomina/
│   │   │   │   ├── services/
│   │   │   │   │   ├── empleado.service.ts
│   │   │   │   │   ├── nomina.service.ts
│   │   │   │   │   └── configuracion-aportes.service.ts
│   │   │   │   ├── nomina-routing.module.ts
│   │   │   │   └── nomina.module.ts
│   │   │   │
│   │   │   ├── auditoria/
│   │   │   │   ├── components/
│   │   │   │   │   ├── logs/
│   │   │   │   │   ├── historial-precios/
│   │   │   │   │   └── auditoria-nomina/
│   │   │   │   ├── services/
│   │   │   │   │   └── auditoria.service.ts
│   │   │   │   ├── auditoria-routing.module.ts
│   │   │   │   └── auditoria.module.ts
│   │   │   │
│   │   │   └── reportes/
│   │   │       ├── components/
│   │   │       │   ├── reporte-produccion/
│   │   │       │   ├── reporte-nomina/
│   │   │       │   ├── reporte-ventas/
│   │   │       │   ├── reporte-auditoria/
│   │   │       │   └── generador-reportes/
│   │   │       ├── services/
│   │   │       │   └── reporte.service.ts
│   │   │       ├── reportes-routing.module.ts
│   │   │       └── reportes.module.ts
│   │   │
│   │   ├── pages/
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   └── dashboard.component.html
│   │   │   ├── login/
│   │   │   │   ├── login.component.ts
│   │   │   │   └── login.component.html
│   │   │   └── not-found/
│   │   │       └── not-found.component.ts
│   │   │
│   │   └── app-routing.module.ts
│   │
│   ├── assets/
│   │   ├── images/
│   │   └── styles/
│   │       ├── global.scss
│   │       ├── variables.scss
│   │       └── mixins.scss
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   │
│   ├── app.component.ts
│   ├── app.component.html
│   ├── app.module.ts
│   └── main.ts
│
├── angular.json
├── tsconfig.json
├── package.json
└── .angular-cli.json
```

**Angular 20+ Features Utilizadas**:
- Standalone components (si aplica)
- Signals para reactividad
- RxJS Observables para manejo de estado
- Guards funcionales para protección de rutas
- Interceptors para manejo de autenticación
- Módulos lazy-loaded por funcionalidad
- FormBuilder y ReactiveFormsModule para formularios
- Material Design (ng-bootstrap o Material Angular)

### 2.3 Base de Datos

- **Motor**: MySQL 8.0+ o PostgreSQL 12+
- **Replicación**: Configurada en producción
- **Backup**: Diario con retención de 30 días
- **Tablespaces**: Separados por módulo si es necesario

---

## 3. PATRONES DE DISEÑO Y ARQUITECTURA

### 3.1 Repository Pattern
Abstrae el acceso a datos, permitiendo cambiar de BD sin afectar la lógica:

```javascript
// Interfaz
class InsumoRepository {
    async obtenerPorId(id) { }
    async obtenerTodos() { }
    async crear(insumo) { }
    async actualizar(id, insumo) { }
    async eliminar(id) { }
}
```

### 3.2 Service Layer Pattern
Encapsula la lógica de negocio:

```javascript
class InsumoService {
    constructor(insumoRepository, movimientoRepository) {
        this.insumoRepository = insumoRepository;
        this.movimientoRepository = movimientoRepository;
    }
    
    async registrarIngreso(insumo, cantidad, lote) {
        // Validaciones
        // Actualizar stock
        // Crear movimiento
        // Auditoria
    }
}
```

### 3.3 Observer Pattern
Para auditoría automática:

```javascript
class AuditObserver {
    actualizar(accion) {
        // Registrar en logs de auditoría
    }
}

class InsumoService {
    attach(observer) {
        this.observers.push(observer);
    }
    
    notificarObservadores(accion) {
        this.observers.forEach(obs => obs.actualizar(accion));
    }
}
```

### 3.4 Factory Pattern
Para crear instancias de servicios:

```javascript
class ServiceFactory {
    static crearServicio(tipo) {
        switch(tipo) {
            case 'insumo':
                return new InsumoService(...);
            case 'nomina':
                return new NominaService(...);
            // ...
        }
    }
}
```

### 3.5 Dependency Injection
Para mejor testabilidad y flexibilidad:

```javascript
// Con contenedor DI (ej: Awilix)
const container = createContainer();
container.register({
    insumoRepository: asClass(InsumoRepository),
    insumoService: asClass(InsumoService),
    insumoController: asClass(InsumoController)
});
```

---

## 4. FLUJOS DE DATOS PRINCIPALES

### 4.1 Flujo: Ingreso de Materia Prima

```
Frontend (FormIngreso)
    ↓ POST /api/insumos/ingreso
Backend Controller
    ↓ Validar datos
Backend Service
    ↓ Crear movimiento
    ├→ Actualizar stock_actual
    ├→ Registrar en movimientos_insumos
    └→ Notificar auditoría
    ↓
Database
    ↓
Response JSON al Frontend
    ↓
Actualizar UI (tabla stock)
```

### 4.2 Flujo: Registro de Producción

```
Frontend (FormProduccion)
    ↓ POST /api/produccion/crear-orden
Backend Controller
    ↓ Validar insumos disponibles
Backend Service (ProduccionService)
    ├→ Validar receta existe
    ├→ Verificar stock insumos
    ├→ Crear orden_produccion
    ├→ RESERVAR insumos (registrar consumo previsto)
    └→ Notificar cambios
    ↓
Database
    ↓ PATCH /api/produccion/{id}/completar
    ↓ Frontend actualiza consumo real
Backend Service
    ├→ Registrar consumo real en consumo_insumos
    ├→ Actualizar movimientos_insumos
    ├→ Calcular merma/diferencias
    ├→ Actualizar stock_actual
    └→ Audit log
```

### 4.3 Flujo: Cálculo de Nómina Mensual

```
Frontend (ProcesoNomina) - click "Generar Nómina"
    ↓ POST /api/nomina/procesar-mes
Backend Controller
    ↓ Obtener empleados activos en el período
Backend Service (NominaService)
    ├→ Para cada empleado:
    │  ├→ Obtener estructura salarial vigente
    │  ├→ Obtener asistencia del mes
    │  ├→ Calcular haberes:
    │  │  ├→ Sueldo base
    │  │  ├→ Antigüedad (años × porcentaje)
    │  │  ├→ Bonos fijos
    │  │  └→ Comisiones si aplica
    │  ├→ Calcular descuentos:
    │  │  ├→ Aportes sindicales
    │  │  └→ Otros descuentos
    │  ├→ Generar recibo_sueldo
    │  └→ Registrar en nomina_mensual
    ├→ Calcular totales
    └→ Generar reportes
    ↓
Database
    ↓
Response JSON (resumen, pendiente pago)
    ↓
Frontend visualiza nómina
```

---

## 5. SEGURIDAD

### 5.1 Autenticación
```
Método: JWT (JSON Web Tokens)

1. Login:
   POST /api/auth/login
   {username, password}
   ↓
   Backend valida credenciales contra tabla usuarios
   ↓
   Genera JWT con claims: {userId, rol, permisos}
   ↓
   Response: {token, refreshToken, expiresIn}

2. Requests posteriores:
   Authorization: Bearer {token}
   ↓
   Middleware verifica y decodifica JWT
   ↓
   Continúa si válido
```

### 5.2 Autorización basada en Roles
```
Roles:
- ADMIN: Acceso total
- GERENTE: Producción, ventas, reportes
- OPERARIO: Solo producción e inventario
- RRHH: Empleados y nómina
- CONTADOR: Reportes financieros y auditoría

Middleware:
@RequireRole(['GERENTE', 'ADMIN'])
async procesarNomina(req, res) {
    // Verificar rol del JWT
    // Si no tiene permiso → 403 Forbidden
}
```

### 5.3 Encriptación y Hashing
```
- Contraseñas: bcrypt con salt mínimo 10
- Datos sensibles en tránsito: HTTPS/TLS 1.2+
- JWT: Firmado con RS256 (clave privada)
- BD: Conexión encriptada
```

### 5.4 Rate Limiting
```
- Login: Máximo 5 intentos cada 15 minutos
- API general: 100 requests/minuto por usuario
- Endpoints sensibles: 10 requests/minuto
```

---

## 6. MANEJO DE ERRORES Y LOGGING

### 6.1 Niveles de Log
```
ERROR   → Errores no capturados, fallos críticos
WARN    → Operaciones anómalas pero recuperables
INFO    → Eventos normales del negocio
DEBUG   → Información de depuración
```

### 6.2 Estructura de Logs
```json
{
  "timestamp": "2024-01-28T10:30:45Z",
  "level": "ERROR",
  "module": "ProduccionService",
  "userId": 5,
  "action": "registrar_produccion",
  "message": "No hay suficiente materia prima",
  "details": {
    "insumo": "Papa",
    "requerido": 100,
    "disponible": 45
  },
  "stackTrace": "..."
}
```

### 6.3 Manejo de Excepciones
```javascript
// Estructura estándar de respuesta de error

{
  "success": false,
  "code": "INSUFFICIENT_STOCK",
  "message": "No hay suficiente materia prima en stock",
  "details": {
    "insumo": "Papa",
    "faltante": 55
  },
  "timestamp": "2024-01-28T10:30:45Z"
}

Códigos HTTP:
- 400: Bad Request (validación)
- 401: Unauthorized (sin autenticación)
- 403: Forbidden (sin permisos)
- 404: Not Found
- 409: Conflict (violación de restricción)
- 500: Internal Server Error
```

---

## 7. PERFORMANCE Y ESCALABILIDAD

### 7.1 Caching
```
Redis para:
- Cache de usuario autenticado (TTL: 30 min)
- Cache de estructura salarial (TTL: 24h)
- Cache de recetas de productos (TTL: 7 días)
- Cache de stock actual (invalidar en cada movimiento)

Estrategia: Cache-Aside
1. Backend intenta leer de Redis
2. Si no existe → Leer de BD
3. Escribir en Redis
4. Retornar al cliente
```

### 7.2 Índices de Base de Datos
Ya incluidos en el esquema (sección anterior)

### 7.3 Paginación
```javascript
// GET /api/insumos?page=1&limit=50&sort=nombre:ASC

Response:
{
  "data": [...],
  "pagination": {
    "current": 1,
    "total": 5,
    "limit": 50,
    "totalRecords": 210
  }
}
```

### 7.4 Búsqueda y Filtrado
```javascript
// GET /api/insumos?search=papa&categoria=papas_fritas&stock_bajo=true

Implementar full-text search en MySQL:
ALTER TABLE insumos ADD FULLTEXT INDEX ft_nombre_categoria (nombre, categoria);
```

---

## 8. DEPLOYMENTS Y INFRAESTRUCTURA

### 8.1 Estructura de Ambientes
```
Desarrollo:
  - BD: localhost o contenedor Docker
  - Backend: localhost:3000
  - Frontend: localhost:3001
  - Logs: consola + archivo local

Staging:
  - BD: Servidor dedicado (replicada)
  - Backend: 1 instancia
  - Frontend: Estático en nginx
  - Monitoreo: New Relic / DataDog

Producción:
  - BD: Cluster Master-Slave con failover
  - Backend: 2-3 instancias con load balancer
  - Frontend: CDN + nginx con caching
  - Monitoreo: New Relic / DataDog
  - Backup: Diario + retención 30 días
  - SSL/TLS: Let's Encrypt renovado automáticamente
```

### 8.2 Docker
```yaml
# docker-compose.yml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: produccion_nomina
  
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - mysql
    environment:
      NODE_ENV: ${ENV}
      DB_HOST: mysql
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  frontend:
    build: ./frontend
    ports:
      - "3001:80"
    depends_on:
      - backend
```

### 8.3 CI/CD
```yaml
# GitHub Actions / GitLab CI
Pipeline:
1. Build → npm/pip install, build
2. Test → Unit tests, integration tests
3. Lint → ESLint, Prettier, SonarQube
4. Security scan → OWASP/Snyk
5. Deploy staging → Si es rama develop
6. Deploy producción → Si es release y aprobado
```

---

## 9. MONITOREO Y ALERTAS

### 9.1 Métricas Clave
```
- Disponibilidad del sistema (SLA 99.5%)
- Tiempo promedio de respuesta de API
- Errores 5xx por minuto
- Uso de CPU/RAM
- Conexiones a BD activas
- Espacio en disco BD
- Tasa de errores en nómina
```

### 9.2 Alertas
```
Crítica (PagerDuty):
- BD caída
- Backend caído
- Error en proceso de nómina

Alta:
- Latencia > 1 segundo
- Uso CPU > 80%
- Espacio disco < 10%

Media:
- Tasa error 4xx > 5%
- Conexiones DB > 80% del máximo
```

---

## 10. DISASTER RECOVERY

### 10.1 Plan de Recuperación
```
Objetivo RTO (Recovery Time Objective): 1 hora
Objetivo RPO (Recovery Point Objective): 1 hora

Procedimiento:
1. Detectar falla (alertas automáticas)
2. Failover BD (automático si está configurado)
3. Reiniciar backend en servidor secundario
4. Validar integridad de datos
5. Reiniciar frontend si es necesario
6. Notificar usuarios
```

### 10.2 Backup y Restauración
```
Frecuencia: Diaria a las 02:00 AM
Retención: 30 días
Almacenamiento: 2 ubicaciones (local + cloud)

Prueba de restauración: Mensual
Procedimiento documentado y probado
```

