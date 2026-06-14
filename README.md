# Sistema de Gestión de Producción y Nómina

Sistema integral para fábrica de snacks (papas fritas, panificados, maní, etc.):
inventario de insumos, recetas/producción, ventas, nómina argentina (AFIP,
antigüedad, recibos) y auditoría.

## Stack

- **Frontend:** Angular 20 + Angular Material → desplegado en **Vercel**
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

## Estado del desarrollo

- [x] Base del monorepo + esquema de BD completo
- [x] Autenticación JWT + roles
- [x] Módulo de Inventario (insumos, movimientos, stock, alertas)
- [ ] Módulo de Producción (recetas, órdenes, consumo)
- [ ] Módulo de Ventas
- [ ] Módulo de Nómina (empleados, estructura salarial, recibos)
- [ ] Módulo de Auditoría y Reportes

Ver [docs/06_RESUMEN_EJECUTIVO_CRONOGRAMA.md](docs/06_RESUMEN_EJECUTIVO_CRONOGRAMA.md).
