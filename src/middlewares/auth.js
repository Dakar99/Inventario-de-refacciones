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
<<<<<<< HEAD
    // El resto de peticiones sigue usando Authorization: Bearer.
=======
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
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

<<<<<<< HEAD
=======
// Solo bodega
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
function requireBodega(req, res, next) {
    if (req.usuario?.rol !== 'bodega') {
        return res.status(403).json({ error: 'No autorizado' });
    }
    return next();
}

<<<<<<< HEAD
module.exports = { verificarToken, requireBodega };
=======
// Bodega y encargado pueden acceder a reportes
function requireReportes(req, res, next) {
    if (!['bodega', 'encargado'].includes(req.usuario?.rol)) {
        return res.status(403).json({ error: 'No autorizado para generar reportes' });
    }
    return next();
}

module.exports = {
    verificarToken,
    requireBodega,
    requireReportes
};
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
