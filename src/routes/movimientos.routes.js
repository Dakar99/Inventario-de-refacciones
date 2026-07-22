<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verificarToken } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');


router.get('/api/movimientos', verificarToken, async (req, res) => {
    try {
        const { tipo, empresa, estado } = req.query;
        let query = `
=======
const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const { verificarToken } = require("../middlewares/auth");
const { upload } = require("../middlewares/upload");
const {
  alertaNuevaSolicitud,
  alertaNuevaEntrada,
} = require("../services/telegram.service");
const { alertaCambioEstado } = require("../services/telegram.service");

router.get("/movimientos", verificarToken, async (req, res) => {
  try {
    const { tipo, empresa, estado } = req.query;
    let query = `
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
            SELECT m.*, 
                   u.nombre as solicitante_nombre,
                   u.empresa as solicitante_empresa,
                   ubi.nombre as ubicacion_nombre,
                   eq.nombre as equipo_nombre,
                   COALESCE(
                       (SELECT SUM(mi.cantidad) FROM movimiento_items mi WHERE mi.movimiento_id = m.id), 
                       0
                   ) as total_items,
                   COALESCE(
                       (SELECT SUM(mi.cantidad * mi.precio_unitario) FROM movimiento_items mi WHERE mi.movimiento_id = m.id), 
                       0
                   ) as total_monto
            FROM movimientos m
            LEFT JOIN usuarios u ON m.solicitante_id = u.id
            LEFT JOIN ubicaciones ubi ON m.ubicacion_destino_id = ubi.id
            LEFT JOIN equipos eq ON m.equipo_id = eq.id
            WHERE 1=1
        `;
<<<<<<< HEAD
        const params = [];
        let idx = 1;

        if (tipo) {
            query += ` AND m.tipo = $${idx}`;
            params.push(tipo);
            idx++;
        }
        if (empresa) {
            query += ` AND m.empresa = $${idx}`;
            params.push(empresa);
            idx++;
        }
        if (estado) {
            query += ` AND m.estado = $${idx}`;
            params.push(estado);
            idx++;
        }

        // Si el usuario no es bodega, solo ver movimientos de su empresa
        if (req.usuario.rol !== 'bodega') {
            query += ` AND m.empresa = $${idx}`;
            params.push(req.usuario.empresa);
            idx++;
        }

        query += ` ORDER BY m.fecha DESC, m.id DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error en GET /movimientos:', error);
        res.status(500).json({ error: 'Error al obtener movimientos', detalle: error.message });
    }
});
// GET /api/movimientos/:id - Obtener detalle con items
router.get('/api/movimientos/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Obtener el movimiento
        const movResult = await pool.query(`
=======
    const params = [];
    let idx = 1;

    if (tipo) {
      query += ` AND m.tipo = $${idx}`;
      params.push(tipo);
      idx++;
    }
    if (empresa) {
      query += ` AND m.empresa = $${idx}`;
      params.push(empresa);
      idx++;
    }
    if (estado) {
      query += ` AND m.estado = $${idx}`;
      params.push(estado);
      idx++;
    }

    // Si el usuario no es bodega, solo ver movimientos de su empresa
    if (req.usuario.rol !== "bodega") {
      query += ` AND m.empresa = $${idx}`;
      params.push(req.usuario.empresa);
      idx++;
    }

    query += ` ORDER BY m.fecha DESC, m.id DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error en GET /movimientos:", error);
    res
      .status(500)
      .json({ error: "Error al obtener movimientos", detalle: error.message });
  }
});
// GET /movimientos/:id - Obtener detalle con items
router.get("/movimientos/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Obtener el movimiento
    const movResult = await pool.query(
      `
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
            SELECT m.*, 
                   u.nombre as solicitante_nombre,
                   u.empresa as solicitante_empresa,
                   ubi.nombre as ubicacion_nombre
            FROM movimientos m
            LEFT JOIN usuarios u ON m.solicitante_id = u.id
            LEFT JOIN ubicaciones ubi ON m.ubicacion_destino_id = ubi.id
            WHERE m.id = $1
<<<<<<< HEAD
        `, [id]);

        if (req.usuario.rol !== 'bodega' && req.usuario.rol !== 'encargado') {
            return res.status(403).json({ error: 'No autorizado' });
        }
        if (movResult.rows.length === 0) {
            return res.status(404).json({ error: 'Movimiento no encontrado' });
        }

        const movimiento = movResult.rows[0];

        // Obtener los items
        const itemsResult = await pool.query(`
=======
        `,
      [id],
    );

    if (req.usuario.rol !== "bodega" && req.usuario.rol !== "encargado") {
      return res.status(403).json({ error: "No autorizado" });
    }
    if (movResult.rows.length === 0) {
      return res.status(404).json({ error: "Movimiento no encontrado" });
    }

    const movimiento = movResult.rows[0];

    // Obtener los items
    const itemsResult = await pool.query(
      `
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
            SELECT mi.*, r.codigo, r.nombre as refaccion_nombre, r.categoria
            FROM movimiento_items mi
            JOIN refacciones r ON mi.refaccion_id = r.id
            WHERE mi.movimiento_id = $1
<<<<<<< HEAD
        `, [id]);

        movimiento.items = itemsResult.rows;
        res.json(movimiento);
    } catch (error) {
        console.error('Error en GET /movimientos/:id:', error);
        res.status(500).json({ error: 'Error al obtener detalle' });
    }
});
// POST /api/movimientos - Crear movimiento con fotos
router.post('/api/movimientos', verificarToken, upload.array('fotos', 20), async (req, res) => {
    const client = await pool.connect();
    try {
        // Los datos del formulario vienen en req.body (texto) y req.files (archivos)
        const { tipo, empresa, origen, observaciones } = req.body;
	let { ubicacion_destino_id, solicitante_id, equipo_id } = req.body;

	// Convertir cadenas vacías a null
	ubicacion_destino_id = ubicacion_destino_id || null;
	solicitante_id = solicitante_id || null;
	equipo_id = equipo_id || null;
	// items viene como string JSON (porque enviamos un array de objetos)
        let items = [];
        try {
            items = JSON.parse(req.body.items);
        } catch (e) {
            return res.status(400).json({ error: 'Formato de items inválido' });
        }

        if (!tipo || !['entrada', 'salida'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo inválido' });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Debe incluir al menos un ítem' });
        }

        // Validar stock para salidas
        if (tipo === 'salida') {
            for (const it of items) {
                const stockRes = await client.query('SELECT cantidad FROM refacciones WHERE id = $1', [it.refaccion_id]);
                if (stockRes.rows.length === 0) {
                    return res.status(404).json({ error: `Refacción con id ${it.refaccion_id} no existe` });
                }
                if (stockRes.rows[0].cantidad < it.cantidad) {
                    const ref = await client.query('SELECT nombre FROM refacciones WHERE id = $1', [it.refaccion_id]);
                    return res.status(400).json({ error: `Stock insuficiente para "${ref.rows[0].nombre}"` });
                }
            }
        }

        // Generar número de nota
        const year = new Date().getFullYear();
        const prefix = tipo === 'entrada' ? 'ENT' : 'SAL';
        const countRes = await client.query(
            `SELECT COUNT(*) FROM movimientos WHERE tipo = $1 AND EXTRACT(YEAR FROM fecha) = $2`,
            [tipo, year]
        );
        const count = parseInt(countRes.rows[0].count) + 1;
        const numero_nota = `${prefix}-${year}-${String(count).padStart(3, '0')}`;
        const estado = tipo === 'entrada' ? 'completada' : 'pendiente';

        await client.query('BEGIN');

        // Insertar movimiento
        const movResult = await client.query(`
=======
        `,
      [id],
    );

    movimiento.items = itemsResult.rows;
    res.json(movimiento);
  } catch (error) {
    console.error("Error en GET /movimientos/:id:", error);
    res.status(500).json({ error: "Error al obtener detalle" });
  }
});
// POST /movimientos - Crear movimiento con fotos
router.post(
  "/movimientos",
  verificarToken,
  upload.array("fotos", 20),
  async (req, res) => {
    const client = await pool.connect();
    try {
      // Los datos del formulario vienen en req.body (texto) y req.files (archivos)
      const { tipo, empresa, origen, observaciones } = req.body;
      let { ubicacion_destino_id, solicitante_id, equipo_id } = req.body;

      // Convertir cadenas vacías a null
      ubicacion_destino_id = ubicacion_destino_id || null;
      solicitante_id = solicitante_id || null;
      equipo_id = equipo_id || null;
      // items viene como string JSON (porque enviamos un array de objetos)
      let items = [];
      try {
        items = JSON.parse(req.body.items);
      } catch (e) {
        return res.status(400).json({ error: "Formato de items inválido" });
      }

      if (!tipo || !["entrada", "salida"].includes(tipo)) {
        return res.status(400).json({ error: "Tipo inválido" });
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Debe incluir al menos un ítem" });
      }

      // Validar stock para salidas
      if (tipo === "salida") {
        for (const it of items) {
          const stockRes = await client.query(
            "SELECT cantidad FROM refacciones WHERE id = $1",
            [it.refaccion_id],
          );
          if (stockRes.rows.length === 0) {
            return res
              .status(404)
              .json({ error: `Refacción con id ${it.refaccion_id} no existe` });
          }
          if (stockRes.rows[0].cantidad < it.cantidad) {
            const ref = await client.query(
              "SELECT nombre FROM refacciones WHERE id = $1",
              [it.refaccion_id],
            );
            return res.status(400).json({
              error: `Stock insuficiente para "${ref.rows[0].nombre}"`,
            });
          }
        }
      }

      // Generar número de nota
      const year = new Date().getFullYear();
      const prefix = tipo === "entrada" ? "ENT" : "SAL";
      const countRes = await client.query(
        `SELECT COUNT(*) FROM movimientos WHERE tipo = $1 AND EXTRACT(YEAR FROM fecha) = $2`,
        [tipo, year],
      );
      const count = parseInt(countRes.rows[0].count) + 1;
      const numero_nota = `${prefix}-${year}-${String(count).padStart(3, "0")}`;
      const estado = tipo === "entrada" ? "completada" : "pendiente";

      await client.query("BEGIN");

      // Insertar movimiento
      const movResult = await client.query(
        `
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
            INSERT INTO movimientos 
            (tipo, numero_nota, fecha, empresa, origen, ubicacion_destino_id, solicitante_id, observaciones, estado, equipo_id)
            VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
<<<<<<< HEAD
        `, [tipo, numero_nota, empresa, origen, ubicacion_destino_id, solicitante_id, observaciones, estado, equipo_id || null]);

        const movimiento = movResult.rows[0];

        // Procesar cada ítem con su foto (si existe)
        for (let i = 0; i < items.length; i++) {
            const it = items[i];
            let precio = it.precio_unitario || 0;
            if (!precio) {
                const refRes = await client.query('SELECT precio FROM refacciones WHERE id = $1', [it.refaccion_id]);
                precio = refRes.rows[0]?.precio || 0;
            }

            // Buscar la foto correspondiente en req.files
            let foto_url = null;
            if (req.files && req.files[i]) {
                foto_url = '/uploads/' + req.files[i].filename;
            }

            // Insertar item
            await client.query(`
                INSERT INTO movimiento_items 
                (movimiento_id, refaccion_id, cantidad, precio_unitario, foto_url, tipo_refaccion)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                movimiento.id,
                it.refaccion_id,
                it.cantidad,
                precio,
                foto_url,
                it.tipo_refaccion || 'nueva'
            ]);

            // Si es entrada, aumentar stock
            if (tipo === 'entrada') {
                await client.query(`
                    UPDATE refacciones 
                    SET cantidad = cantidad + $1 
                    WHERE id = $2
                `, [it.cantidad, it.refaccion_id]);
            }
        }

        await client.query('COMMIT');

        // Obtener el movimiento completo con items para devolver
        const movFinal = await client.query(`
=======
        `,
        [
          tipo,
          numero_nota,
          empresa,
          origen,
          ubicacion_destino_id,
          solicitante_id,
          observaciones,
          estado,
          equipo_id || null,
        ],
      );

      const movimiento = movResult.rows[0];

      // Procesar cada ítem con su foto (si existe)
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        // Obtener el precio escrito por el usuario
        let precio = Number(it.precio_unitario);

        // Si viene vacío, tomar el del inventario
        if (isNaN(precio) || precio <= 0) {
          const refRes = await client.query(
            `SELECT precio
         FROM refacciones
         WHERE id = $1`,
            [it.refaccion_id],
          );

          precio = Number(refRes.rows[0]?.precio || 0);
        }

        // Buscar la foto correspondiente en req.files
        let foto_url = null;
        if (req.files && req.files[i]) {
          foto_url = "/uploads/" + req.files[i].filename;
        }

        // Insertar item
        await client.query(
          `
                INSERT INTO movimiento_items 
                (movimiento_id, refaccion_id, cantidad, precio_unitario, foto_url, tipo_refaccion)
                VALUES ($1, $2, $3, $4, $5, $6)
            `,
          [
            movimiento.id,
            it.refaccion_id,
            it.cantidad,
            precio,
            foto_url,
            it.tipo_refaccion || "nueva",
          ],
        );

        // Si es entrada, aumentar stock
        // Si es entrada, aumentar stock y actualizar el precio
        if (tipo === "entrada") {
          const cantidadEntrada = Number(it.cantidad);
          const precioEntrada = Number(precio);

          if (!Number.isFinite(cantidadEntrada) || cantidadEntrada <= 0) {
            throw new Error("La cantidad de entrada no es válida");
          }

          if (!Number.isFinite(precioEntrada) || precioEntrada < 0) {
            throw new Error("El precio de entrada no es válido");
          }

          const actualizacion = await client.query(
            `
    UPDATE refacciones
    SET
        cantidad = cantidad + $1,
        precio = $2
    WHERE id = $3
    RETURNING id, codigo, nombre, cantidad, precio
    `,
            [cantidadEntrada, precioEntrada, it.refaccion_id],
          );

          if (actualizacion.rows.length === 0) {
            throw new Error("No se encontró la refacción para actualizar.");
          }
        }
      }
      await client.query("COMMIT");

      // Enviar alerta a Telegram
      if (tipo === "salida") {
        // Obtener datos del solicitante y ubicación para el mensaje
        const solicitaRes = await client.query(
          "SELECT nombre FROM usuarios WHERE id = $1",
          [solicitante_id],
        );
        const ubicacionRes = await client.query(
          "SELECT nombre FROM ubicaciones WHERE id = $1",
          [ubicacion_destino_id],
        );
        const movimientoConDetalle = {
          ...movimiento,
          solicitante_nombre: solicitaRes.rows[0]?.nombre,
          ubicacion_nombre: ubicacionRes.rows[0]?.nombre,
          items: items,
        };
        await alertaNuevaSolicitud(movimientoConDetalle, {
          nombre: solicitaRes.rows[0]?.nombre,
        });
      } else if (tipo === "entrada") {
        // También puedes enviar alerta de entrada
        const movimientoConItems = { ...movimiento, items };
        await alertaNuevaEntrada(movimientoConItems);
      }

      // Obtener el movimiento completo con items para devolver
      const movFinal = await client.query(
        `
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
            SELECT m.*, 
                   u.nombre as solicitante_nombre,
                   ubi.nombre as ubicacion_nombre,
                   e.nombre as equipo_nombre
            FROM movimientos m
            LEFT JOIN usuarios u ON m.solicitante_id = u.id
            LEFT JOIN ubicaciones ubi ON m.ubicacion_destino_id = ubi.id
            LEFT JOIN equipos e ON m.equipo_id = e.id
            WHERE m.id = $1
<<<<<<< HEAD
        `, [movimiento.id]);

        const itemsFinal = await client.query(`
=======
        `,
        [movimiento.id],
      );

      const itemsFinal = await client.query(
        `
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
            SELECT mi.*, r.codigo, r.nombre as refaccion_nombre, r.categoria
            FROM movimiento_items mi
            JOIN refacciones r ON mi.refaccion_id = r.id
            WHERE mi.movimiento_id = $1
<<<<<<< HEAD
        `, [movimiento.id]);

        const respuesta = movFinal.rows[0];
        respuesta.items = itemsFinal.rows;

        res.status(201).json(respuesta);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en POST /movimientos:', error);
        res.status(500).json({ error: error.message || 'Error al crear movimiento' });
    } finally {
        client.release();
    }
});
// PUT /api/movimientos/:id/estado - Cambiar estado (solo bodega)
router.put('/api/movimientos/:id/estado', verificarToken, async (req, res) => {
    const client = await pool.connect();
    try {
        if (req.usuario.rol !== 'bodega') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const { id } = req.params;
        const { estado } = req.body;
        if (!estado || !['completada', 'rechazada'].includes(estado)) {
            return res.status(400).json({ error: 'Estado debe ser "completada" o "rechazada"' });
        }

        // Obtener el movimiento actual
        const movRes = await client.query('SELECT * FROM movimientos WHERE id = $1', [id]);
        if (movRes.rows.length === 0) {
            return res.status(404).json({ error: 'Movimiento no encontrado' });
        }
        const movimiento = movRes.rows[0];

        // Solo se puede cambiar si está pendiente
        if (movimiento.estado !== 'pendiente') {
            return res.status(400).json({ error: 'El movimiento ya no está pendiente' });
        }

        // Solo aplica a salidas (las entradas ya se aprueban automáticamente)
        if (movimiento.tipo !== 'salida') {
            return res.status(400).json({ error: 'Solo se pueden aprobar/rechazar salidas' });
        }

        await client.query('BEGIN');

        if (estado === 'completada') {
            // Descontar stock de cada item
            const itemsRes = await client.query('SELECT * FROM movimiento_items WHERE movimiento_id = $1', [id]);
            for (const item of itemsRes.rows) {
                const stockRes = await client.query('SELECT cantidad FROM refacciones WHERE id = $1', [item.refaccion_id]);
                if (stockRes.rows.length === 0) {
                    throw new Error(`Refacción con id ${item.refaccion_id} no encontrada`);
                }
                if (stockRes.rows[0].cantidad < item.cantidad) {
                    const ref = await client.query('SELECT nombre FROM refacciones WHERE id = $1', [item.refaccion_id]);
                    throw new Error(`Stock insuficiente para "${ref.rows[0].nombre}"`);
                }
                await client.query(
                    'UPDATE refacciones SET cantidad = cantidad - $1 WHERE id = $2',
                    [item.cantidad, item.refaccion_id]
                );
            }
        }

        // Actualizar estado
        await client.query('UPDATE movimientos SET estado = $1 WHERE id = $2', [estado, id]);

        await client.query('COMMIT');

        res.json({ message: `Movimiento ${estado}`, id });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en PUT /movimientos/estado:', error);
        res.status(500).json({ error: error.message || 'Error al cambiar estado' });
    } finally {
        client.release();
    }
=======
        `,
        [movimiento.id],
      );

      const respuesta = movFinal.rows[0];
      respuesta.items = itemsFinal.rows;

      res.status(201).json(respuesta);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error en POST /movimientos:", error);
      res
        .status(500)
        .json({ error: error.message || "Error al crear movimiento" });
    } finally {
      client.release();
    }
  },
);
// PUT /movimientos/:id/estado - Cambiar estado (solo bodega)
router.put("/movimientos/:id/estado", verificarToken, async (req, res) => {
  const client = await pool.connect();
  try {
    if (req.usuario.rol !== "bodega") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { id } = req.params;
    const { estado } = req.body;
    if (!estado || !["completada", "rechazada"].includes(estado)) {
      return res
        .status(400)
        .json({ error: 'Estado debe ser "completada" o "rechazada"' });
    }

    // Obtener el movimiento actual
    const movRes = await client.query(
      "SELECT * FROM movimientos WHERE id = $1",
      [id],
    );
    if (movRes.rows.length === 0) {
      return res.status(404).json({ error: "Movimiento no encontrado" });
    }
    const movimiento = movRes.rows[0];

    // Solo se puede cambiar si está pendiente
    if (movimiento.estado !== "pendiente") {
      return res
        .status(400)
        .json({ error: "El movimiento ya no está pendiente" });
    }

    // Solo aplica a salidas (las entradas ya se aprueban automáticamente)
    if (movimiento.tipo !== "salida") {
      return res
        .status(400)
        .json({ error: "Solo se pueden aprobar/rechazar salidas" });
    }

    await client.query("BEGIN");

    if (estado === "completada") {
      // Descontar stock de cada item
      const itemsRes = await client.query(
        "SELECT * FROM movimiento_items WHERE movimiento_id = $1",
        [id],
      );
      for (const item of itemsRes.rows) {
        const stockRes = await client.query(
          "SELECT cantidad FROM refacciones WHERE id = $1",
          [item.refaccion_id],
        );
        if (stockRes.rows.length === 0) {
          throw new Error(
            `Refacción con id ${item.refaccion_id} no encontrada`,
          );
        }
        if (stockRes.rows[0].cantidad < item.cantidad) {
          const ref = await client.query(
            "SELECT nombre FROM refacciones WHERE id = $1",
            [item.refaccion_id],
          );
          throw new Error(`Stock insuficiente para "${ref.rows[0].nombre}"`);
        }
        await client.query(
          "UPDATE refacciones SET cantidad = cantidad - $1 WHERE id = $2",
          [item.cantidad, item.refaccion_id],
        );
      }
    }

    // Actualizar estado
    await client.query("UPDATE movimientos SET estado = $1 WHERE id = $2", [
      estado,
      id,
    ]);

    await client.query("COMMIT");

    // Enviar alerta a Telegram
    if (movimiento.tipo === "salida") {
      // Obtener datos completos del movimiento para el mensaje
      const movCompleto = await client.query(
        `
        SELECT m.*, u.nombre as solicitante_nombre
        FROM movimientos m
        LEFT JOIN usuarios u ON m.solicitante_id = u.id
        WHERE m.id = $1
    `,
        [id],
      );
      await alertaCambioEstado(movCompleto.rows[0], estado);
    }

    res.json({ message: `Movimiento ${estado}`, id });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en PUT /movimientos/estado:", error);
    res.status(500).json({ error: error.message || "Error al cambiar estado" });
  } finally {
    client.release();
  }
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95
});

module.exports = router;
