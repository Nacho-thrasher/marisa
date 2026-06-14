# Manual de Uso — Sistema de Gestión Marisa

Sistema web para gestionar la fábrica de snacks: inventario de insumos,
producción con recetas, ventas con listas de precios, clientes por zona,
vendedores, nómina y auditoría.

> **Resumen en una línea:** cada persona entra con su usuario, ve solo lo que
> le corresponde según su rol, y el sistema registra todo automáticamente.

---

## 1. Cómo entrar

1. Abrí la dirección del sistema en el navegador (Chrome, Edge o similar).
   - En desarrollo local: `http://localhost:4200`
   - En producción: https://marisa-tau.vercel.app
2. Ingresá **usuario** y **contraseña**.
3. El menú de la izquierda muestra **solo los módulos de tu rol**.

Para salir: botón **Salir** arriba a la derecha.

---

## 2. Usuarios y accesos

### 2.1 Usuarios demo (entorno de prueba)

Estos usuarios vienen cargados para probar. **En producción no existen**: la base
arranca con un solo administrador (ver 2.2).

| Usuario    | Contraseña     | Rol      | Para quién |
|------------|----------------|----------|------------|
| `admin`    | `Admin123!`    | ADMIN    | Dueño / administrador del sistema. Ve y hace todo. |
| `gerente`  | `Gerente123!`  | GERENTE  | Gerencia: producción, ventas, clientes, precios, reportes. |
| `operario` | `Operario123!` | OPERARIO | Planta: inventario y producción. |
| `rrhh`     | `Rrhh123!`     | RRHH     | Recursos Humanos: empleados y sueldos. |
| `contador` | `Contador123!` | CONTADOR | Contador: reportes y auditoría (solo lectura). |

> La contraseña tiene mayúscula, minúscula, número y un signo (`!`).

### 2.2 En producción

La base real arranca con **un solo usuario ADMIN**. Desde ahí, el administrador
entra a **Usuarios** (menú → Administración) y crea una cuenta para cada persona,
con el rol que le corresponde (ver tabla de la sección 3). Cada persona debe tener
su propio usuario: así la auditoría queda prolija y se puede saber quién hizo qué.

---

## 3. Qué puede hacer cada rol

| Módulo | ADMIN | GERENTE | OPERARIO | RRHH | CONTADOR |
|--------|:-----:|:-------:|:--------:|:----:|:--------:|
| Dashboard | ✔ | ✔ | ✔ | ✔ | ✔ |
| Inventario | ✔ | ✔ | ✔ | | |
| Producción | ✔ | ✔ | ✔ | | |
| Pedido diario | ✔ | ✔ | ✔ | | |
| Ventas | ✔ | ✔ | | | |
| Clientes | ✔ | ✔ | | | |
| Reporte mensual | ✔ | ✔ | | | ✔ |
| Nómina | ✔ | | | ✔ | |
| Auditoría | ✔ | | | | ✔ |
| Usuarios | ✔ | | | | |

(ADMIN tiene acceso a todo.)

---

## 4. Los módulos, paso a paso

### 4.1 Dashboard (todos)
Pantalla de inicio con el panorama del día: valor del stock, alertas de stock,
órdenes de producción activas, ventas del mes y **top vendedores**. Incluye
accesos rápidos a las acciones más usadas.

### 4.2 Inventario (gerente / operario)
Catálogo de insumos (papa, aceite, sal, harina, envases, etc.) con su stock.

- **Buscar / filtrar** por nombre, código o categoría; botón **Solo stock bajo**
  para ver lo que está por agotarse.
- El **estado** se calcula solo: `OK` / `Bajo` / `Crítico` según los mínimos.
- Botón **＋ (verde)** = registrar **ingreso** (compra de insumo).
- Botón **－ (ámbar)** = registrar **egreso** (salida manual).
- **Nuevo insumo** para dar de alta materia prima.

> Cada vez que se cambia el precio de un insumo, queda guardado en el historial.

### 4.3 Producción (gerente / operario)
Órdenes para fabricar productos a partir de su **receta**.

1. **Nueva orden** → elegí producto y cantidad → **Calcular insumos**: el sistema
   muestra cuánto se necesita (incluida la merma) y si hay stock suficiente.
   - Si el producto **no tiene receta**, te avisa y el gerente puede **crear la
     receta** ahí mismo (qué insumos lleva y en qué cantidad).
2. **Crear orden** (queda *Planificada*).
3. **Iniciar** la orden cuando se empieza a producir.
4. **Completar**: se carga la cantidad realmente producida y el consumo real de
   insumos. El sistema **descuenta el stock**, calcula la **merma** y el **costo real**.

> Tip: ¿quieren saber el costo de un producto que todavía no fabrican (ej. papas
> 150 g)? Se puede **simular el costo** cargando los insumos, sin crear el producto.

### 4.4 Pedido diario (gerente / operario)
La forma rápida de cargar el pedido de un vendedor, como en la planilla de Excel.

1. Elegí **vendedor**, **cliente** y **lista de precios** (al elegir un cliente se
   aplica su lista y su vendedor automáticamente).
2. En la grilla, escribí la **cantidad** de cada producto. El precio y el subtotal
   se calculan solos; abajo se ve el **total** en vivo.
3. **Registrar pedido** → queda como una venta.

### 4.5 Ventas (gerente)
Listado de ventas con totales facturados y ganancia.

- **Nueva venta**: cliente, vendedor, lista de precios, productos y descuento.
- Cada fila permite **descargar el remito en PDF** y **anular** la venta (pide motivo).

### 4.6 Clientes (gerente)
Cartera de clientes **por zona de venta** en Salta.

- Arriba, tarjetas por zona (cuántos clientes hay en cada una) → sirve para saber
  **dónde falta ir a ofrecer**. Se puede clickear una zona para filtrar.
- **Nuevo cliente**: nombre, **lista de precios** (Mayorista / Revendedor /
  Comercio / Público), zona, localidad, vendedor asignado, teléfono y CUIT.

### 4.7 Reporte mensual (gerente / contador)
Reemplaza la hoja "MENSUAL" del Excel.

- Elegí **mes y año**.
- **Ranking por vendedor** (ventas, unidades y monto) + **matriz producto × vendedor**.
- Botón **Excel** para descargar todo en una planilla.

### 4.8 Nómina (RRHH)
Tres pestañas:

- **Liquidaciones**: **Procesar nómina** de un mes → genera los recibos de todos
  los empleados activos (calcula antigüedad y aportes). Botón **Ver** muestra los
  recibos; cada uno se descarga en **PDF** y la liquidación completa en **Excel**.
- **Empleados**: alta de empleados y configuración de su **estructura salarial**
  (sueldo básico, etc.).
- **Aportes**: porcentajes de AFIP, jubilación, obra social y sindicato (editables).

### 4.9 Auditoría (contador)
Registro de **todo lo que pasó**: quién hizo qué, cuándo y desde dónde. Se filtra
por módulo y acción, y cada registro muestra los valores anteriores y nuevos.

### 4.10 Usuarios (solo ADMIN)
Pantalla para administrar las cuentas de acceso (menú → **Administración → Usuarios**).

- **Nuevo usuario**: usuario, email, contraseña y **rol** (ADMIN, GERENTE,
  OPERARIO, RRHH o CONTADOR).
- **Editar**: cambiar email o rol, y **activar/desactivar** la cuenta. Una cuenta
  desactivada no puede iniciar sesión.
- **Restablecer contraseña**: le asigna una contraseña nueva a esa cuenta (se la
  pasás a la persona).
- Por seguridad, el sistema **no permite**: desactivarte a vos mismo, sacarte el
  rol ADMIN a vos mismo, ni dejar el sistema sin ningún administrador activo.

---

## 5. Listas de precios

Cada producto tiene **4 precios**: **Mayorista**, **Revendedor**, **Comercio** y
**Al público**. Cada cliente tiene una lista asignada; al venderle, se usa su
precio automáticamente (igual se puede cambiar la lista en la venta). Cuando suben
los precios, se actualizan desde el producto.

---

## 6. Descargas (PDF y Excel)

- **Remito** de cada venta → PDF.
- **Recibo de sueldo** de cada empleado → PDF.
- **Reporte mensual** de ventas y **liquidación de nómina** → Excel.

Al tocar el botón de descarga, el archivo se guarda en la carpeta de **Descargas**
del navegador con su nombre (ej. `REM-2026-000123.pdf`).

---

## 7. Un día típico

1. **Operario** (mañana): registra los **ingresos** de insumos que llegaron y crea
   las **órdenes de producción** del día; al terminar, las **completa**.
2. **Gerente / vendedores**: cargan los **pedidos diarios** de cada vendedor.
3. **Gerente**: controla **ventas**, da de alta **clientes** nuevos y ajusta **precios**.
4. **Fin de mes** — **RRHH** procesa la **nómina**; **Gerente/Contador** revisan el
   **reporte mensual** y exportan a Excel.

---

## 8. Preguntas frecuentes

**No veo un módulo en el menú.** Es normal: cada rol ve solo lo suyo. Si necesitás
acceso, pedíselo al administrador.

**La descarga baja con un nombre raro / no abre.** Ya está resuelto; si pasara,
actualizá la página (Ctrl+F5) y volvé a intentar.

**Me olvidé la contraseña.** El administrador entra a **Usuarios** (menú →
Administración) y usa **Restablecer contraseña** para darte una nueva.

**¿Los datos están seguros?** Sí: contraseñas encriptadas, acceso por rol y
auditoría de todas las operaciones.

---

_Para instalar/desplegar el sistema, ver [DESPLIEGUE.md](DESPLIEGUE.md)._
