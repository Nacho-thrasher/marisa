# Sistema de Gestión de Producción y Nómina

Sistema integral para fábrica de snacks (papas fritas, panificados, maní, etc.):
inventario de insumos, recetas/producción, ventas, nómina argentina (AFIP,
antigüedad, recibos) y auditoría.

## Stack

- **Frontend:** Angular 20 (standalone + signals) + Tailwind CSS v4 → desplegado en **Vercel**
- **Backend:** Node.js + Express + TypeScript + Prisma → desplegado en **Railway**
- **Base de datos:** PostgreSQL (Railway)
- **Auth:** JWT con roles (ADMIN, GERENTE, OPERARIO, RRHH, CONTADOR)

## Estructura

```
.
├── backend/     API REST (Express + Prisma)
├── frontend/    SPA (Angular 20)
└── docs/        Documentación funcional y técnica
```

## Puesta en marcha (desarrollo)

### Backend

```bash
cd backend
cp .env.example .env        # completar DATABASE_URL y JWT_SECRET
npm install
npm run prisma:migrate      # crea las tablas
npm run seed                # carga usuarios, insumos y datos demo
npm run dev                 # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm start                   # http://localhost:4200
```

## Credenciales demo (tras el seed)

| Usuario  | Contraseña   | Rol      |
|----------|--------------|----------|
| admin    | Admin123!    | ADMIN    |
| gerente  | Gerente123!  | GERENTE  |
| operario | Operario123! | OPERARIO |
| rrhh     | Rrhh123!     | RRHH     |
| contador | Contador123! | CONTADOR |

## Gestión de usuarios

El rol **ADMIN** tiene una sección **Usuarios** (menú → Administración) para crear
cuentas con cualquier rol, editar rol/email, activar/desactivar y restablecer
contraseñas. El backend protege estos endpoints con `requireRole('ADMIN')` y evita
que el sistema quede sin ningún administrador activo.

## Puesta en producción (reset a un solo admin)

Para arrancar producción con **un único administrador + el catálogo** (insumos,
productos con listas de precios, recetas, vendedores y configuración de aportes),
sin datos demo (clientes, empleados, ventas, nómina):

```bash
cd backend
# Definí el admin por entorno (en Railway → Variables):
#   ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD
npm run seed:reset -- --force      # ⚠️ BORRA todos los datos
```

El script es **destructivo** y exige `--force` (o `CONFIRM_RESET=YES`) para ejecutarse,
de modo que nunca corre solo en un deploy. Si no se definen las variables, usa
`admin / Admin123!` como fallback (cambiala en el primer ingreso).

## Estado del desarrollo

- [x] Base del monorepo + esquema de BD completo (27 tablas)
- [x] Autenticación JWT + roles + permisos
- [x] Diseño con Tailwind (sidebar, cards, modales y toasts propios)
- [x] Módulo de Inventario (insumos, movimientos, stock, alertas, historial de precios)
- [x] Módulo de Producción (productos, recetas, órdenes, consumo real, merma)
- [x] Módulo de Ventas (remitos, márgenes, anulación)
- [x] Módulo de Nómina (empleados, estructura salarial, liquidación con AFIP y antigüedad, recibos, aportes)
- [x] Módulo de Auditoría (logs trazables por usuario/módulo/acción)
- [x] Listas de precios diferenciadas (Mayorista/Revendedor/Comercio/Público) por producto
- [x] Clientes con zona de venta + Vendedores; venta atribuida a cliente/vendedor
- [x] Reporte mensual de ventas por vendedor y matriz producto×vendedor (planilla "MENSUAL")
- [x] Simulador de costo para productos nuevos; lote + vencimiento en producción
- [x] Dashboard con KPIs por rol, alertas de stock, top vendedores y órdenes recientes
- [x] Carga de pedido diario por vendedor (grilla rápida estilo planilla)
- [x] Exportación a PDF (remito de venta, recibo de sueldo) y Excel (reporte mensual, nómina)

Ver [docs/06_RESUMEN_EJECUTIVO_CRONOGRAMA.md](docs/06_RESUMEN_EJECUTIVO_CRONOGRAMA.md) y [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md).
