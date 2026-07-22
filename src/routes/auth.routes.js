const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { pool } = require('../config/db');
const { esHashBcrypt } = require('../utils/password');

router.post('/api/auth/login', async (req, res) => {
    try {
        // Imprimir el body para depuración
        console.log('Body recibido:', req.body);

        const { usuario, contrasena } = req.body;
        if (!usuario || !contrasena) {
            return res.status(400).json({ error: 'Faltan usuario o contraseña' });
        }

        // Buscar usuario en la base de datos
        const result = await pool.query(
            'SELECT id, nombre, usuario, contrasena, empresa, ubicacion_id, rol, activo FROM usuarios WHERE usuario = $1',
            [usuario.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const user = result.rows[0];

        if (!user.activo) {
            return res.status(401).json({ error: 'Usuario desactivado' });
        }

        // Comparar contraseña. Soporta hashes bcrypt y, temporalmente, contraseñas antiguas en texto plano.
        const passwordOk = esHashBcrypt(user.contrasena)
            ? await bcrypt.compare(contrasena, user.contrasena)
            : contrasena === user.contrasena;
        if (!passwordOk) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Migración automática: si la contraseña estaba en texto plano, se guarda con bcrypt.
        if (!esHashBcrypt(user.contrasena)) {
            const nuevoHash = await bcrypt.hash(contrasena, 10);
            await pool.query('UPDATE usuarios SET contrasena = $1 WHERE id = $2', [nuevoHash, user.id]);
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, usuario: user.usuario, rol: user.rol, empresa: user.empresa, ubicacion_id: user.ubicacion_id },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        const { contrasena: _, ...userData } = user;
        res.json({
            token,
            usuario: userData,
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor', detalle: error.message });
    }
});


module.exports = router;
