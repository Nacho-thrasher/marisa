-- CreateEnum
CREATE TYPE "TipoLista" AS ENUM ('MAYORISTA', 'REVENDEDOR', 'COMERCIO', 'PUBLICO');

-- AlterTable
ALTER TABLE "ordenes_produccion" ADD COLUMN     "fecha_vencimiento" DATE,
ADD COLUMN     "numero_lote" VARCHAR(100);

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "precio_comercio" DECIMAL(10,2),
ADD COLUMN     "precio_mayorista" DECIMAL(10,2),
ADD COLUMN     "precio_publico" DECIMAL(10,2),
ADD COLUMN     "precio_revendedor" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "ventas" ADD COLUMN     "cliente_id" BIGINT,
ADD COLUMN     "lista_precio" "TipoLista",
ADD COLUMN     "vendedor_id" BIGINT;

-- CreateTable
CREATE TABLE "vendedores" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "zona" VARCHAR(100),
    "telefono" VARCHAR(50),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "tipo_lista" "TipoLista" NOT NULL DEFAULT 'REVENDEDOR',
    "zona" VARCHAR(100),
    "direccion" TEXT,
    "localidad" VARCHAR(100),
    "telefono" VARCHAR(50),
    "cuit" VARCHAR(20),
    "vendedor_id" BIGINT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendedores_activo_idx" ON "vendedores"("activo");

-- CreateIndex
CREATE INDEX "clientes_zona_idx" ON "clientes"("zona");

-- CreateIndex
CREATE INDEX "clientes_tipo_lista_idx" ON "clientes"("tipo_lista");

-- CreateIndex
CREATE INDEX "clientes_activo_idx" ON "clientes"("activo");

-- CreateIndex
CREATE INDEX "ventas_vendedor_id_idx" ON "ventas"("vendedor_id");

-- CreateIndex
CREATE INDEX "ventas_cliente_id_idx" ON "ventas"("cliente_id");

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_vendedor_id_fkey" FOREIGN KEY ("vendedor_id") REFERENCES "vendedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_vendedor_id_fkey" FOREIGN KEY ("vendedor_id") REFERENCES "vendedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
