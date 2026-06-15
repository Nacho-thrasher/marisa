# Manual de Uso — Sistema de Gestión Marisa

Sistema web para gestionar la fábrica: inventario de insumos, productos con
receta, producción, ventas con listas de precios, pedido diario, clientes,
vendedores, nómina, reportes y auditoría.

> **Resumen en una línea:** cada persona entra con su usuario, ve solo lo que
> le corresponde según su rol, y el sistema va calculando solo el stock, los
> costos y los reportes a medida que se usa.

---

## 1. Cómo entrar

1. Abrí la dirección del sistema en el navegador (Chrome, Edge o similar) —
   funciona también desde el celular.
2. Ingresá **usuario** y **contraseña**.
3. El menú de la izquierda muestra **solo los módulos de tu rol**. Si en el
   celular no se ve el menú, tocá el ícono ☰ arriba a la izquierda.

Para salir: ícono de **logout** abajo del menú (o arriba a la derecha en el
celular).

---

## 2. Usuarios y accesos

### 2.1 Roles

| Rol | Para quién | Qué ve |
|-----|-----------|--------|
| **ADMIN** | Administrador del sistema | Todo, incluida la gestión de usuarios |
| **GERENTE** | Dueño / gerencia | Inventario, productos, producción, ventas, pedido diario, clientes, vendedores, reportes |
| **OPERARIO** | Planta / depósito | Inventario y producción |
| **RRHH** | Recursos Humanos | Empleados y liquidación de sueldos |
| **CONTADOR** | Contador / asesor | Reportes y auditoría (solo lectura) |

### 2.2 Crear usuarios

El administrador entra a **Usuarios** (menú → Administración) y crea una
cuenta para cada persona, con el rol que le corresponde. Cada persona debería
tener **su propio usuario**: así queda registrado quién hizo cada cambio
(módulo **Auditoría**).

---

## 3. Qué puede hacer cada rol

| Módulo | ADMIN | GERENTE | OPERARIO | RRHH | CONTADOR |
|--------|:-----:|:-------:|:--------:|:----:|:--------:|
| Dashboard | ✔ | ✔ | ✔ | ✔ | ✔ |
| Inventario | ✔ | ✔ | ✔ | | |
| Producción | ✔ | ✔ | ✔ | | |
| Productos | ✔ | ✔ | | | |
| Pedido diario | ✔ | ✔ | ✔ | | |
| Ventas | ✔ | ✔ | | | |
| Clientes | ✔ | ✔ | | | |
| Vendedores | ✔ | ✔ | | | |
| Reporte mensual | ✔ | ✔ | | | ✔ |
| Reporte diario | ✔ | ✔ | | | ✔ |
| Nómina | ✔ | | | ✔ | |
| Auditoría | ✔ | | | | ✔ |
| Usuarios | ✔ | | | | |

(ADMIN tiene acceso a todo.)

---

## 4. Por dónde empezar — el orden recomendado desde cero

Si la base está vacía (o se acaba de "limpiar" para empezar de nuevo), conviene
cargar la información **en este orden**, porque cada paso necesita lo anterior.
Cada pantalla tiene además un panel **"¿Cómo funciona?"** (arriba, se despliega
con un clic) con esta misma explicación aplicada a esa pantalla puntual.

1. **Vendedores** → dar de alta a las personas que venden.
2. **Clientes** → cargar la cartera: nombre, zona, **lista de precios**
   (Mayorista / Revendedor / Comercio / Público) y vendedor asignado.
3. **Inventario** → dar de alta cada **insumo** (materia prima: harina,
   aceite, sal, envases, etc.) con su **stock inicial** (botón ➕ *Ingreso*) y
   su precio. Este stock es el de la materia prima, todavía no de productos
   terminados.
4. **Productos** → crear cada producto que se vende, con sus **4 precios**
   (uno por lista) y su **receta**: qué insumos y cuánta cantidad de cada uno
   lleva un lote, más el **% de merma** (desperdicio normal) de cada insumo.
   *Crear la receta no mueve stock* — solo queda "anotado" qué consume
   fabricar ese producto.
5. **Producción** → crear una **orden de producción** para ese producto. Al
   **completarla**, el sistema:
   - **descuenta** del inventario los insumos consumidos (según la receta y
     la merma), y
   - **suma** al producto terminado la cantidad fabricada.

   Recién en este paso el producto **tiene stock disponible para vender**.
6. **Ventas** o **Pedido diario** → ya se puede vender: cada venta **descuenta**
   el stock del producto terminado (y si se anula, se lo devuelve).
7. **Reportes** (diario y mensual) → para seguir el día a día y el cierre de mes.
8. **Nómina** (si corresponde) → cargar empleados y, a fin de mes, procesar la
   liquidación de sueldos.

### La idea clave: dos stocks distintos

- **Stock de insumos** (Inventario): sube con **Ingresos** (compras) o bajas
  manuales (**Egresos**), y baja automáticamente cuando se **completa** una
  producción.
- **Stock de productos terminados** (Productos): sube al **completar** una
  producción, baja al **vender** (y vuelve a subir si se **anula** una venta).
  El botón **"Ajustar stock"** en Productos es solo para la **carga inicial**
  o una **corrección manual** puntual — no se usa en el día a día.

> Atajo: desde **Productos**, el botón **"Producir"** de cada producto te
> lleva directo a **Producción** con ese producto ya seleccionado.

---

## 5. Los módulos, paso a paso

### 5.1 Dashboard (todos)
Pantalla de inicio con el panorama del día: valor del stock, alertas de stock,
órdenes de producción activas, ventas del mes y **top vendedores**. Incluye
accesos rápidos a las acciones más usadas.

### 5.2 Inventario (gerente / operario)
Catálogo de insumos (materia prima) con su stock.

- **Buscar / filtrar** por nombre, código o categoría; botón **Solo stock
  bajo** para ver lo que está por agotarse.
- El **estado** se calcula solo: `OK` / `Bajo` / `Crítico` según los mínimos
  configurados para cada insumo.
- Botón **➕ verde** = registrar **Ingreso** (compra de insumo: suma stock).
- Botón **➖ ámbar** = registrar **Egreso** (salida manual: resta stock —
  por ejemplo, algo que se rompió o se perdió).
- **Nuevo insumo** para dar de alta materia prima nueva.

> Cada vez que se cambia el precio de un insumo, queda guardado en el
> historial de precios.

### 5.3 Productos (gerente)
Catálogo de los productos que se venden, con sus **4 precios** (Mayorista,
Revendedor, Comercio, Público), su **stock de producto terminado** y su
**receta**.

- **Nuevo producto**: nombre, unidad y los 4 precios.
- **Receta**: se abre desde cada producto. Por cada insumo se indica
  **cantidad por lote**, **unidad** y **% de merma**. Debajo de cada línea se
  ve cuánto se va a consumir realmente (cantidad + merma) y arriba se ve el
  **costo estimado** del lote, ya con la merma incluida.
- **Producir**: si el producto tiene receta activa, este botón abre
  **Producción** con el producto ya elegido, listo para crear la orden.
- **Stock**: columna con el stock actual de producto terminado. El botón de
  **ajustar stock** abre un diálogo para fijar ese número manualmente — pensado
  para la **carga inicial** o una **corrección** (ej. un recuento físico), no
  para el movimiento normal (eso lo hacen Producción y Ventas solos).
- **Historial de recetas**: cada vez que se edita la receta de un producto
  queda una versión anterior guardada, para poder ver cómo cambió con el tiempo.

### 5.4 Producción (gerente / operario)
Órdenes para fabricar productos a partir de su **receta**.

1. **Nueva orden** → elegí producto y cantidad a producir → **Calcular
   insumos**: el sistema muestra cuánto se necesita de cada insumo (cantidad
   de receta + merma) y si hay stock suficiente para cubrirlo.
   - Si el producto **no tiene receta**, el sistema avisa y permite **crear
     la receta** ahí mismo (qué insumos lleva y en qué cantidad).
2. **Crear orden** (queda en estado *Planificada*).
3. **Iniciar** la orden cuando se empieza a producir de verdad.
4. **Completar**: se carga la cantidad realmente producida y, si hace falta,
   se ajusta el consumo real de insumos. Al completar, el sistema:
   - **descuenta** del inventario los insumos consumidos,
   - **suma** al stock del producto la cantidad producida, y
   - calcula el **costo real** del lote (con la merma real).

> Tip: ¿quieren saber el costo de un producto que todavía no fabrican (por
> ejemplo, una presentación nueva)? Se puede **simular el costo** cargando los
> insumos de una receta hipotética, sin crear el producto ni mover stock.

### 5.5 Pedido diario (gerente / operario)
La forma rápida de cargar el pedido de un vendedor, como en una planilla.

1. Elegí **vendedor**, **cliente** y **lista de precios** (al elegir un
   cliente se aplica automáticamente su lista y su vendedor).
2. En la grilla, escribí la **cantidad** de cada producto. El precio y el
   subtotal se calculan solos; abajo se ve el **total** en vivo.
3. **Registrar pedido** → queda como una venta (y descuenta el stock del
   producto vendido).

### 5.6 Ventas (gerente)
Listado de ventas con totales facturados y ganancia.

- **Nueva venta**: cliente, vendedor, lista de precios, productos y
  descuento. Arriba se ve el desglose **Subtotal / Descuento / Total**.
- Cada fila permite **descargar el remito en PDF** y **anular** la venta (pide
  motivo y devuelve el stock del producto).

### 5.7 Clientes (gerente)
Cartera de clientes **por zona de venta**.

- Arriba, tarjetas por zona (cuántos clientes hay en cada una) → sirve para
  saber **dónde falta ir a ofrecer**. Se puede clickear una zona para filtrar.
- **Nuevo cliente**: nombre, **lista de precios** (Mayorista / Revendedor /
  Comercio / Público), zona, localidad, vendedor asignado, teléfono y CUIT.

### 5.8 Vendedores (gerente)
Listado de vendedores, con **activar/desactivar**.

- **Nuevo vendedor**: nombre y datos de contacto.
- Un vendedor **desactivado** deja de aparecer para elegir en Clientes,
  Ventas y Pedido diario, pero se conserva en las ventas históricas.

### 5.9 Reporte mensual (gerente / contador)
Reemplaza la planilla "MENSUAL" del Excel.

- Elegí **mes y año**.
- **Ranking por vendedor** (ventas, unidades y monto) + **matriz producto ×
  vendedor** (cuánto se vendió de cada producto, por cada vendedor).
- Botón **Excel** para descargar todo en una planilla.

### 5.10 Reporte diario (gerente / contador)
Detalle **día por día**: ventas, egresos de insumos (compras) y costo de
producción.

- Botones de rango rápido (hoy, semana, mes) o elegí fechas manualmente.
- La tabla muestra, por día, los totales de **Ventas**, **Egresos** y
  **Producción**, con una fila de **Total** al final.
- Botón **Excel** para exportar el detalle del rango elegido.

### 5.11 Nómina (RRHH)
Tres pestañas:

- **Liquidaciones**: **Procesar nómina** de un mes → genera los recibos de
  todos los empleados activos (calcula antigüedad y aportes). Botón **Ver**
  muestra los recibos; cada uno se descarga en **PDF** y la liquidación
  completa en **Excel**.
- **Empleados**: alta de empleados y configuración de su **estructura
  salarial** (sueldo básico, etc.).
- **Aportes**: porcentajes de AFIP, jubilación, obra social y sindicato
  (editables).

### 5.12 Auditoría (contador)
Registro de **todo lo que pasó**: quién hizo qué, cuándo y desde dónde. Se
filtra por módulo y acción, y cada registro muestra los valores anteriores y
nuevos.

### 5.13 Usuarios (solo ADMIN)
Pantalla para administrar las cuentas de acceso (menú → **Administración →
Usuarios**).

- **Nuevo usuario**: usuario, email, contraseña y **rol**.
- **Editar**: cambiar email o rol, y **activar/desactivar** la cuenta. Una
  cuenta desactivada no puede iniciar sesión.
- **Restablecer contraseña**: le asigna una contraseña nueva a esa cuenta (se
  la pasás a la persona).
- Por seguridad, el sistema **no permite**: desactivarte a vos mismo, sacarte
  el rol ADMIN a vos mismo, ni dejar el sistema sin ningún administrador activo.

---

## 6. Las guías "¿Cómo funciona?"

En **Inventario, Productos, Producción, Ventas, Pedido diario, Nómina,
Clientes, Vendedores y Reportes** hay un panel plegable arriba de la pantalla,
con el ícono de ayuda, que explica en el momento **para qué sirve esa pantalla
y cómo se relaciona con las demás**. Es la misma idea de este manual, pero a
mano en cada lugar — útil para alguien nuevo que se suma al equipo.

---

## 7. Listas de precios

Cada producto tiene **4 precios**: **Mayorista**, **Revendedor**, **Comercio**
y **Al público**. Cada cliente tiene una lista asignada; al venderle, se usa
su precio automáticamente (igual se puede cambiar la lista en la venta).
Cuando suben los precios, se actualizan desde **Productos** y de ahí en
adelante se usan en las nuevas ventas (las ventas ya hechas no cambian).

---

## 8. Descargas (PDF y Excel)

- **Remito** de cada venta → PDF.
- **Recibo de sueldo** de cada empleado → PDF.
- **Reporte mensual**, **reporte diario** y **liquidación de nómina** → Excel.

Al tocar el botón de descarga, el archivo se guarda en la carpeta de
**Descargas** del navegador con su nombre (ej. `REM-2026-000123.pdf`).

---

## 9. Un día típico

1. **Operario** (mañana): registra los **ingresos** de insumos que llegaron y
   crea las **órdenes de producción** del día; al terminar, las **completa**
   (esto genera el stock de producto terminado del día).
2. **Gerente / vendedores**: cargan los **pedidos diarios** de cada vendedor,
   o registran **ventas** directamente.
3. **Gerente**: controla **ventas**, da de alta **clientes** nuevos y ajusta
   **precios** en Productos.
4. **Fin de mes** — **RRHH** procesa la **nómina**; **Gerente / Contador**
   revisan el **reporte mensual** y el **reporte diario** y exportan a Excel.

---

## 10. Preguntas frecuentes

**No veo un módulo en el menú.** Es normal: cada rol ve solo lo suyo. Si
necesitás acceso, pedíselo al administrador.

**Cargué la receta de un producto pero el inventario no cambió.** Es correcto:
crear o editar una receta **no mueve stock**, solo define qué consume cada
lote. El stock se mueve cuando se **completa una orden de producción**.

**Un producto figura con stock 0 y no puedo vender.** Hay que **producirlo**
primero (Producción → completar la orden) para que tenga stock disponible.
El botón **"Producir"** en Productos te lleva directo ahí.

**¿Para qué es "Ajustar stock" en Productos?** Solo para la carga inicial (al
empezar a usar el sistema) o para corregir un número después de un recuento
físico. El movimiento normal (subir al producir, bajar al vender) es automático.

**La descarga baja con un nombre raro / no abre.** Actualizá la página
(Ctrl+F5) y volvé a intentar.

**Me olvidé la contraseña.** El administrador entra a **Usuarios** (menú →
Administración) y usa **Restablecer contraseña** para darte una nueva.

**¿Los datos están seguros?** Sí: contraseñas encriptadas, acceso por rol y
auditoría de todas las operaciones.
