const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

function nombreEmpresa(empresa) {
  if (empresa === "tecomatlan") return "Gas Tecomatlán";
  if (empresa === "paraiso") return "Gas El Paraíso";
  return "Todas las empresas";
}

function nombreReporte(tipo) {
  return {
    movimientos: "Movimientos",
    detalle: "Detalle movimientos",
    inventario: "Inventario actual",
    "salidas-empresa": "Salidas por empresa",
    "salidas-equipo": "Salidas por equipo",
  }[tipo] || "Reporte";
}

function formatoMoneda(valor) {
  return Number(valor || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function formatoFecha(valor) {
  if (!valor) return "";
  return new Date(valor).toLocaleDateString("es-MX");
}

function formatoCelda(valor, columna) {
  if (valor === null || valor === undefined) return "";

  if (columna === "fecha") return formatoFecha(valor);

  if (
    ["importe", "precio", "precio_unitario", "valor_total"].includes(columna)
  ) {
    return formatoMoneda(valor);
  }

  if (columna === "empresa") return nombreEmpresa(valor);

  if (columna === "tipo") {
    if (valor === "entrada") return "Entrada";
    if (valor === "salida") return "Salida";
  }

  return String(valor);
}

function obtenerLogo(empresa) {
  const logo =
    empresa === "paraiso" ? "logo-paraiso.png" : "logo-tecomatlan.png";

  const ruta = path.join(__dirname, "../../public", logo);

  return fs.existsSync(ruta) ? ruta : null;
}

function columnasPorTipo(tipo, rows) {
  const configs = {
    movimientos: [
      "fecha",
      "numero_nota",
      "tipo",
      "empresa",
      "estado",
      "equipo",
      "partidas",
      "piezas",
      "importe",
    ],
    detalle: [
      "fecha",
      "numero_nota",
      "tipo",
      "empresa",
      "equipo",
      "codigo",
      "refaccion",
      "cantidad",
      "precio_unitario",
      "importe",
    ],
    inventario: [
      "codigo",
      "refaccion",
      "empresa",
      "categoria",
      "existencia",
      "stock_minimo",
      "precio",
      "valor_total",
    ],
    "salidas-empresa": [
      "empresa",
      "codigo",
      "refaccion",
      "salidas",
      "importe",
    ],
    "salidas-equipo": [
      "equipo",
      "empresa",
      "codigo",
      "refaccion",
      "salidas",
      "importe",
    ],
  };

  return configs[tipo] || Object.keys(rows[0] || {});
}

function tituloColumna(col) {
  return col.replaceAll("_", " ").toUpperCase();
}

function resumenReporte(tipo, rows) {
  const totalImporte = rows.reduce((s, r) => s + Number(r.importe || r.valor_total || 0), 0);
  const totalPiezas = rows.reduce((s, r) => s + Number(r.piezas || r.cantidad || r.salidas || 0), 0);

  const entradas = rows.filter((r) => r.tipo === "entrada").length;
  const salidas = rows.filter((r) => r.tipo === "salida").length;

  return {
    registros: rows.length,
    entradas,
    salidas,
    piezas: totalPiezas,
    importe: totalImporte,
  };
}

function crearPdfReporte(res, tipo, rows, filtros = {}, usuario = {}) {
  const doc = new PDFDocument({
    size: "LETTER",
    margin: 36,
    bufferPages: true,
  });

  const titulo = nombreReporte(tipo);
  const empresa =
    usuario.rol === "bodega" ? filtros.empresa || "" : usuario.empresa || "";
  const logo = obtenerLogo(empresa);
  const resumen = resumenReporte(tipo, rows);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${titulo.replace(/\s+/g, "_")}.pdf"`
  );

  doc.pipe(res);

  function encabezado() {
    doc.rect(36, 30, 540, 78).fill("#0B3D91");

    if (logo) {
      try {
        doc.image(logo, 48, 42, { width: 55, height: 55, fit: [55, 55] });
      } catch {}
    }

    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("Sistema de Inventario de Refacciones", 115, 45);

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(nombreEmpresa(empresa), 115, 68);

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(titulo, 115, 86);
  }

  function infoReporte() {
    doc
      .fillColor("#0B3D91")
      .font("Helvetica-Bold")
      .fontSize(15)
      .text(titulo, 36, 128);

    doc
      .fillColor("#333333")
      .font("Helvetica")
      .fontSize(9)
      .text(`Empresa: ${nombreEmpresa(empresa)}`, 36, 152)
      .text(`Usuario: ${usuario.nombre || usuario.usuario || "Sistema"}`, 36, 167)
      .text(`Generado: ${new Date().toLocaleString("es-MX")}`, 36, 182);
  }

  function tarjetasResumen() {
    const y = 205;
    const cards = [
      ["Registros", resumen.registros],
      ["Entradas", resumen.entradas],
      ["Salidas", resumen.salidas],
      ["Piezas", resumen.piezas],
      ["Importe", formatoMoneda(resumen.importe)],
    ];

    const w = 102;

    cards.forEach((c, i) => {
      const x = 36 + i * 108;
      doc.roundedRect(x, y, w, 48, 7).fill("#F3F6FB");
      doc.fillColor("#666666").font("Helvetica").fontSize(8).text(c[0], x + 8, y + 9);
      doc.fillColor("#0B3D91").font("Helvetica-Bold").fontSize(11).text(String(c[1]), x + 8, y + 25, {
        width: w - 16,
        ellipsis: true,
      });
    });
  }

  encabezado();
  infoReporte();
  tarjetasResumen();

  let y = 280;

  if (!rows.length) {
    doc.fillColor("#333").fontSize(12).text("Sin resultados para los filtros seleccionados.", 36, y);
    agregarPaginas(doc);
    doc.end();
    return;
  }

  const cols = columnasPorTipo(tipo, rows);
  const tableX = 36;
  const tableW = 540;
  const colW = tableW / cols.length;
  const rowH = 24;

  function encabezadoTabla() {
    doc.rect(tableX, y, tableW, rowH).fill("#0B3D91");

    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(6.5);

    cols.forEach((col, i) => {
      doc.text(tituloColumna(col), tableX + i * colW + 4, y + 8, {
        width: colW - 8,
        height: 10,
        ellipsis: true,
      });
    });

    y += rowH;
  }

  encabezadoTabla();

  rows.forEach((row, index) => {
    if (y > 720) {
      doc.addPage();
      y = 50;
      encabezadoTabla();
    }

    doc.rect(tableX, y, tableW, rowH).fill(index % 2 === 0 ? "#F7F9FC" : "#FFFFFF");

    doc.fillColor("#222222").font("Helvetica").fontSize(6.5);

    cols.forEach((col, i) => {
      const align =
        ["importe", "precio", "precio_unitario", "valor_total", "cantidad", "piezas", "salidas"].includes(col)
          ? "right"
          : "left";

      doc.text(formatoCelda(row[col], col), tableX + i * colW + 4, y + 8, {
        width: colW - 8,
        height: 10,
        ellipsis: true,
        align,
      });
    });

    y += rowH;
  });

  y += 25;

  if (y > 690) {
    doc.addPage();
    y = 60;
  }

  doc.fillColor("#0B3D91").font("Helvetica-Bold").fontSize(12).text("Resumen final", 36, y);
  y += 18;

  doc
    .fillColor("#333333")
    .font("Helvetica")
    .fontSize(10)
    .text(`Total de registros: ${resumen.registros}`, 36, y)
    .text(`Total de piezas: ${resumen.piezas}`, 36, y + 15)
    .text(`Importe total: ${formatoMoneda(resumen.importe)}`, 36, y + 30);

  y += 80;

  doc
    .moveTo(370, y)
    .lineTo(540, y)
    .strokeColor("#888888")
    .stroke();

  doc
    .fillColor("#555555")
    .fontSize(9)
    .text("Responsable de Bodega", 370, y + 8, { width: 170, align: "center" });

  agregarPaginas(doc);
  doc.end();
}

function agregarPaginas(doc) {
  const range = doc.bufferedPageRange();

  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    doc
      .fillColor("#777777")
      .font("Helvetica")
      .fontSize(8)
      .text(
        `Sistema de Inventario de Refacciones - Página ${i + 1} de ${range.count}`,
        36,
        755,
        { width: 540, align: "center" }
      );
  }
}

module.exports = {
  crearPdfReporte,
};