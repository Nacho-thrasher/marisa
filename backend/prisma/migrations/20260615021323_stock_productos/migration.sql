-- CreateTable
CREATE TABLE "stock_productos" (
    "id" BIGSERIAL NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "cantidad_stock" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_productos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_productos_producto_id_key" ON "stock_productos"("producto_id");

-- AddForeignKey
ALTER TABLE "stock_productos" ADD CONSTRAINT "stock_productos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
