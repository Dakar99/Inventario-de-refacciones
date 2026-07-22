const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const { verificarToken, requireBodega } = require("../middlewares/auth");

<<<<<<< HEAD
// GET /api/ubicaciones
router.get("/api/ubicaciones", verificarToken, async (req, res) => {
=======
// GET /ubicaciones
router.get("/ubicaciones", verificarToken, async (req, res) => {
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
  try {
    const { tipo } = req.query;
    let empresa = req.query.empresa;

    if (req.usuario.rol !== "bodega") {
      empresa = req.usuario.empresa;
    }

    let query = "SELECT * FROM ubicaciones WHERE 1=1";
    const params = [];
    let idx = 1;

    if (empresa) {
      query += ` AND empresa = $${idx}`;
      params.push(empresa);
      idx++;
    }

    if (tipo) {
      query += ` AND tipo = $${idx}`;
      params.push(tipo);
      idx++;
    }

    query += " ORDER BY nombre ASC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error en GET /ubicaciones:", error);
    res.status(500).json({ error: "Error al obtener ubicaciones" });
  }
});

<<<<<<< HEAD
// GET /api/ubicaciones/:id
router.get("/api/ubicaciones/:id", verificarToken, async (req, res) => {
=======
// GET /ubicaciones/:id
router.get("/ubicaciones/:id", verificarToken, async (req, res) => {
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
  try {
    const result = await pool.query(
      "SELECT * FROM ubicaciones WHERE id = $1",
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Ubicación no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en GET /ubicaciones/:id:", error);
    res.status(500).json({ error: "Error al obtener ubicación" });
  }
});

<<<<<<< HEAD
// POST /api/ubicaciones
router.post("/api/ubicaciones", verificarToken, async (req, res) => {
=======
// POST /ubicaciones
router.post("/ubicaciones", verificarToken, async (req, res) => {
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
  try {
    if (req.usuario.rol !== "bodega") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const {
      nombre,
      empresa,
      tipo,
      razon_social,
      domicilio,
      permiso,
      telefono,
      encargado,
      notas
    } = req.body;

    const result = await pool.query(
      `INSERT INTO ubicaciones
      (nombre, empresa, tipo, razon_social, domicilio, permiso, telefono, encargado, notas)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        nombre,
        empresa,
        tipo,
        razon_social || "",
        domicilio || "",
        permiso || "",
        telefono || "",
        encargado || "",
        notas || ""
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error en POST /ubicaciones:", error);
    res.status(500).json({ error: "Error al crear ubicación" });
  }
});

<<<<<<< HEAD
// PUT /api/ubicaciones/:id
router.put("/api/ubicaciones/:id", verificarToken, async (req, res) => {
=======
// PUT /ubicaciones/:id
router.put("/ubicaciones/:id", verificarToken, async (req, res) => {
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
  try {
    if (req.usuario.rol !== "bodega") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const {
      nombre,
      empresa,
      tipo,
      razon_social,
      domicilio,
      permiso,
      telefono,
      encargado,
      notas
    } = req.body;

    const result = await pool.query(
      `UPDATE ubicaciones SET
        nombre=$1,
        empresa=$2,
        tipo=$3,
        razon_social=$4,
        domicilio=$5,
        permiso=$6,
        telefono=$7,
        encargado=$8,
        notas=$9
      WHERE id=$10
      RETURNING *`,
      [
        nombre,
        empresa,
        tipo,
        razon_social || "",
        domicilio || "",
        permiso || "",
        telefono || "",
        encargado || "",
        notas || "",
        req.params.id
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Ubicación no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en PUT /ubicaciones:", error);
    res.status(500).json({ error: "Error al actualizar ubicación" });
  }
});

<<<<<<< HEAD
// DELETE /api/ubicaciones/:id
router.delete("/api/ubicaciones/:id", verificarToken, async (req, res) => {
=======
// DELETE /ubicaciones/:id
router.delete("/ubicaciones/:id", verificarToken, async (req, res) => {
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
  try {
    if (req.usuario.rol !== "bodega") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const result = await pool.query(
      "DELETE FROM ubicaciones WHERE id=$1 RETURNING *",
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Ubicación no encontrada" });
    }

    res.json({ mensaje: "Ubicación eliminada correctamente" });
  } catch (error) {
    console.error("Error en DELETE /ubicaciones:", error);
    res.status(500).json({ error: "Error al eliminar ubicación" });
  }
});

<<<<<<< HEAD
module.exports = router;
=======
module.exports = router;
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
