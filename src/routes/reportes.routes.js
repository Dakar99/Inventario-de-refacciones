const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const {
  verificarToken,
  requireReportes
} = require('../middlewares/auth');
const { crearPdfReporte } = require('../services/pdfReportes.service');

function aplicarFiltrosMovimiento(base, params, filtros, usuario) {
  let query = base;
  let idx = params.length + 1;
  const { fechaInicio, fechaFin, empresa, texto } = filtros;

  if (fechaInicio) {
    query += ` AND m.fecha >= $${idx}`;
    params.push(fechaInicio);
    idx++;
  }
  if (fechaFin) {
    query += ` AND m.fecha <= $${idx}`;
    params.push(fechaFin);
    idx++;
  }

  const empresaFiltro = usuario.rol === 'bodega' ? empresa : usuario.empresa;
  if (empresaFiltro) {
    query += ` AND m.empresa = $${idx}`;
    params.push(empresaFiltro);
    idx++;
  }

  if (texto) {
    query += ` AND (
      LOWER(COALESCE(m.numero_nota,'')) LIKE LOWER($${idx}) OR
      LOWER(COALESCE(m.origen,'')) LIKE LOWER($${idx}) OR
      LOWER(COALESCE(m.observaciones,'')) LIKE LOWER($${idx}) OR
      LOWER(COALESCE(r.codigo,'')) LIKE LOWER($${idx}) OR
      LOWER(COALESCE(r.nombre,'')) LIKE LOWER($${idx}) OR
      LOWER(COALESCE(eq.nombre,'')) LIKE LOWER($${idx})
    )`;
    params.push(`%${texto}%`);
  }

  return query;
}

function aplicarFiltrosInventario(base, params, filtros, usuario) {
  let query = base;
  let idx = params.length + 1;
  const { empresa, texto } = filtros;
  const empresaFiltro = usuario.rol === 'bodega' ? empresa : usuario.empresa;

  if (empresaFiltro) {
    query += ` AND r.empresa = $${idx}`;
    params.push(empresaFiltro);
    idx++;
  }

  if (texto) {
    query += ` AND (
      LOWER(COALESCE(r.codigo,'')) LIKE LOWER($${idx}) OR
      LOWER(COALESCE(r.nombre,'')) LIKE LOWER($${idx}) OR
      LOWER(COALESCE(r.categoria,'')) LIKE LOWER($${idx}) OR
      LOWER(COALESCE(r.para_que_es,'')) LIKE LOWER($${idx})
    )`;
    params.push(`%${texto}%`);
  }

  return query;
}

async function obtenerReporte(tipo, filtros, usuario) {
  let params = [];
  let query = '';

  if (tipo === 'inventario') {
    query = `
      SELECT r.codigo, r.nombre AS refaccion, r.empresa, r.categoria,
             r.cantidad AS existencia, r.stock_minimo, r.precio,
             (r.cantidad * r.precio) AS valor_total
      FROM refacciones r
      WHERE 1=1`;
    query = aplicarFiltrosInventario(query, params, filtros, usuario);
    query += ' ORDER BY r.empresa, r.nombre';
    return (await pool.query(query, params)).rows;
  }

  if (tipo === 'movimientos') {
    query = `
      SELECT m.fecha, m.numero_nota, m.tipo, m.empresa, m.estado,
             COALESCE(eq.nombre, '') AS equipo,
             COUNT(mi.id) AS partidas,
             COALESCE(SUM(mi.cantidad), 0) AS piezas,
             COALESCE(SUM(mi.cantidad * mi.precio_unitario), 0) AS importe
      FROM movimientos m
      LEFT JOIN movimiento_items mi ON mi.movimiento_id = m.id
      LEFT JOIN refacciones r ON r.id = mi.refaccion_id
      LEFT JOIN equipos eq ON eq.id = m.equipo_id
      WHERE 1=1`;
    query = aplicarFiltrosMovimiento(query, params, filtros, usuario);
    query += ' GROUP BY m.id, eq.nombre ORDER BY m.fecha DESC, m.id DESC';
    return (await pool.query(query, params)).rows;
  }

  if (tipo === 'salidas-empresa') {
    query = `
      SELECT m.empresa, r.codigo, r.nombre AS refaccion,
             SUM(mi.cantidad) AS salidas,
             SUM(mi.cantidad * mi.precio_unitario) AS importe
      FROM movimientos m
      JOIN movimiento_items mi ON mi.movimiento_id = m.id
      JOIN refacciones r ON r.id = mi.refaccion_id
      LEFT JOIN equipos eq ON eq.id = m.equipo_id
      WHERE m.tipo = 'salida'`;
    query = aplicarFiltrosMovimiento(query, params, filtros, usuario);
    query += ' GROUP BY m.empresa, r.codigo, r.nombre ORDER BY m.empresa, r.nombre';
    return (await pool.query(query, params)).rows;
  }

  if (tipo === 'salidas-equipo') {
    query = `
      SELECT COALESCE(eq.nombre, 'Sin equipo') AS equipo, m.empresa,
             r.codigo, r.nombre AS refaccion,
             SUM(mi.cantidad) AS salidas,
             SUM(mi.cantidad * mi.precio_unitario) AS importe
      FROM movimientos m
      JOIN movimiento_items mi ON mi.movimiento_id = m.id
      JOIN refacciones r ON r.id = mi.refaccion_id
      LEFT JOIN equipos eq ON eq.id = m.equipo_id
      WHERE m.tipo = 'salida'`;
    query = aplicarFiltrosMovimiento(query, params, filtros, usuario);
    query += ' GROUP BY eq.nombre, m.empresa, r.codigo, r.nombre ORDER BY equipo, r.nombre';
    return (await pool.query(query, params)).rows;
  }

  // detalle
  query = `
    SELECT m.fecha, m.numero_nota, m.tipo, m.empresa, m.estado,
           COALESCE(eq.nombre, '') AS equipo,
           r.codigo, r.nombre AS refaccion, r.categoria,
           mi.cantidad, mi.precio_unitario, (mi.cantidad * mi.precio_unitario) AS importe
    FROM movimientos m
    JOIN movimiento_items mi ON mi.movimiento_id = m.id
    JOIN refacciones r ON r.id = mi.refaccion_id
    LEFT JOIN equipos eq ON eq.id = m.equipo_id
    WHERE 1=1`;
  query = aplicarFiltrosMovimiento(query, params, filtros, usuario);
  query += ' ORDER BY m.fecha DESC, m.id DESC, r.nombre';
  return (await pool.query(query, params)).rows;
}

function nombreReporte(tipo) {
  return {
    movimientos: 'Movimientos',
    detalle: 'Detalle movimientos',
    inventario: 'Inventario actual',
    'salidas-empresa': 'Salidas por empresa',
    'salidas-equipo': 'Salidas por equipo',
  }[tipo] || 'Reporte';
}

function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function columnasDe(rows) {
  if (!rows.length) return ['mensaje'];
  return Object.keys(rows[0]);
}

function enviarExcel(res, tipo, rows) {
  const cols = columnasDe(rows);
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
    <table border="1"><thead><tr>${cols.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead>
    <tbody>${rows.length ? rows.map(r => `<tr>${cols.map(c => `<td>${escapeHtml(r[c])}</td>`).join('')}</tr>`).join('') : `<tr><td>Sin resultados</td></tr>`}</tbody></table>
  </body></html>`;
  res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreReporte(tipo).replace(/\s+/g, '_')}.xls"`);
  res.send(html);
}

router.get(
  '/reportes/buscar',
  verificarToken,
  requireReportes,
  async (req, res) => {
    try {
      const tipo = req.query.tipo || 'movimientos';
      const rows = await obtenerReporte(tipo, req.query, req.usuario);

      res.json({
        tipo,
        titulo: nombreReporte(tipo),
        total: rows.length,
        rows
      });
    } catch (error) {
      console.error('Error en reportes/buscar:', error);

      res.status(500).json({
        error: 'Error al generar reporte',
        detalle: error.message
      });
    }
  }
);

router.get(
  '/reportes/:tipo/excel',
  verificarToken,
  requireReportes,
  async (req, res) => {
    try {
      const rows = await obtenerReporte(
        req.params.tipo,
        req.query,
        req.usuario
      );

      enviarExcel(res, req.params.tipo, rows);
    } catch (error) {
      console.error('Error exportando Excel:', error);

      res.status(500).json({
        error: 'Error al exportar Excel',
        detalle: error.message
      });
    }
  }
);

router.get(
  '/reportes/:tipo/pdf',
  verificarToken,
  requireReportes,
  async (req, res) => {
    try {
      const rows = await obtenerReporte(
        req.params.tipo,
        req.query,
        req.usuario
      );

      crearPdfReporte(
        res,
        req.params.tipo,
        rows,
        req.query,
        req.usuario
      );
    } catch (error) {
      console.error('Error exportando PDF:', error);

      res.status(500).json({
        error: 'Error al exportar PDF',
        detalle: error.message
      });
    }
  }
);

module.exports = router;