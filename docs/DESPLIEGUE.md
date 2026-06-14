# Guía de Despliegue (Railway + Vercel)

## 1. Base de datos + Backend en Railway

1. Crear un proyecto en [Railway](https://railway.app) y agregar un servicio **PostgreSQL**.
   Railway expone automáticamente la variable `DATABASE_URL`.
2. Agregar un servicio desde el repositorio, con **Root Directory = `backend`**.
   Railway detecta el `railway.json` y usa Nixpacks.
3. Configurar las variables de entorno del servicio backend:

   | Variable | Valor |
   |----------|-------|
   | `DATABASE_URL` | (referenciar la del servicio Postgres: `${{Postgres.DATABASE_URL}}`) |
   | `JWT_SECRET` | un secreto largo y aleatorio |
   | `JWT_REFRESH_SECRET` | otro secreto distinto |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | la URL pública del frontend en Vercel |

4. El `startCommand` (`prisma migrate deploy && node dist/server.js`) corre las
   migraciones automáticamente en cada deploy.
5. Para cargar datos demo una vez: `railway run npm run seed` (o desde la consola del servicio).
6. Healthcheck: `GET /api/v1/health`.

## 2. Frontend en Vercel

1. Importar el repositorio en [Vercel](https://vercel.com) con **Root Directory = `frontend`**.
   Detecta `vercel.json` (build `npm run build`, output `dist/frontend/browser`, SPA rewrites).
2. Antes de desplegar, editar `frontend/src/environments/environment.prod.ts`
   y reemplazar `apiUrl` por la URL pública del backend en Railway:

   ```ts
   apiUrl: 'https://<tu-backend>.up.railway.app/api/v1'
   ```

3. Tras el primer deploy del frontend, copiar su URL y ponerla en `CORS_ORIGIN`
   del backend en Railway (paso 1.3), y redeployar el backend.

## 3. Desarrollo local

```bash
# Postgres local
docker compose up -d

# Backend
cd backend
cp .env.example .env   # completar secretos
npm install
npm run prisma:migrate
npm run seed
npm run dev            # http://localhost:3000

# Frontend
cd frontend
npm install
npm start              # http://localhost:4200
```
