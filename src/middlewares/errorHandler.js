function notFound(req, res) {
    res.status(404).json({ error: 'Ruta no encontrada' });
}

function errorHandler(error, req, res, next) {
    console.error('Error no controlado:', error);
    res.status(error.status || 500).json({ error: error.message || 'Error interno del servidor' });
}

module.exports = { notFound, errorHandler };
