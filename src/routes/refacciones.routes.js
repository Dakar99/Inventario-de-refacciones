const express = require("express");
const router = express.Router();
<<<<<<< HEAD
const { pool } = require("../config/db");
const { verificarToken } = require("../middlewares/auth");

// ENDPOINTS DE REFACCIONES

// GET /api/refacciones - Listar refacciones (con filtros)
router.get("/api/refacciones", verificarToken, async (req, res) => {
  try {
    const { categoria, busqueda } = req.query;
    let empresa = req.query.empresa;

    if (req.usuario.rol !== "bodega") {
      empresa = req.usuario.empresa;
    }

    let query = "SELECT * FROM refacciones WHERE 1=1";
=======

const { pool } = require("../config/db");
const { verificarToken } = require("../middlewares/auth");

const {
  alertaStockBajo,
} = require("../services/telegram.service");

// ======================================================
// FUNCIONES AUXILIARES
// ======================================================

const ROLES_ADMINISTRACION = ["bodega", "encargado"];
const EMPRESAS_VALIDAS = ["tecomatlan", "paraiso"];

function puedeAdministrarRefacciones(usuario) {
  return usuario && ROLES_ADMINISTRACION.includes(usuario.rol);
}

function empresaDelUsuario(usuario, empresaSolicitada = null) {
  if (usuario.rol === "bodega") {
    return empresaSolicitada;
  }

  return usuario.empresa;
}

async function enviarAlertaStock(refaccion) {
  try {
    const cantidad = Number(refaccion.cantidad || 0);
    const minimo = Number(refaccion.stock_minimo || 0);

    if (cantidad <= minimo) {
      await alertaStockBajo(refaccion);
    }
  } catch (error) {
    console.error(
      "No se pudo enviar la alerta de stock mínimo:",
      error.message,
    );
  }
}

// ======================================================
// GET /api/refacciones
// ======================================================
// Bodega puede consultar ambas empresas.
// Encargado y solicitante solamente consultan su empresa.

router.get("/refacciones", verificarToken, async (req, res) => {
  try {
    const { categoria, busqueda } = req.query;

    if (!req.usuario) {
      return res.status(401).json({
        error: "No se encontró la información del usuario",
      });
    }

    const empresa = empresaDelUsuario(
      req.usuario,
      req.query.empresa || null,
    );

    if (empresa && !EMPRESAS_VALIDAS.includes(empresa)) {
      return res.status(400).json({
        error: `La empresa "${empresa}" no es válida`,
      });
    }

    let query = `
      SELECT *
      FROM refacciones
      WHERE 1 = 1
    `;

>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
    const params = [];
    let idx = 1;

    if (categoria) {
      query += ` AND categoria = $${idx}`;
      params.push(categoria);
      idx++;
    }

    if (empresa) {
      query += ` AND empresa = $${idx}`;
      params.push(empresa);
      idx++;
    }

    if (busqueda) {
<<<<<<< HEAD
      query += ` AND (nombre ILIKE $${idx} OR codigo ILIKE $${idx} OR para_que_es ILIKE $${idx} OR descripcion ILIKE $${idx})`;
=======
      query += `
        AND (
          nombre ILIKE $${idx}
          OR codigo ILIKE $${idx}
          OR COALESCE(para_que_es, '') ILIKE $${idx}
          OR COALESCE(descripcion, '') ILIKE $${idx}
        )
      `;

>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
      params.push(`%${busqueda}%`);
      idx++;
    }

    query += " ORDER BY nombre ASC";

    const result = await pool.query(query, params);
<<<<<<< HEAD
    res.json(result.rows);
  } catch (error) {
    console.error("Error en GET /refacciones:", error);
    res.status(500).json({ error: "Error al obtener refacciones" });
  }
});
// GET /api/refacciones/:id - Obtener una refacción por ID
router.get("/api/refacciones/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM refacciones WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Refacción no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en GET /refacciones/:id:", error);
    res.status(500).json({ error: "Error al obtener la refacción" });
  }
});
// POST /api/refacciones - Crear nueva refacción (solo bodega)
router.post("/api/refacciones", verificarToken, async (req, res) => {
  try {
    // Verificar rol
    if (req.usuario.rol !== "bodega") {
      return res.status(403).json({ error: "No autorizado" });
=======

    return res.json(result.rows);
  } catch (error) {
    console.error("Error en GET /refacciones:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });

    return res.status(500).json({
      error: "Error al obtener las refacciones",
    });
  }
});

// ======================================================
// GET /api/refacciones/:id
// ======================================================
// Bodega puede consultar cualquier refacción.
// Los demás usuarios solamente pueden consultar las de su empresa.

router.get("/refacciones/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const esBodega = req.usuario.rol === "bodega";

    let query = `
      SELECT *
      FROM refacciones
      WHERE id = $1
    `;

    const params = [id];

    if (!esBodega) {
      query += " AND empresa = $2";
      params.push(req.usuario.empresa);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Refacción no encontrada o no pertenece a tu empresa",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en GET /refacciones/:id:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });

    return res.status(500).json({
      error: "Error al obtener la refacción",
    });
  }
});

// ======================================================
// POST /api/refacciones
// ======================================================
// Bodega y encargado pueden registrar.
// El encargado registra automáticamente en su empresa.

router.post("/refacciones", verificarToken, async (req, res) => {
  try {
    if (!puedeAdministrarRefacciones(req.usuario)) {
      return res.status(403).json({
        error: "No tienes autorización para registrar refacciones",
      });
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
    }

    const {
      codigo,
      nombre,
      descripcion,
      categoria,
      para_que_es,
      cantidad,
      stock_minimo,
      precio,
<<<<<<< HEAD
      empresa,
    } = req.body;
    if (!codigo || !nombre || !categoria || !empresa) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: codigo, nombre, categoria, empresa",
      });
    }

    // Verificar que el código no exista
    const exist = await pool.query(
      "SELECT id FROM refacciones WHERE codigo = $1",
      [codigo],
    );
    if (exist.rows.length > 0) {
      return res.status(400).json({ error: "El código ya existe" });
    }

    const result = await pool.query(
      `INSERT INTO refacciones 
            (codigo, nombre, descripcion, categoria, para_que_es, cantidad, stock_minimo, precio, empresa, fecha_registro)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE)
            RETURNING *`,
      [
        codigo,
        nombre,
        descripcion,
        categoria,
        para_que_es,
        cantidad || 0,
        stock_minimo || 2,
        precio || 0,
=======
    } = req.body;

    const empresa = empresaDelUsuario(
      req.usuario,
      req.body.empresa || null,
    );

    if (!codigo || !nombre || !categoria || !empresa) {
      return res.status(400).json({
        error:
          "Código, nombre, categoría y empresa son obligatorios",
      });
    }

    if (!EMPRESAS_VALIDAS.includes(empresa)) {
      return res.status(400).json({
        error: "La empresa seleccionada no es válida",
      });
    }

    const cantidadNumerica = Number(cantidad ?? 0);
    const stockMinimoNumerico = Number(stock_minimo ?? 2);
    const precioNumerico = Number(precio ?? 0);

    if (
      !Number.isFinite(cantidadNumerica) ||
      cantidadNumerica < 0
    ) {
      return res.status(400).json({
        error: "La cantidad debe ser un número válido mayor o igual a cero",
      });
    }

    if (
      !Number.isFinite(stockMinimoNumerico) ||
      stockMinimoNumerico < 0
    ) {
      return res.status(400).json({
        error:
          "El stock mínimo debe ser un número válido mayor o igual a cero",
      });
    }

    if (!Number.isFinite(precioNumerico) || precioNumerico < 0) {
      return res.status(400).json({
        error: "El precio debe ser un número válido mayor o igual a cero",
      });
    }

    const existente = await pool.query(
      `
        SELECT id
        FROM refacciones
        WHERE LOWER(codigo) = LOWER($1)
          AND empresa = $2
      `,
      [codigo.trim(), empresa],
    );

    if (existente.rows.length > 0) {
      return res.status(400).json({
        error: "El código ya existe para esta empresa",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO refacciones (
          codigo,
          nombre,
          descripcion,
          categoria,
          para_que_es,
          cantidad,
          stock_minimo,
          precio,
          empresa,
          fecha_registro
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, CURRENT_DATE
        )
        RETURNING *
      `,
      [
        codigo.trim(),
        nombre.trim(),
        descripcion?.trim() || "",
        categoria,
        para_que_es?.trim() || "",
        cantidadNumerica,
        stockMinimoNumerico,
        precioNumerico,
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
        empresa,
      ],
    );

<<<<<<< HEAD
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error en POST /refacciones:", error);
    res.status(500).json({ error: "Error al crear refacción" });
  }
});
// PUT /api/refacciones/:id - Actualizar refacción (solo bodega)
router.put("/api/refacciones/:id", verificarToken, async (req, res) => {
  try {
    if (req.usuario.rol !== "bodega") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { id } = req.params;
=======
    await enviarAlertaStock(result.rows[0]);

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error en POST /refacciones:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });

    return res.status(500).json({
      error: "Error al crear la refacción",
    });
  }
});

// ======================================================
// PUT /api/refacciones/:id
// ======================================================
// Bodega y encargado pueden editar.
// El encargado solo puede editar refacciones de su empresa.
// El encargado no puede cambiar la empresa.

router.put("/refacciones/:id", verificarToken, async (req, res) => {
  try {
    if (!puedeAdministrarRefacciones(req.usuario)) {
      return res.status(403).json({
        error: "No tienes autorización para editar refacciones",
      });
    }

    const { id } = req.params;
    const esBodega = req.usuario.rol === "bodega";

>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
    const {
      nombre,
      descripcion,
      categoria,
      para_que_es,
      cantidad,
      stock_minimo,
      precio,
      empresa,
    } = req.body;

<<<<<<< HEAD
    // Construir dinámicamente la actualización (solo los campos que vienen)
    let query = "UPDATE refacciones SET ";
=======
    if (
      empresa !== undefined &&
      esBodega &&
      !EMPRESAS_VALIDAS.includes(empresa)
    ) {
      return res.status(400).json({
        error: "La empresa seleccionada no es válida",
      });
    }

>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
    const fields = [];
    const values = [];
    let idx = 1;

    if (nombre !== undefined) {
<<<<<<< HEAD
      fields.push(`nombre = $${idx}`);
      values.push(nombre);
      idx++;
    }
    if (descripcion !== undefined) {
      fields.push(`descripcion = $${idx}`);
      values.push(descripcion);
      idx++;
    }
=======
      if (!String(nombre).trim()) {
        return res.status(400).json({
          error: "El nombre no puede estar vacío",
        });
      }

      fields.push(`nombre = $${idx}`);
      values.push(String(nombre).trim());
      idx++;
    }

    if (descripcion !== undefined) {
      fields.push(`descripcion = $${idx}`);
      values.push(String(descripcion).trim());
      idx++;
    }

>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
    if (categoria !== undefined) {
      fields.push(`categoria = $${idx}`);
      values.push(categoria);
      idx++;
    }
<<<<<<< HEAD
    if (para_que_es !== undefined) {
      fields.push(`para_que_es = $${idx}`);
      values.push(para_que_es);
      idx++;
    }
    if (cantidad !== undefined) {
      fields.push(`cantidad = $${idx}`);
      values.push(cantidad);
      idx++;
    }
    if (stock_minimo !== undefined) {
      fields.push(`stock_minimo = $${idx}`);
      values.push(stock_minimo);
      idx++;
    }
    if (precio !== undefined) {
      fields.push(`precio = $${idx}`);
      values.push(precio);
      idx++;
    }
    if (empresa !== undefined) {
=======

    if (para_que_es !== undefined) {
      fields.push(`para_que_es = $${idx}`);
      values.push(String(para_que_es).trim());
      idx++;
    }

    if (cantidad !== undefined) {
      const valor = Number(cantidad);

      if (!Number.isFinite(valor) || valor < 0) {
        return res.status(400).json({
          error:
            "La cantidad debe ser un número válido mayor o igual a cero",
        });
      }

      fields.push(`cantidad = $${idx}`);
      values.push(valor);
      idx++;
    }

    if (stock_minimo !== undefined) {
      const valor = Number(stock_minimo);

      if (!Number.isFinite(valor) || valor < 0) {
        return res.status(400).json({
          error:
            "El stock mínimo debe ser un número válido mayor o igual a cero",
        });
      }

      fields.push(`stock_minimo = $${idx}`);
      values.push(valor);
      idx++;
    }

    if (precio !== undefined) {
      const valor = Number(precio);

      if (!Number.isFinite(valor) || valor < 0) {
        return res.status(400).json({
          error:
            "El precio debe ser un número válido mayor o igual a cero",
        });
      }

      fields.push(`precio = $${idx}`);
      values.push(valor);
      idx++;
    }

    // Solamente bodega puede cambiar la empresa.
    if (empresa !== undefined && esBodega) {
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
      fields.push(`empresa = $${idx}`);
      values.push(empresa);
      idx++;
    }

    if (fields.length === 0) {
<<<<<<< HEAD
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    query += fields.join(", ");
    query += ` WHERE id = $${idx} RETURNING *`;
    values.push(id);

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Refacción no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en PUT /refacciones:", error);
    res.status(500).json({ error: "Error al actualizar refacción" });
  }
});
// DELETE /api/refacciones/:id - Eliminar refacción (solo bodega)
router.delete("/api/refacciones/:id", verificarToken, async (req, res) => {
  try {
    if (req.usuario.rol !== "bodega") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM refacciones WHERE id = $1 RETURNING id",
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Refacción no encontrada" });
    }

    res.json({ message: "Refacción eliminada" });
  } catch (error) {
    console.error("Error en DELETE /refacciones:", error);
    res.status(500).json({ error: "Error al eliminar refacción" });
  }
});

module.exports = router;
=======
      return res.status(400).json({
        error: "No hay campos permitidos para actualizar",
      });
    }

    let query = `
      UPDATE refacciones
      SET ${fields.join(", ")}
      WHERE id = $${idx}
    `;

    values.push(id);
    idx++;

    // El encargado solamente puede editar refacciones de su empresa.
    if (!esBodega) {
      query += ` AND empresa = $${idx}`;
      values.push(req.usuario.empresa);
      idx++;
    }

    query += " RETURNING *";

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Refacción no encontrada o no pertenece a tu empresa",
      });
    }

    await enviarAlertaStock(result.rows[0]);

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en PUT /refacciones/:id:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });

    return res.status(500).json({
      error: "Error al actualizar la refacción",
    });
  }
});

// ======================================================
// DELETE /api/refacciones/:id
// ======================================================
// Bodega y encargado pueden eliminar.
// El encargado solamente puede eliminar refacciones de su empresa.

router.delete("/refacciones/:id", verificarToken, async (req, res) => {
  try {
    if (!puedeAdministrarRefacciones(req.usuario)) {
      return res.status(403).json({
        error: "No tienes autorización para eliminar refacciones",
      });
    }

    const { id } = req.params;
    const esBodega = req.usuario.rol === "bodega";

    let query = `
      DELETE FROM refacciones
      WHERE id = $1
    `;

    const params = [id];

    if (!esBodega) {
      query += " AND empresa = $2";
      params.push(req.usuario.empresa);
    }

    query += " RETURNING id, codigo, nombre, empresa";

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Refacción no encontrada o no pertenece a tu empresa",
      });
    }

    return res.json({
      message: "Refacción eliminada correctamente",
      refaccion: result.rows[0],
    });
  } catch (error) {
    console.error("Error en DELETE /refacciones/:id:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });

    // Violación de llave foránea:
    // la refacción está relacionada con movimientos.
    if (error.code === "23503") {
      return res.status(409).json({
        error:
          "No se puede eliminar la refacción porque está relacionada con movimientos registrados",
      });
    }

    return res.status(500).json({
      error: "Error al eliminar la refacción",
    });
  }
});

module.exports = router;
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
