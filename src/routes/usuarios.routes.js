const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const { verificarToken } = require('../middlewares/auth');


// GET /usuarios - Listar usuarios (solo para bodega y encargados)
router.get('/usuarios', verificarToken, async (req, res) => {
    try {
        // Si el usuario no es bodega, solo puede ver usuarios de su empresa
        let query = 'SELECT id, nombre, usuario, empresa, ubicacion_id, rol, activo FROM usuarios';
        const params = [];
        if (req.usuario.rol !== 'bodega') {
            query += ' WHERE empresa = $1';
            params.push(req.usuario.empresa);
        }
        query += ' ORDER BY nombre';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error en GET /usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// POST /usuarios - Crear usuario (solo bodega)
router.post('/usuarios', verificarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'bodega') { return res.status(403).json({ error: 'No autorizado' }); }
        const { nombre, usuario, contrasena, empresa, ubicacion_id, rol, activo = true } = req.body;
        if (!nombre || !usuario || !contrasena || !rol) {
            return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, usuario, contraseña y rol' });
        }
        const existe = await pool.query('SELECT id FROM usuarios WHERE usuario = $1', [usuario.toLowerCase()]);
        if (existe.rows.length > 0) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }
        const hash = await bcrypt.hash(contrasena, 10);
        const result = await pool.query(
            `INSERT INTO usuarios (nombre, usuario, contrasena, empresa, ubicacion_id, rol, activo)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             RETURNING id, nombre, usuario, empresa, ubicacion_id, rol, activo`,
            [nombre, usuario.toLowerCase(), hash, empresa || null, ubicacion_id || null, rol, activo]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error en POST /usuarios:', error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// PUT /usuarios/:id - Actualizar usuario (solo bodega)
router.put('/usuarios/:id', verificarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'bodega') { return res.status(403).json({ error: 'No autorizado' }); }
        const { id } = req.params;
        const { nombre, empresa, ubicacion_id, rol, activo, contrasena } = req.body;
        const fields = [];
        const values = [];
        let idx = 1;
        if (nombre !== undefined) { fields.push(`nombre = $${idx++}`); values.push(nombre); }
        if (empresa !== undefined) { fields.push(`empresa = $${idx++}`); values.push(empresa || null); }
        if (ubicacion_id !== undefined) { fields.push(`ubicacion_id = $${idx++}`); values.push(ubicacion_id || null); }
        if (rol !== undefined) { fields.push(`rol = $${idx++}`); values.push(rol); }
        if (activo !== undefined) { fields.push(`activo = $${idx++}`); values.push(activo); }
        if (contrasena) { fields.push(`contrasena = $${idx++}`); values.push(await bcrypt.hash(contrasena, 10)); }
        if (fields.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });
        const result = await pool.query(
            `UPDATE usuarios SET ${fields.join(', ')} WHERE id = $${idx}
             RETURNING id, nombre, usuario, empresa, ubicacion_id, rol, activo`,
            [...values, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error en PUT /usuarios:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

// DELETE /usuarios/:id - Desactivar usuario (solo bodega)
router.delete('/usuarios/:id', verificarToken, async (req, res) => {
    try {
        if (req.usuario.rol !== 'bodega') { return res.status(403).json({ error: 'No autorizado' }); }
        const { id } = req.params;
        const result = await pool.query(
            `UPDATE usuarios SET activo = false WHERE id = $1
             RETURNING id, nombre, usuario, empresa, ubicacion_id, rol, activo`,
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ message: 'Usuario desactivado', usuario: result.rows[0] });
    } catch (error) {
        console.error('Error en DELETE /usuarios:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});


module.exports = router;