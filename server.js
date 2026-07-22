require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { verificarConexion } = require('./src/config/db');
const { notFound, errorHandler } = require('./src/middlewares/errorHandler');

const authRoutes = require('./src/routes/auth.routes');
const healthRoutes = require('./src/routes/health.routes');
const refaccionesRoutes = require('./src/routes/refacciones.routes');
const usuariosRoutes = require('./src/routes/usuarios.routes');
const alertasRoutes = require('./src/routes/alertas.routes');
const equiposRoutes = require('./src/routes/equipos.routes');
const ubicacionesRoutes = require('./src/routes/ubicaciones.routes');
const movimientosRoutes = require('./src/routes/movimientos.routes');
const reportesRoutes = require('./src/routes/reportes.routes');

const app = express();
const PORT = process.env.PORT || 7549;

//app.listen(PORT, "0.0.0.0", () => {
//    console.log(`Servidor iniciado en http://localhost:${PORT}`);
//});

app.use(helmet({
    contentSecurityPolicy: false
}));

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    message: {
        error: 'Demasiadas solicitudes, intenta más tarde'
    }
}));

app.use(cors({
    origin: [
        //'http://localhost:3000',
        'http://localhost:7549',
        'http://100.94.107.84:7549'
    ],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log para depuración
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use('/api', authRoutes);
app.use('/api', healthRoutes);
app.use('/api', refaccionesRoutes);
app.use('/api', usuariosRoutes);
app.use('/api', alertasRoutes);
app.use('/api', equiposRoutes);
app.use('/api', ubicacionesRoutes);
app.use('/api', movimientosRoutes);
app.use('/api', reportesRoutes);

// Permite abrir el frontend desde http://100.94.107.84:7549/
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

async function iniciarServidor() {
    try {
        await verificarConexion();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error conectando a PostgreSQL:', error);
        process.exit(1);
    }
}

iniciarServidor();

module.exports = app;