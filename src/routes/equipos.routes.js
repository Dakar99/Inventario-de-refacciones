const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verificarToken } = require('../middlewares/auth');


router.get('/equipos', verificarToken, async (req, res) => {
    try {
        const { ubicacion_id, empresa } = req.query;
        let query = 'SELECT * FROM equipos WHERE 1=1';
        const params = [];
        let idx = 1;

        if (ubicacion_id) {
            query += ` AND ubicacion_id = $${idx}`;
            params.push(ubicacion_id);
            idx++;
        }
        if (empresa) {
            query += ` AND empresa = $${idx}`;
            params.push(empresa);
            idx++;
        }

        // Si no es bodega, solo ver equipos de su empresa
        if (req.usuario.rol !== 'bodega') {
            query += ` AND empresa = $${idx}`;
            params.push(req.usuario.empresa);
            idx++;
        }

        query += ' ORDER BY nombre';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error en GET /equipos:', error);
        res.status(500).json({ error: 'Error al obtener equipos' });
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
            return res.status(403).json({ error: 'No autorizado' });
        }
        const { nombre, tipo, ubicacion_id, empresa } = req.body;
        if (!nombre || !tipo || !empresa) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }
        const result = await pool.query(
            'INSERT INTO equipos (nombre, tipo, ubicacion_id, empresa) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre, tipo, ubicacion_id, empresa]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error en POST /equipos:', error);
        res.status(500).json({ error: 'Error al crear equipo' });
    }
});

// PUT /equipos/:id - Actualizar equipo (solo bodega)
router.put('/equipos/:id', verificarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'bodega') {
            return res.status(403).json({ error: 'No autorizado' });
        }
        const { id } = req.params;
        const { nombre, tipo, ubicacion_id, empresa, activo } = req.body;
        const result = await pool.query(
            `UPDATE equipos SET 
                nombre = COALESCE($1, nombre),
                tipo = COALESCE($2, tipo),
                ubicacion_id = COALESCE($3, ubicacion_id),
                empresa = COALESCE($4, empresa),
                activo = COALESCE($5, activo)
            WHERE id = $6 RETURNING *`,
            [nombre, tipo, ubicacion_id, empresa, activo, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Equipo no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error en PUT /equipos:', error);
        res.status(500).json({ error: 'Error al actualizar equipo' });
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
