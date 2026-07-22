const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verificarToken } = require('../middlewares/auth');


router.get('/equipos', verificarToken, async (req, res) => {
    try {
        const { ubicacion_id, empresa, tipo, busqueda } = req.query;

        let query = `
            SELECT *
            FROM equipos
            WHERE 1 = 1
        `;

        const params = [];
        let idx = 1;

        if (ubicacion_id) {
            query += ` AND ubicacion_id = $${idx}`;
            params.push(ubicacion_id);
            idx++;
        }

        // Bodega puede filtrar por cualquier empresa.
        // Los demás usuarios solo pueden consultar su empresa.
        if (req.usuario.rol !== 'bodega') {
            query += ` AND empresa = $${idx}`;
            params.push(req.usuario.empresa);
            idx++;
        } else if (empresa) {
            query += ` AND empresa = $${idx}`;
            params.push(empresa);
            idx++;
        }

        if (tipo) {
            query += ` AND LOWER(tipo) = LOWER($${idx})`;
            params.push(tipo);
            idx++;
        }

        if (busqueda) {
            query += ` AND (
                nombre ILIKE $${idx}
                OR tipo ILIKE $${idx}
            )`;

            params.push(`%${busqueda}%`);
            idx++;
        }

        query += ' ORDER BY nombre ASC';

        const result = await pool.query(query, params);

        return res.json(result.rows);
    } catch (error) {
        console.error('Error en GET /equipos:', error);

        return res.status(500).json({
            error: 'Error al obtener equipos'
        });
    }
});
// GET /equipos/:id - Obtener un equipo por ID
router.get('/equipos/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM equipos WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Equipo no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error en GET /equipos/:id:', error);
        res.status(500).json({ error: 'Error al obtener el equipo' });
    }
});
// POST /equipos - Crear equipo (solo bodega)
router.post('/equipos', verificarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'bodega') {
            return res.status(403).json({
                error: 'No autorizado'
            });
        }

        let { nombre, tipo, ubicacion_id, empresa } = req.body;

        nombre = typeof nombre === 'string' ? nombre.trim() : '';
        tipo = typeof tipo === 'string' ? tipo.trim().toLowerCase() : '';
        empresa = typeof empresa === 'string'
            ? empresa.trim().toLowerCase()
            : '';

        const tiposPermitidos = [
            'pipa',
            'trailer',
            'cilindrera',
            'estacion',
            'otro'
        ];

        const empresasPermitidas = [
            'tecomatlan',
            'paraiso'
        ];

        if (!nombre || !tipo || !empresa) {
            return res.status(400).json({
                error: 'Faltan campos obligatorios'
            });
        }

        if (!tiposPermitidos.includes(tipo)) {
            return res.status(400).json({
                error: 'Tipo de equipo no válido'
            });
        }

        if (!empresasPermitidas.includes(empresa)) {
            return res.status(400).json({
                error: 'Empresa no válida'
            });
        }

        const ubicacionNormalizada =
            ubicacion_id === '' ||
            ubicacion_id === undefined ||
            ubicacion_id === null
                ? null
                : Number(ubicacion_id);

        if (
            ubicacionNormalizada !== null &&
            !Number.isInteger(ubicacionNormalizada)
        ) {
            return res.status(400).json({
                error: 'La ubicación no es válida'
            });
        }

        const result = await pool.query(
            `INSERT INTO equipos (
                nombre,
                tipo,
                ubicacion_id,
                empresa
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                nombre,
                tipo,
                ubicacionNormalizada,
                empresa
            ]
        );

        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error en POST /equipos:', error);

        return res.status(500).json({
            error: 'Error al crear equipo'
        });
    }
});

// PUT /equipos/:id - Actualizar equipo (solo bodega)
router.put('/equipos/:id', verificarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'bodega') {
            return res.status(403).json({
                error: 'No autorizado'
            });
        }

        const { id } = req.params;
        let {
            nombre,
            tipo,
            ubicacion_id,
            empresa,
            activo
        } = req.body;

        const tiposPermitidos = [
            'pipa',
            'trailer',
            'cilindrera',
            'estacion',
            'otro'
        ];

        const empresasPermitidas = [
            'tecomatlan',
            'paraiso'
        ];

        if (nombre !== undefined) {
            nombre = String(nombre).trim();

            if (!nombre) {
                return res.status(400).json({
                    error: 'El nombre no puede estar vacío'
                });
            }
        }

        if (tipo !== undefined) {
            tipo = String(tipo).trim().toLowerCase();

            if (!tiposPermitidos.includes(tipo)) {
                return res.status(400).json({
                    error: 'Tipo de equipo no válido'
                });
            }
        }

        if (empresa !== undefined) {
            empresa = String(empresa).trim().toLowerCase();

            if (!empresasPermitidas.includes(empresa)) {
                return res.status(400).json({
                    error: 'Empresa no válida'
                });
            }
        }

        let ubicacionNormalizada = ubicacion_id;

        if (
            ubicacion_id === '' ||
            ubicacion_id === null
        ) {
            ubicacionNormalizada = null;
        } else if (ubicacion_id !== undefined) {
            ubicacionNormalizada = Number(ubicacion_id);

            if (!Number.isInteger(ubicacionNormalizada)) {
                return res.status(400).json({
                    error: 'La ubicación no es válida'
                });
            }
        }

        const result = await pool.query(
            `UPDATE equipos
            SET
                nombre = COALESCE($1, nombre),
                tipo = COALESCE($2, tipo),
                ubicacion_id = CASE
                    WHEN $3::boolean = TRUE THEN $4::integer
                    ELSE ubicacion_id
                END,
                empresa = COALESCE($5, empresa),
                activo = COALESCE($6, activo),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *`,
            [
                nombre ?? null,
                tipo ?? null,
                ubicacion_id !== undefined,
                ubicacionNormalizada ?? null,
                empresa ?? null,
                activo ?? null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Equipo no encontrado'
            });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Error en PUT /equipos:', error);

        return res.status(500).json({
            error: 'Error al actualizar equipo'
        });
    }
});
// DELETE /equipos/:id - Eliminar equipo (solo bodega)
router.delete('/equipos/:id', verificarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'bodega') {
            return res.status(403).json({ error: 'No autorizado' });
        }
        const { id } = req.params;
        const result = await pool.query('DELETE FROM equipos WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Equipo no encontrado' });
        }
        res.json({ message: 'Equipo eliminado' });
    } catch (error) {
        console.error('Error en DELETE /equipos:', error);
        res.status(500).json({ error: 'Error al eliminar equipo' });
    }
});
// ENDPOINTS DE UBICACIONES

// GET /ubicaciones - Listar ubicaciones con filtros opcionales

module.exports = router;
