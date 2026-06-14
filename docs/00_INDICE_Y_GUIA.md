# Índice de Documentación - Sistema de Gestión de Producción y Nómina

## 📋 Contenido de la Entrega

Esta entrega comprende **6 documentos técnicos completos** que cubren todos los aspectos del sistema requerido. A continuación te explicamos qué contiene cada uno:

---

## 📄 01_REQUISITOS_FUNCIONALES.md

**Propósito**: Define todas las funcionalidades del sistema de forma clara y estructurada.

**Contiene**:

### Módulo de Gestión de Materia Prima e Insumos
- RF-MP-001 a RF-MP-005: Inventario, catálogo, movimientos de stock
- Especificación detallada de qué datos se requieren para cada operación
- Validaciones y reglas de negocio

### Módulo de Gestión de Productos
- RF-PROD-001 a RF-PROD-007: Catálogo de productos, recetas, producción
- Listado de todos los productos (papas 45gr, 90gr, etc.)
- Cálculo automático de costos

### Módulo de Ventas
- RF-VENTA-001 a RF-VENTA-003: Registro de ventas, remitos, reportes
- Trazabilidad de qué se vendió, cuándo, a quién

### Módulo de Gestión de Empleados y Nómina
- RF-EMP-001 a RF-NOM-004: Empleados, salarios, cálculo de nómina
- Estructura salarial, aportes AFIP, descuentos sindicales, antigüedad
- Procesamiento mensual de nómina

### Módulo de Auditoría
- RF-AUDIT-001 a RF-AUDIT-003: Trazabilidad de operaciones
- Quién hizo qué, cuándo, y qué cambió

### Requisitos No Funcionales
- Performance, seguridad, backups, compliance

**Cuándo lo necesitas**:
- Para validar que el sistema haga lo que necesitas
- Como referencia durante el desarrollo
- Para entrenamientos de usuarios

---

## 🗄️ 02_ESQUEMA_BD.md

**Propósito**: Define la estructura exacta de la base de datos. Es el "plano de la casa".

**Contiene**:

### 27 Tablas SQL Completas
Cada tabla tiene:
- Nombre y descripción
- Definición de todas las columnas (tipo, restricciones)
- Relaciones con otras tablas (FOREIGN KEYS)
- Índices para performance
- Ejemplos de datos

**Tablas principales**:
- `insumos`: Materia prima (papas, aceite, sal, etc.)
- `movimientos_insumos`: Historial de entrada/salida
- `productos`: Productos finales (Papas 45gr, Panificado, etc.)
- `recetas`: Fórmulas de producción con insumos
- `ordenes_produccion`: Qué se va a producir
- `consumo_insumos`: Qué se realmente se usó
- `ventas` y `venta_detalles`: Registro de ventas
- `empleados`: Datos de empleados
- `estructura_salarial`: Sueldo básico, aportes, etc.
- `nomina_mensual` y `recibo_sueldo`: Nómina procesada
- `auditoria_logs`: Historial de cambios
- Y más...

### 3 Vistas SQL Útiles
- `vista_stock_actualizado`: Stock actual en tiempo real
- `vista_costo_productos`: Costo completo de cada producto
- `vista_resumen_nomina_mes`: Resumen de nómina por mes

**Cuándo lo necesitas**:
- Para que el desarrollador backend implemente la BD
- Para entender cómo se almacenan los datos
- Para escribir consultas/reportes
- Para auditoría: entiende qué datos se guardan

---

## 🏗️ 03_ARQUITECTURA_TECNICA.md

**Propósito**: Define cómo está organizado el código y la infraestructura.

**Contiene**:

### Arquitectura por Capas
```
Frontend (Angular 20+)
    ↓
API REST (Node.js/Python)
    ↓
Lógica de Negocio (Services)
    ↓
Acceso a Datos (Repositories)
    ↓
Base de Datos (MySQL/PostgreSQL)
```

### Estructura de Carpetas
- Backend: controllers, services, models, repositories, middleware
- Frontend: components, pages, services, hooks, context
- Cómo se organiza el código

### Patrones de Diseño
- Repository Pattern: Acceso a datos
- Service Layer: Lógica de negocio
- Observer Pattern: Auditoría automática
- Factory Pattern: Creación de servicios
- Dependency Injection: Flexibilidad y testing

### Flujos de Datos Principales
- Cómo fluye la información en 3 escenarios clave:
  * Ingreso de materia prima
  * Registro de producción
  * Cálculo de nómina

### Seguridad
- Autenticación con JWT
- Autorización basada en roles (ADMIN, GERENTE, OPERARIO, RRHH)
- Encriptación de contraseñas
- Rate limiting
- HTTPS

### Performance y Escalabilidad
- Caching con Redis
- Índices de BD
- Paginación
- Búsqueda full-text

### Deployments
- Estructura de ambientes (desarrollo, staging, producción)
- Docker para containerización
- CI/CD (GitHub Actions, GitLab CI)
- Monitoreo y alertas

### Disaster Recovery
- RTO (Recovery Time Objective): 1 hora
- RPO (Recovery Point Objective): 1 hora
- Backup y restauración

**Cuándo lo necesitas**:
- Para que el arquitecto/DevOps planee la infraestructura
- Para que desarrolladores entiendan la estructura general
- Para entender cómo se asegura el sistema
- Para planning de escalabilidad futura

---

## 📋 04_CASOS_DE_USO.md

**Propósito**: Define exactamente qué hace cada usuario en cada situación.

**Contiene**:

### Actores Identificados
- Operario de Producción
- Gerente de Producción
- Gerente de Ventas
- Encargado de RRHH
- Administrador del Sistema
- Contador/Auditor

### 14 Casos de Uso Principales

Cada caso de uso tiene:
- **Actor**: Quién lo hace
- **Precondiciones**: Qué debe ser verdad antes
- **Flujo Principal**: Los pasos en orden
- **Flujos Alternativos**: Qué pasa si algo sale mal
- **Validaciones**: Qué se verifica
- **Postcondiciones**: Qué resulta

**Casos de Uso**:
1. UC-INV-001: Registrar ingreso de materia prima
2. UC-INV-002: Registrar egreso de materia prima
3. UC-INV-003: Consultar stock y alertas
4. UC-INV-004: Generar reporte de stock
5. UC-PROD-001: Crear orden de producción
6. UC-PROD-002: Registrar consumo en producción
7. UC-PROD-003: Generar reporte de producción
8. UC-VENTA-001: Registrar venta
9. UC-VENTA-002: Consultar histórico de ventas
10. UC-RRHH-001: Registrar nuevo empleado
11. UC-RRHH-002: Configurar estructura salarial
12. UC-RRHH-003: Configurar aportes globales
13. UC-RRHH-004: Procesar nómina mensual
14. UC-RRHH-005: Generar reporte de nómina
15. UC-AUDIT-001: Consultar logs de auditoría
16. UC-AUDIT-002: Revisar historial de cambios
17. UC-AUDIT-003: Auditar cálculos de nómina

### Diagramas de Flujo
- Flujo completo de producción (desde orden hasta venta)
- Flujo de venta
- Flujo de nómina

### Matriz de Trazabilidad
- Qué requisito funcional se cumple con qué caso de uso

### Estimación de Esfuerzo
- Cuántos días demanda cada caso de uso

**Cuándo lo necesitas**:
- Para entrenamientos de usuarios (ver exactamente qué hacen)
- Para testing (saber qué escenarios probar)
- Para validar que el sistema hace lo esperado
- Durante análisis de requisitos finales

---

## 🔌 05_API_ENDPOINTS.md

**Propósito**: Define exactamente cómo el frontend comunica con el backend.

**Contiene**:

### Estructura General de API
```
BASE URL: /api/v1
Autenticación: JWT Bearer Token
Content-Type: application/json
```

### Respuestas Estándar
- Formato de respuesta exitosa
- Formato de respuesta con error
- Paginación estándar

### 50+ Endpoints Completos

**Autenticación**:
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh

**Inventario**:
- GET /insumos (listar con filtros)
- GET /insumos/{id} (detalle)
- POST /insumos (crear)
- PATCH /insumos/{id} (actualizar)
- POST /insumos/{id}/ingreso (registrar entrada)
- POST /insumos/{id}/egreso (registrar salida)
- GET /insumos/{id}/movimientos (historial)
- GET /insumos/stock/resumen (estado actual)

**Producción**:
- GET /productos (listar)
- GET /productos/{id}/receta (obtener fórmula)
- POST /produccion/ordenes (crear orden)
- GET /produccion/ordenes/{id} (detalle)
- PATCH /produccion/ordenes/{id}/iniciar (comenzar producción)
- PATCH /produccion/ordenes/{id}/completar (terminar y registrar consumo)
- GET /produccion/ordenes (listar)
- GET /produccion/reportes (generar reporte)

**Ventas**:
- POST /ventas (crear venta)
- GET /ventas/{id} (detalle)
- GET /ventas (listar)
- GET /ventas/{id}/descargar-remito (PDF)
- DELETE /ventas/{id} (anular)

**Nómina y Empleados**:
- GET /empleados (listar)
- GET /empleados/{id} (detalle)
- POST /empleados (crear)
- PATCH /empleados/{id} (actualizar)
- POST /empleados/{id}/estructura-salarial (configurar sueldo)
- GET /aportes-configuracion (listar AFIP, descuentos, etc.)
- PATCH /aportes-configuracion/{id} (actualizar aportes)
- POST /nomina/procesar (generar nómina mensual)
- GET /nomina/{id}/recibos (obtener recibos)
- GET /nomina/recibos/{id}/descargar (PDF)
- GET /nomina/{id}/reporte (reporte en Excel/PDF)

**Auditoría**:
- GET /auditoria/logs (ver todos los cambios)
- GET /auditoria/logs/{id} (detalle de cambio)
- GET /auditoria/precios-insumo/{id} (historial de precios)
- GET /auditoria/reporte (reporte de auditoría)

### Formato de Cada Endpoint

Para cada endpoint se especifica:
- Método HTTP (GET, POST, PATCH, DELETE)
- URL exacta
- Headers necesarios (Authorization, etc.)
- Parámetros de query (page, limit, filtros)
- Body de request (datos a enviar)
- Response exitosa (código 200/201, estructura JSON)
- Response con error (código 400/401/403/404/409, estructura JSON)

**Ejemplo**:
```
POST /api/v1/insumos/{id}/ingreso
Headers: Authorization: Bearer {token}
Request: { cantidad: 100, proveedor: "García SRL" }
Response 201: { movimiento_id: 1245, stock_nuevo: 300 }
Response 400: { errors: [{ field: "cantidad", message: "..." }] }
```

### Códigos de Error Estándar
- 200 Success
- 201 Created
- 400 Validation Error
- 401 Unauthorized (sin token)
- 403 Forbidden (sin permisos)
- 404 Not Found
- 409 Conflict (stock insuficiente)
- 500 Internal Error

### Límites y Paginación
- Máximo de registros por página
- Rate limiting (100 requests/minuto)

**Cuándo lo necesitas**:
- El desarrollador backend lo usa para implementar la API
- El desarrollador frontend lo usa para saber cómo llamar al backend
- Testing: saber qué endpoints probar
- Documentación técnica oficial (Swagger/OpenAPI)

---

## 📊 06_RESUMEN_EJECUTIVO_CRONOGRAMA.md

**Propósito**: Plan ejecutivo del proyecto con timeline y estrategia.

**Contiene**:

### Resumen Ejecutivo
- Descripción del sistema en 1-2 páginas
- Beneficios esperados (operacionales, financieros, regulatorios)
- Alcance (qué incluye, qué no)
- Equipo recomendado

### Cronograma Detallado

**Fases del Proyecto** (13 semanas = ~3 meses):
1. Semanas 1-2: Definición y Diseño
2. Semanas 3-8: Desarrollo Core (6 sprints)
3. Semanas 9-10: Auditoría y Reportes
4. Semanas 11-12: Testing y Refinamiento
5. Semana 13: Capacitación e Implementación

**Cada semana especifica**:
- Qué funcionalidades se desarrollan
- Tareas backend, frontend, testing
- Deliverables
- Testing a ejecutar

**Ejemplo Semana 3**:
- Sprint 1: Autenticación e Inventario
- Backend: CRUD insumos, ingreso/egreso
- Frontend: Login, formularios
- Deliverable: Sistema de ingreso/egreso funcional

### Hitos Principales
- MVP Inventario + Auth (Semana 3)
- MVP Producción (Semana 5)
- MVP Ventas (Semana 6)
- MVP Nómina (Semana 8)
- Sistema Completo (Semana 10)
- Go-Live (Semana 13)

### Identificación de Riesgos y Mitigación
- Riesgos identificados (cambios, performance, rotación)
- Probabilidad e impacto
- Plan de mitigación

### Criterios de Aceptación
- Qué debe cumplir el sistema para considerarse listo
- Por módulo (inventario, producción, nómina, etc.)
- Performance requerido

### Presupuesto Estimado
- Recursos humanos (Backend, Frontend, DevOps, QA, PM)
- Infraestructura (hosting, SSL, Email, CDN)
- Total: ~$622,000 USD (contratación externa)

### Dependencias y Precondiciones
- Qué el cliente debe proporcionar
- Qué debe estar en el servidor
- Acceso y datos necesarios

### Fases Futuras (Post Go-Live)
- Fase 2: Dashboard y gráficos
- Fase 3: Integraciones
- Fase 4: Analytics y BI

### Documentación a Entregar
- Especificación técnica
- Manual de usuario
- Documentación de API
- Guías de operación

**Cuándo lo necesitas**:
- Para presentar al cliente/junta directiva
- Para planning del proyecto
- Para establecer expectativas de timeline
- Para identificación de riesgos
- Para presupuesto

---

## 🎯 Cómo Usar Esta Documentación

### Para el Desarrollo
1. **Arquitecto/Gerente de Proyecto**: Lee 06 (cronograma) + 03 (arquitectura)
2. **Backend Developer**: Usa 01 (requisitos) + 02 (BD) + 05 (API) + 03 (arquitectura)
3. **Frontend Developer**: Usa 01 (requisitos) + 04 (casos de uso) + 05 (API) + 03 (arquitectura)
4. **QA/Tester**: Usa 04 (casos de uso) + 05 (API) + 06 (criterios)
5. **DevOps**: Usa 03 (arquitectura) + 06 (infraestructura)

### Para el Cliente
1. **Gerente/Dueño**: Lee 06 (resumen ejecutivo y cronograma)
2. **Gerente de Producción**: Lee 01 (módulo producción) + 04 (casos de uso producción)
3. **Encargado de RRHH**: Lee 01 (módulo nómina) + 04 (casos de uso nómina)
4. **Contador**: Lee 01 (auditoría) + 04 (auditoría)

### Para Capacitación de Usuarios (Después de Go-Live)
- Usar 04 (casos de uso) para entrenar cada rol
- Paso a paso de qué hace cada usuario

### Para Auditoría/Compliance
- 01 (requisitos auditoria)
- 02 (qué se registra)
- 04 (casos de uso auditoria)

---

## 📞 Próximos Pasos Recomendados

1. **Validación Final (1-2 días)**
   - Revisar esta documentación con tu equipo
   - Resolver dudas o aclaraciones
   - Confirmar que todo está de acuerdo

2. **Refinamiento de Detalles (3-5 días)**
   - Completar datos específicos (estructura salarial actual, aportes exactos, etc.)
   - Crear mockups de interfaz si no existen
   - Establecer orden de prioridades

3. **Inicio del Desarrollo**
   - Asignar equipo
   - Setup de infraestructura
   - Comenzar con Sprint 1 (Autenticación + Inventario)

---

## 📝 Preguntas Comunes

**¿Por qué 13 semanas?**
- 2 semanas de análisis/diseño
- 6 semanas de desarrollo core
- 2 semanas de funcionalidades complementarias
- 2 semanas de testing
- 1 semana de capacitación e implementación

**¿Puedo hacer más rápido?**
- Con más desarrolladores, posiblemente.
- Pero reduce calidad/testing.
- Recomendamos mantener timeline para garantizar calidad.

**¿Y si necesito menos funcionalidades?**
- MVP (Fase 1): Solo Inventario + Producción + Nómina básica = 6-8 semanas
- Agrega Ventas, Auditoría, Reportes después

**¿Cuál es la prioridad de módulos?**
1. Nómina (crítico para pagar empleados)
2. Inventario (crítico para operaciones)
3. Producción (cálculo de costos)
4. Ventas (ingresos)
5. Auditoría/Reportes (compliance)

---

## ✅ Checklist de Revisión

- [ ] Leíste 06 (cronograma general)
- [ ] Leíste 01 (requisitos de tu área)
- [ ] Leíste 04 (casos de uso de tu área)
- [ ] Aclaraste dudas con el equipo
- [ ] Confirmaste que la documentación es correcta
- [ ] Identificaste cambios necesarios
- [ ] Estás listo para comenzar desarrollo

---

**Última actualización**: Enero 28, 2024  
**Versión**: 1.0  
**Estado**: Listo para Implementación
