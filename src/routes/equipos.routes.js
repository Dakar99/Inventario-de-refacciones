const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verificarToken } = require('../middlewares/auth');


<<<<<<< HEAD
router.get('/api/equipos', verificarToken, async (req, res) => {
=======
router.get('/equipos', verificarToken, async (req, res) => {
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
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
<<<<<<< HEAD
// GET /api/equipos/:id - Obtener un equipo por ID
router.get('/api/equipos/:id', verificarToken, async (req, res) => {
=======
// GET /equipos/:id - Obtener un equipo por ID
router.get('/equipos/:id', verificarToken, async (req, res) => {
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
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
<<<<<<< HEAD
// POST /api/equipos - Crear equipo (solo bodega)
router.post('/api/equipos', verificarToken, async (req, res) => {
=======
// POST /equipos - Crear equipo (solo bodega)
router.post('/equipos', verificarToken, async (req, res) => {
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
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

<<<<<<< HEAD
// PUT /api/equipos/:id - Actualizar equipo (solo bodega)
router.put('/api/equipos/:id', verificarToken, async (req, res) => {
=======
// PUT /equipos/:id - Actualizar equipo (solo bodega)
router.put('/equipos/:id', verificarToken, async (req, res) => {
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
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

<<<<<<< HEAD
// DELETE /api/equipos/:id - Eliminar equipo (solo bodega)
router.delete('/api/equipos/:id', verificarToken, async (req, res) => {
=======
// DELETE /equipos/:id - Eliminar equipo (solo bodega)
router.delete('/equipos/:id', verificarToken, async (req, res) => {
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
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

<<<<<<< HEAD
// GET /api/ubicaciones - Listar ubicaciones con filtros opcionales
=======
// GET /ubicaciones - Listar ubicaciones con filtros opcionales
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95

module.exports = router;
