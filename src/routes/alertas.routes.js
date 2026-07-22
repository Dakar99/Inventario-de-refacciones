const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verificarToken } = require('../middlewares/auth');


// ENDPOINTS DE ALERTAS
<<<<<<< HEAD
router.get('/api/alertas', verificarToken, async (req, res) => {
=======
router.get('/alertas', verificarToken, async (req, res) => {
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
    try {
        const params = [];
        let query = 'SELECT * FROM alertas WHERE 1=1';
        if (req.usuario.rol !== 'bodega') {
            params.push(req.usuario.empresa);
            query += ` AND (empresa = $${params.length} OR empresa IS NULL)`;
        }
        query += ' ORDER BY fecha DESC, id DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error en GET /alertas:', error);
        res.status(500).json({ error: 'Error al obtener alertas' });
    }
});

<<<<<<< HEAD
router.post('/api/alertas/verificar-stock', verificarToken, async (req, res) => {
=======
router.post('/alertas/verificar-stock', verificarToken, async (req, res) => {
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
    try {
        if (req.usuario.rol !== 'bodega') {
    return res.status(403).json({
        error: 'No autorizado'
    });
}
        const bajas = await pool.query('SELECT codigo, nombre, cantidad, stock_minimo, empresa FROM refacciones WHERE cantidad <= stock_minimo');
        let creadas = 0;
        for (const r of bajas.rows) {
            const yaExiste = await pool.query(
                `SELECT id FROM alertas WHERE tipo = 'stock' AND mensaje ILIKE $1 AND fecha > NOW() - INTERVAL '24 hours'`,
                [`%${r.codigo}%`]
            );
            if (yaExiste.rows.length === 0) {
                await pool.query(
                    `INSERT INTO alertas (tipo, mensaje, empresa, leida, fecha)
                     VALUES ('stock', $1, $2, false, NOW())`,
                    [`${r.nombre} (${r.codigo}) en ${r.cantidad} unidades - ${r.cantidad <= 0 ? 'AGOTADO' : 'Stock bajo'}`, r.empresa]
                );
                creadas++;
            }
        }
        res.json({ message: 'Stock verificado', creadas });
    } catch (error) {
        console.error('Error en POST /alertas/verificar-stock:', error);
        res.status(500).json({ error: 'Error al verificar stock' });
    }
});

<<<<<<< HEAD
router.put('/api/alertas/:id/leida', verificarToken, async (req, res) => {
=======
router.put('/alertas/:id/leida', verificarToken, async (req, res) => {
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
    try {
        const result = await pool.query('UPDATE alertas SET leida = true WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Alerta no encontrada' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error en PUT /alertas/leida:', error);
        res.status(500).json({ error: 'Error al marcar alerta' });
    }
});

<<<<<<< HEAD
router.put('/api/alertas/marcar-todas/leidas', verificarToken, async (req, res) => {
=======
router.put('/alertas/marcar-todas/leidas', verificarToken, async (req, res) => {
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
    try {
        const params = [];
        let query = 'UPDATE alertas SET leida = true WHERE leida = false';
        if (req.usuario.rol !== 'bodega') {
            params.push(req.usuario.empresa);
            query += ` AND (empresa = $${params.length} OR empresa IS NULL)`;
        }
        const result = await pool.query(query + ' RETURNING id', params);
        res.json({ message: 'Alertas marcadas como leídas', total: result.rowCount });
    } catch (error) {
        console.error('Error en PUT /alertas/marcar-todas:', error);
        res.status(500).json({ error: 'Error al marcar alertas' });
    }
});

// ENDPOINTS DE EQUIPOS

<<<<<<< HEAD
// GET /api/equipos - Listar equipos (con filtros)
=======
// GET /equipos - Listar equipos (con filtros)
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95

module.exports = router;
