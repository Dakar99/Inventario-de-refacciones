const express = require("express");
const router = express.Router();

const { pool } = require("../config/db");
const { verificarToken } = require("../middlewares/auth");

// Tipos de equipo permitidos
const TIPOS_PERMITIDOS = [
  "pipa",
  "trailer",
  "cilindrera",
  "estacion",
  "otro",
];

// Empresas permitidas
const EMPRESAS_PERMITIDAS = [
  "tecomatlan",
  "paraiso",
];

/**
 * GET /api/equipos
 * Obtener equipos con filtros opcionales.
 */
router.get("/api/equipos", verificarToken, async (req, res) => {
  try {
    const {
      ubicacion_id,
      empresa,
      tipo,
      busqueda,
    } = req.query;

    let query = `
      SELECT *
      FROM equipos
      WHERE 1 = 1
    `;

    const params = [];
    let idx = 1;

    // Filtrar por ubicación
    if (ubicacion_id) {
      query += ` AND ubicacion_id = $${idx}`;
      params.push(ubicacion_id);
      idx++;
    }

    /*
     * El usuario bodega puede consultar cualquier empresa.
     * Los demás usuarios solo consultan su empresa.
     */
    if (req.usuario.rol !== "bodega") {
      query += ` AND empresa = $${idx}`;
      params.push(req.usuario.empresa);
      idx++;
    } else if (empresa) {
      query += ` AND empresa = $${idx}`;
      params.push(empresa);
      idx++;
    }

    // Filtrar por tipo de equipo
    if (tipo) {
      query += ` AND LOWER(tipo) = LOWER($${idx})`;
      params.push(tipo);
      idx++;
    }

    // Buscar por nombre o tipo
    if (busqueda) {
      query += `
        AND (
          nombre ILIKE $${idx}
          OR tipo ILIKE $${idx}
        )
      `;

      params.push(`%${busqueda}%`);
      idx++;
    }

    query += " ORDER BY nombre ASC";

    const result = await pool.query(query, params);

    return res.json(result.rows);
  } catch (error) {
    console.error("Error en GET /api/equipos:", error);

    return res.status(500).json({
      error: "Error al obtener equipos",
    });
  }
});

/**
 * GET /api/equipos/:id
 * Obtener un equipo por ID.
 */
router.get("/api/equipos/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;

    let query = `
      SELECT *
      FROM equipos
      WHERE id = $1
    `;

    const params = [id];

    // Los usuarios distintos de bodega solo pueden ver su empresa
    if (req.usuario.rol !== "bodega") {
      query += " AND empresa = $2";
      params.push(req.usuario.empresa);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Equipo no encontrado",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en GET /api/equipos/:id:", error);

    return res.status(500).json({
      error: "Error al obtener el equipo",
    });
  }
});

/**
 * POST /api/equipos
 * Crear un equipo.
 * Solo el usuario bodega puede crear equipos.
 */
router.post("/api/equipos", verificarToken, async (req, res) => {
  try {
    if (req.usuario.rol !== "bodega") {
      return res.status(403).json({
        error: "No autorizado",
      });
    }

    let {
      nombre,
      tipo,
      ubicacion_id,
      empresa,
    } = req.body;

    nombre = typeof nombre === "string"
      ? nombre.trim()
      : "";

    tipo = typeof tipo === "string"
      ? tipo.trim().toLowerCase()
      : "";

    empresa = typeof empresa === "string"
      ? empresa.trim().toLowerCase()
      : "";

    if (!nombre || !tipo || !empresa) {
      return res.status(400).json({
        error: "Nombre, tipo y empresa son obligatorios",
      });
    }

    if (!TIPOS_PERMITIDOS.includes(tipo)) {
      return res.status(400).json({
        error: "Tipo de equipo no válido",
      });
    }

    if (!EMPRESAS_PERMITIDAS.includes(empresa)) {
      return res.status(400).json({
        error: "Empresa no válida",
      });
    }

    const ubicacionNormalizada =
      ubicacion_id === "" ||
      ubicacion_id === undefined ||
      ubicacion_id === null
        ? null
        : Number(ubicacion_id);

    if (
      ubicacionNormalizada !== null &&
      !Number.isInteger(ubicacionNormalizada)
    ) {
      return res.status(400).json({
        error: "La ubicación no es válida",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO equipos (
          nombre,
          tipo,
          ubicacion_id,
          empresa
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [
        nombre,
        tipo,
        ubicacionNormalizada,
        empresa,
      ],
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error en POST /api/equipos:", error);

    return res.status(500).json({
      error: "Error al crear equipo",
    });
  }
});

/**
 * PUT /api/equipos/:id
 * Actualizar un equipo.
 * Solo el usuario bodega puede actualizar equipos.
 */
router.put("/api/equipos/:id", verificarToken, async (req, res) => {
  try {
    if (req.usuario.rol !== "bodega") {
      return res.status(403).json({
        error: "No autorizado",
      });
    }

    const { id } = req.params;

    let {
      nombre,
      tipo,
      ubicacion_id,
      empresa,
      activo,
    } = req.body;

    if (nombre !== undefined) {
      nombre = String(nombre).trim();

      if (!nombre) {
        return res.status(400).json({
          error: "El nombre no puede estar vacío",
        });
      }
    }

    if (tipo !== undefined) {
      tipo = String(tipo).trim().toLowerCase();

      if (!TIPOS_PERMITIDOS.includes(tipo)) {
        return res.status(400).json({
          error: "Tipo de equipo no válido",
        });
      }
    }

    if (empresa !== undefined) {
      empresa = String(empresa).trim().toLowerCase();

      if (!EMPRESAS_PERMITIDAS.includes(empresa)) {
        return res.status(400).json({
          error: "Empresa no válida",
        });
      }
    }

    let ubicacionNormalizada = ubicacion_id;

    if (
      ubicacion_id === "" ||
      ubicacion_id === null
    ) {
      ubicacionNormalizada = null;
    } else if (ubicacion_id !== undefined) {
      ubicacionNormalizada = Number(ubicacion_id);

      if (!Number.isInteger(ubicacionNormalizada)) {
        return res.status(400).json({
          error: "La ubicación no es válida",
        });
      }
    }

    const result = await pool.query(
      `
        UPDATE equipos
        SET
          nombre = COALESCE($1, nombre),
          tipo = COALESCE($2, tipo),

          ubicacion_id = CASE
            WHEN $3::boolean = TRUE
              THEN $4::integer
            ELSE ubicacion_id
          END,

          empresa = COALESCE($5, empresa),
          activo = COALESCE($6, activo),
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $7
        RETURNING *
      `,
      [
        nombre ?? null,
        tipo ?? null,
        ubicacion_id !== undefined,
        ubicacionNormalizada ?? null,
        empresa ?? null,
        activo ?? null,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Equipo no encontrado",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en PUT /api/equipos/:id:", error);

    return res.status(500).json({
      error: "Error al actualizar equipo",
    });
  }
});

/**
 * DELETE /api/equipos/:id
 * Eliminar un equipo.
 * Solo el usuario bodega puede eliminar equipos.
 */
router.delete("/api/equipos/:id", verificarToken, async (req, res) => {
  try {
    if (req.usuario.rol !== "bodega") {
      return res.status(403).json({
        error: "No autorizado",
      });
    }

    const { id } = req.params;

    const result = await pool.query(
      `
        DELETE FROM equipos
        WHERE id = $1
        RETURNING id
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Equipo no encontrado",
      });
    }

    return res.json({
      message: "Equipo eliminado",
    });
  } catch (error) {
    console.error("Error en DELETE /api/equipos/:id:", error);

    /*
     * PostgreSQL puede impedir la eliminación si el equipo
     * está relacionado con movimientos.
     */
    if (error.code === "23503") {
      return res.status(409).json({
        error:
          "No se puede eliminar el equipo porque está relacionado con movimientos",
      });
    }

    return res.status(500).json({
      error: "Error al eliminar equipo",
    });
  }
});

module.exports = router;