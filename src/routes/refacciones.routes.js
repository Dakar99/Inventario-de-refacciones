const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const { verificarToken } = require("../middlewares/auth");
const { stock_minimo } = require('../services/telegram.service');

// ENDPOINTS DE REFACCIONES

// GET /api/refacciones - Listar refacciones (con filtros)
router.get("/refacciones", verificarToken, async (req, res) => {
  try {
    const { categoria, busqueda } = req.query;
    let empresa = req.query.empresa;

    if (req.usuario.rol !== "bodega") {
      empresa = req.usuario.empresa;
    }

    let query = "SELECT * FROM refacciones WHERE 1=1";
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
      query += ` AND (nombre ILIKE $${idx} OR codigo ILIKE $${idx} OR para_que_es ILIKE $${idx} OR descripcion ILIKE $${idx})`;
      params.push(`%${busqueda}%`);
      idx++;
    }

    query += " ORDER BY nombre ASC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error en GET /refacciones:", error);
    res.status(500).json({ error: "Error al obtener refacciones" });
  }
});
// GET /api/refacciones/:id - Obtener una refacción por ID
router.get("/refacciones/:id", verificarToken, async (req, res) => {
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
router.post("/refacciones", verificarToken, async (req, res) => {
  try {
    // Verificar rol
    if (req.usuario.rol !== "bodega") {
      return res.status(403).json({ error: "No autorizado" });
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
        empresa,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error en POST /refacciones:", error);
    res.status(500).json({ error: "Error al crear refacción" });
  }
});
// PUT /api/refacciones/:id - Actualizar refacción (solo bodega)
router.put("/refacciones/:id", verificarToken, async (req, res) => {
  try {
    if (req.usuario.rol !== "bodega") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { id } = req.params;
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

    // Construir dinámicamente la actualización (solo los campos que vienen)
    let query = "UPDATE refacciones SET ";
    const fields = [];
    const values = [];
    let idx = 1;

    if (nombre !== undefined) {
      fields.push(`nombre = $${idx}`);
      values.push(nombre);
      idx++;
    }
    if (descripcion !== undefined) {
      fields.push(`descripcion = $${idx}`);
      values.push(descripcion);
      idx++;
    }
    if (categoria !== undefined) {
      fields.push(`categoria = $${idx}`);
      values.push(categoria);
      idx++;
    }
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
      fields.push(`empresa = $${idx}`);
      values.push(empresa);
      idx++;
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    query += fields.join(", ");
    query += ` WHERE id = $${idx} RETURNING *`;
    values.push(id);
    
    await stock_minimo(refaccion);

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
router.delete("/refacciones/:id", verificarToken, async (req, res) => {
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
