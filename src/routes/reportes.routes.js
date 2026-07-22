const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
<<<<<<< HEAD
const { verificarToken } = require('../middlewares/auth');
=======
const {
  verificarToken,
  requireReportes
} = require('../middlewares/auth');
const { crearPdfReporte } = require('../services/pdfReportes.service');
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95

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

<<<<<<< HEAD
function pdfBasico(titulo, rows) {
  const cols = columnasDe(rows);
  const lines = [titulo, `Generado: ${new Date().toLocaleString('es-MX')}`, ''];
  lines.push(cols.join(' | '));
  lines.push('-'.repeat(100));
  rows.slice(0, 80).forEach(r => {
    lines.push(cols.map(c => String(r[c] ?? '').replace(/\s+/g, ' ').slice(0, 22)).join(' | '));
  });
  if (rows.length > 80) lines.push(`... ${rows.length - 80} registros adicionales`);
  if (!rows.length) lines.push('Sin resultados');

  const content = lines.join('\n').replace(/[()\\]/g, '\\$&');
  const stream = `BT /F1 10 Tf 40 780 Td 12 TL (${content}) Tj ET`;
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach(obj => { offsets.push(Buffer.byteLength(pdf)); pdf += obj + '\n'; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(o => { pdf += String(o).padStart(10, '0') + ' 00000 n \n'; });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'binary');
}

function enviarPdf(res, tipo, rows) {
  const buffer = pdfBasico(nombreReporte(tipo), rows);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreReporte(tipo).replace(/\s+/g, '_')}.pdf"`);
  res.send(buffer);
}

router.get('/api/reportes/buscar', verificarToken, async (req, res) => {
  try {
    const tipo = req.query.tipo || 'movimientos';
    const rows = await obtenerReporte(tipo, req.query, req.usuario);
    res.json({ tipo, titulo: nombreReporte(tipo), total: rows.length, rows });
  } catch (error) {
    console.error('Error en reportes/buscar:', error);
    res.status(500).json({ error: 'Error al generar reporte', detalle: error.message });
  }
});

router.get('/api/reportes/:tipo/excel', verificarToken, async (req, res) => {
  try {
    const rows = await obtenerReporte(req.params.tipo, req.query, req.usuario);
    enviarExcel(res, req.params.tipo, rows);
  } catch (error) {
    console.error('Error exportando Excel:', error);
    res.status(500).json({ error: 'Error al exportar Excel', detalle: error.message });
  }
});

router.get('/api/reportes/:tipo/pdf', verificarToken, async (req, res) => {
  try {
    const rows = await obtenerReporte(req.params.tipo, req.query, req.usuario);
    enviarPdf(res, req.params.tipo, rows);
  } catch (error) {
    console.error('Error exportando PDF:', error);
    res.status(500).json({ error: 'Error al exportar PDF', detalle: error.message });
  }
});
=======
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
>>>>>>> 280dd12de7901b16f8fbd04405e569ffa4762d95

module.exports = router;
