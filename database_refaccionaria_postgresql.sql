-- =========================================================
-- BASE DE DATOS POSTGRESQL - SISTEMA REFACCIONARIA
-- =========================================================
-- Uso recomendado en pgAdmin:
-- 1. Crear la base de datos: refaccionaria
-- 2. Seleccionar la base refaccionaria
-- 3. Abrir Query Tool
-- 4. Ejecutar este script completo
--
-- Usuario inicial:
--   usuario: bodega
--   contraseña: 1234
-- =========================================================

-- Limpiar tablas si ya existen
DROP TABLE IF EXISTS movimiento_items CASCADE;
DROP TABLE IF EXISTS movimientos CASCADE;
DROP TABLE IF EXISTS alertas CASCADE;
DROP TABLE IF EXISTS equipos CASCADE;
DROP TABLE IF EXISTS refacciones CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS ubicaciones CASCADE;

-- Limpiar tipos ENUM si ya existen
DROP TYPE IF EXISTS empresa_tipo CASCADE;
DROP TYPE IF EXISTS ubicacion_tipo CASCADE;
DROP TYPE IF EXISTS rol_usuario CASCADE;
DROP TYPE IF EXISTS movimiento_tipo CASCADE;
DROP TYPE IF EXISTS estado_movimiento CASCADE;

-- Tipos ENUM
CREATE TYPE empresa_tipo AS ENUM ('tecomatlan', 'paraiso');
CREATE TYPE ubicacion_tipo AS ENUM ('planta', 'sucursal', 'estacion');
CREATE TYPE rol_usuario AS ENUM ('bodega', 'encargado', 'solicitante');
CREATE TYPE movimiento_tipo AS ENUM ('entrada', 'salida');
CREATE TYPE estado_movimiento AS ENUM ('pendiente', 'completada', 'rechazada');

-- =========================================================
-- TABLA: ubicaciones
-- =========================================================
CREATE TABLE ubicaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    empresa empresa_tipo NOT NULL,
    tipo ubicacion_tipo NOT NULL,
    razon_social VARCHAR(200) DEFAULT '',
    domicilio TEXT DEFAULT '',
    permiso VARCHAR(120) DEFAULT '',
    telefono VARCHAR(50) DEFAULT '',
    encargado VARCHAR(150) DEFAULT '',
    notas TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLA: usuarios
-- =========================================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    usuario VARCHAR(80) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    empresa empresa_tipo NULL,
    ubicacion_id INT NULL REFERENCES ubicaciones(id) ON DELETE SET NULL,
    rol rol_usuario NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLA: refacciones
-- =========================================================
CREATE TABLE refacciones (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(60) NOT NULL UNIQUE,
    nombre VARCHAR(160) NOT NULL,
    descripcion TEXT DEFAULT '',
    categoria VARCHAR(80) NOT NULL,
    para_que_es VARCHAR(200) DEFAULT '',
    cantidad INT NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    stock_minimo INT NOT NULL DEFAULT 2 CHECK (stock_minimo >= 0),
    precio NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
    empresa empresa_tipo NOT NULL,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLA: equipos
-- =========================================================
CREATE TABLE equipos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    ubicacion_id INT NULL REFERENCES ubicaciones(id) ON DELETE SET NULL,
    empresa empresa_tipo NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLA: movimientos
-- =========================================================
CREATE TABLE movimientos (
    id SERIAL PRIMARY KEY,
    tipo movimiento_tipo NOT NULL,
    numero_nota VARCHAR(40) NOT NULL UNIQUE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    empresa empresa_tipo NOT NULL,
    origen VARCHAR(200) DEFAULT '',
    ubicacion_destino_id INT NULL REFERENCES ubicaciones(id) ON DELETE SET NULL,
    solicitante_id INT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    observaciones TEXT DEFAULT '',
    estado estado_movimiento NOT NULL DEFAULT 'pendiente',
    equipo_id INT NULL REFERENCES equipos(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLA: movimiento_items
-- =========================================================
CREATE TABLE movimiento_items (
    id SERIAL PRIMARY KEY,
    movimiento_id INT NOT NULL REFERENCES movimientos(id) ON DELETE CASCADE,
    refaccion_id INT NOT NULL REFERENCES refacciones(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
    foto_url TEXT DEFAULT '',
    tipo_refaccion VARCHAR(30) DEFAULT 'nueva',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLA: alertas
-- =========================================================
CREATE TABLE alertas (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo VARCHAR(40) NOT NULL,
    mensaje TEXT NOT NULL,
    empresa empresa_tipo NULL,
    usuario_id INT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- ÍNDICES
-- =========================================================
CREATE INDEX idx_ubicaciones_empresa ON ubicaciones(empresa);
CREATE INDEX idx_usuarios_usuario ON usuarios(usuario);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_refacciones_empresa ON refacciones(empresa);
CREATE INDEX idx_refacciones_categoria ON refacciones(categoria);
CREATE INDEX idx_refacciones_codigo ON refacciones(codigo);
CREATE INDEX idx_equipos_empresa ON equipos(empresa);
CREATE INDEX idx_equipos_ubicacion ON equipos(ubicacion_id);
CREATE INDEX idx_movimientos_tipo_estado ON movimientos(tipo, estado);
CREATE INDEX idx_movimientos_fecha ON movimientos(fecha);
CREATE INDEX idx_movimiento_items_movimiento ON movimiento_items(movimiento_id);
CREATE INDEX idx_movimiento_items_refaccion ON movimiento_items(refaccion_id);
CREATE INDEX idx_alertas_leida ON alertas(leida);
CREATE INDEX idx_alertas_empresa ON alertas(empresa);

-- =========================================================
-- DATOS INICIALES: ubicaciones
-- =========================================================
INSERT INTO ubicaciones (id, nombre, empresa, tipo, razon_social, domicilio, permiso, telefono, encargado, notas) VALUES
(1,'Planta Tecomatlan','tecomatlan','planta','Gas Tecomatlan S.A. de C.V.','Carretera Federal 180 Km 42, Tecomatlan, Puebla','CRE-PT-2024-0012','222-123-4567','Juan Perez Garcia','Planta principal de distribucion'),
(2,'Sucursal Centro Tecomatlan','tecomatlan','sucursal','Gas Tecomatlan S.A. de C.V.','Av. Reforma No. 156, Col. Centro, Tecomatlan, Puebla','CRE-SC-2024-0034','222-234-5678','Maria Lopez Hernandez','Sucursal de atencion al publico'),
(3,'Estacion Sur Tecomatlan','tecomatlan','estacion','Gas Tecomatlan S.A. de C.V.','Blvd. Sur No. 89, Tecomatlan, Puebla','CRE-ES-2024-0056','222-345-6789','Carlos Ruiz Martinez','Estacion de carburacion vehicular'),
(4,'Planta Paraiso','paraiso','planta','Gas El Paraiso S.A. de C.V.','Km 15 Camino Real, El Paraiso, Puebla','CRE-PP-2024-0078','222-456-7890','Ana Diaz Flores','Planta de llenado y distribucion'),
(5,'Estacion Oriente Paraiso','paraiso','estacion','Gas El Paraiso S.A. de C.V.','Av. Oriente No. 234, El Paraiso, Puebla','CRE-EP-2024-0090','222-567-8901','Pedro Sanchez Luna','Estacion de carburacion');

-- =========================================================
-- DATOS INICIALES: usuarios
-- NOTA: Si tu backend usa bcrypt, estas contraseñas planas podrían no funcionar.
-- En ese caso hay que insertar contraseñas encriptadas o ajustar el login.
-- =========================================================
INSERT INTO usuarios (id, nombre, usuario, contrasena, empresa, ubicacion_id, rol, activo) VALUES
(1,'Bodeguero Administrador','bodega','1234',NULL,NULL,'bodega',TRUE),
(2,'Juan Perez Garcia','juan','1234','tecomatlan',1,'encargado',TRUE),
(3,'Maria Lopez Hernandez','maria','1234','tecomatlan',2,'solicitante',TRUE),
(4,'Carlos Ruiz Martinez','carlos','1234','tecomatlan',3,'solicitante',TRUE),
(5,'Ana Diaz Flores','ana','1234','paraiso',4,'encargado',TRUE),
(6,'Pedro Sanchez Luna','pedro','1234','paraiso',5,'solicitante',TRUE);

-- =========================================================
-- DATOS INICIALES: refacciones
-- =========================================================
INSERT INTO refacciones (id, codigo, nombre, descripcion, categoria, para_que_es, cantidad, stock_minimo, precio, empresa, fecha_registro) VALUES
(1,'PIP-001','Valvula de seguridad 3/4"','Valvula de alivio de presion para pipa','pipa','Pipa - Sistema de seguridad',12,5,450,'tecomatlan','2024-11-15'),
(2,'PIP-002','Manometro 0-300 PSI','Manometro de presion para pipa','pipa','Pipa - Medicion de presion',3,4,280,'tecomatlan','2024-11-15'),
(3,'PLA-001','Filtro de gas tipo Y','Filtro para linea de gas de planta','planta','Planta - Filtrado de gas',8,3,1200,'tecomatlan','2024-11-16'),
(4,'PLA-002','Regulador de presion 10 PSI','Regulador para planta','planta','Planta - Regulacion de presion',2,2,3500,'tecomatlan','2024-11-16'),
(5,'TRA-001','Llave de paso 2" BRONCE','Llave de bola para trailer','trailer','Trailer - Corte de flujo',6,3,890,'tecomatlan','2024-11-17'),
(6,'TAN-001','Flotador de nivel','Flotador para tanque de carburacion','tanque_carburacion','Tanque de carburacion - Control de nivel',1,2,2100,'tecomatlan','2024-11-17'),
(7,'VAL-001','Valvula check 1" SS','Valvula de retencion inoxidable','valvulas','General - Antirretorno',15,5,670,'tecomatlan','2024-11-18'),
(8,'MAN-001','Manguera flexible 2m 3/4"','Manguera de alta presion','mangueras','Pipa/Planta - Conexion flexible',10,5,520,'tecomatlan','2024-11-18'),
(9,'PIP-003','Cierre de seguridad 5/8"','Cierre magnetico para pipa','pipa','Pipa - Dispositivo de seguridad',7,4,1800,'paraiso','2024-11-19'),
(10,'PLA-003','Sensor de presion digital','Sensor con display para planta','planta','Planta - Monitoreo de presion',4,2,4200,'paraiso','2024-11-19'),
(11,'TRA-002','Tapa de domo con cierre','Tapa de seguridad para trailer','trailer','Trailer - Cierre de domo',0,2,1500,'paraiso','2024-11-20'),
(12,'TAN-002','Valvula de drenaje 1/2"','Valvula para drenaje de tanque','tanque_carburacion','Tanque de carburacion - Drenaje',5,2,380,'paraiso','2024-11-20');

-- =========================================================
-- DATOS INICIALES: equipos
-- =========================================================
INSERT INTO equipos (id, nombre, tipo, ubicacion_id, empresa, activo) VALUES
(1,'Pipa 01','pipa',1,'tecomatlan',TRUE),
(2,'Trailer 12','trailer',3,'tecomatlan',TRUE),
(3,'Estacion Oriente','estacion',5,'paraiso',TRUE),
(4,'Pipa 02','pipa',4,'paraiso',TRUE);

-- =========================================================
-- DATOS INICIALES: movimientos
-- =========================================================
INSERT INTO movimientos (id, tipo, numero_nota, fecha, empresa, origen, ubicacion_destino_id, solicitante_id, observaciones, estado, equipo_id) VALUES
(1,'entrada','ENT-2024-001','2024-12-01','tecomatlan','Proveedor: Valvulas del Norte S.A.',NULL,1,'Reposicion mensual','completada',NULL),
(2,'salida','SAL-2024-001','2024-12-03','tecomatlan','Bodega Central',1,2,'Surtido para mantenimiento de pipas','completada',1),
(3,'salida','SAL-2024-002','2024-12-05','tecomatlan','Bodega Central',3,4,'Reemplazo en trailer unidad 12','pendiente',2),
(4,'entrada','ENT-2024-002','2024-12-06','paraiso','Proveedor: Mangueras Industriales',NULL,1,'Entrada de refacciones de seguridad','completada',NULL),
(5,'salida','SAL-2024-003','2024-12-08','paraiso','Bodega Central',5,6,'Sensor para estacion','pendiente',3);

-- =========================================================
-- DATOS INICIALES: movimiento_items
-- =========================================================
INSERT INTO movimiento_items (id, movimiento_id, refaccion_id, cantidad, precio_unitario, foto_url, tipo_refaccion) VALUES
(1,1,1,10,450,'','nueva'),
(2,1,7,8,670,'','nueva'),
(3,2,2,2,280,'','nueva'),
(4,2,8,3,520,'','nueva'),
(5,3,5,2,890,'','nueva'),
(6,4,9,5,1800,'','nueva'),
(7,4,12,5,380,'','nueva'),
(8,5,10,1,4200,'','nueva');

-- =========================================================
-- DATOS INICIALES: alertas
-- =========================================================
INSERT INTO alertas (id, tipo, mensaje, empresa, usuario_id, leida, fecha) VALUES
(1,'stock','Tapa de domo con cierre (TRA-002) en 0 unidades - Stock critico','paraiso',NULL,FALSE,'2024-12-08 09:15:00'),
(2,'stock','Flotador de nivel (TAN-001) con solo 1 unidad - Stock bajo','tecomatlan',NULL,FALSE,'2024-12-07 16:45:00'),
(3,'solicitud','Pedro Sanchez solicito 1 Sensor de presion digital para Estacion Oriente Paraiso','paraiso',6,FALSE,'2024-12-08 10:30:00'),
(4,'solicitud','Carlos Ruiz solicito 2 Llaves de paso 2" BRONCE para Estacion Sur','tecomatlan',4,FALSE,'2024-12-07 14:20:00'),
(5,'entrada','Entrada registrada: 5 Cierres de seguridad y 5 Valvulas de drenaje','paraiso',NULL,TRUE,'2024-12-06 11:00:00');

-- =========================================================
-- ACTUALIZAR SECUENCIAS
-- =========================================================
SELECT setval('ubicaciones_id_seq', COALESCE((SELECT MAX(id) FROM ubicaciones), 1), true);
SELECT setval('usuarios_id_seq', COALESCE((SELECT MAX(id) FROM usuarios), 1), true);
SELECT setval('refacciones_id_seq', COALESCE((SELECT MAX(id) FROM refacciones), 1), true);
SELECT setval('equipos_id_seq', COALESCE((SELECT MAX(id) FROM equipos), 1), true);
SELECT setval('movimientos_id_seq', COALESCE((SELECT MAX(id) FROM movimientos), 1), true);
SELECT setval('movimiento_items_id_seq', COALESCE((SELECT MAX(id) FROM movimiento_items), 1), true);
SELECT setval('alertas_id_seq', COALESCE((SELECT MAX(id) FROM alertas), 1), true);

-- =========================================================
-- FIN
-- =========================================================
