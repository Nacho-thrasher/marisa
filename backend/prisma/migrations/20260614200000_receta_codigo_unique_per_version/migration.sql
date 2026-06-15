-- DropIndex
DROP INDEX "recetas_codigo_key";

-- CreateIndex
CREATE UNIQUE INDEX "recetas_codigo_version_key" ON "recetas"("codigo", "version");
