const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader) {
        const [tipo, valor] = authHeader.split(' ');
        if (tipo !== 'Bearer' || !valor) {
            return res.status(401).json({ error: 'Formato de token inválido' });
        }
        token = valor;
    }

    // Permite descargas directas de reportes desde window.open().
    // El resto de peticiones sigue usando Authorization: Bearer.
    if (!token && req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET);
        return next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado' });
    }
}

function requireBodega(req, res, next) {
    if (req.usuario?.rol !== 'bodega') {
        return res.status(403).json({ error: 'No autorizado' });
    }
    return next();
}

module.exports = { verificarToken, requireBodega };
