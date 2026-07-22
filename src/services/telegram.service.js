// src/services/telegram.service.js
const axios = require('axios');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// URL base de la API de Telegram
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

/**
 * Envía un mensaje a Telegram
 * @param {string} mensaje - Texto del mensaje
 * @param {string} [parseMode='HTML'] - 'HTML' o 'Markdown'
 * @returns {Promise<Object>}
 */
async function enviarMensaje(mensaje, parseMode = 'HTML') {
    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn('⚠️ Telegram no configurado. Token o Chat ID faltantes.');
        return null;
    }

    try {
        const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: mensaje,
            parse_mode: parseMode,
            disable_web_page_preview: true
        });
        console.log('✅ Mensaje enviado a Telegram');
        return response.data;
    } catch (error) {
        console.error('❌ Error al enviar mensaje a Telegram:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Envía una alerta de stock bajo
 * @param {Object} refaccion - Datos de la refacción
 */
async function alertaStockBajo(refaccion) {
    const mensaje = `
🚨 <b>ALERTA DE STOCK BAJO</b>

<b>Refacción:</b> ${refaccion.nombre}
<b>Código:</b> ${refaccion.codigo}
<b>Stock actual:</b> ${refaccion.cantidad} unidades
<b>Stock mínimo:</b> ${refaccion.stock_minimo}
<b>Empresa:</b> ${refaccion.empresa === 'tecomatlan' ? 'Gas Tecomatlán' : 'Gas El Paraíso'}

⚠️ <b>¡Es necesario reabastecer!</b>
    `;
    return enviarMensaje(mensaje);
}

/**
 * Envía una alerta de nueva solicitud
 * @param {Object} movimiento - Datos del movimiento
 * @param {Object} solicitante - Datos del usuario que solicita
 */
async function alertaNuevaSolicitud(movimiento, solicitante) {
    const items = movimiento.items.map(it =>
        `• ${it.refaccion_nombre || it.refaccion_id} (${it.cantidad} unidades)`
    ).join('\n');

    const mensaje = `
📋 <b>NUEVA SOLICITUD DE SALIDA</b>

<b>Número de nota:</b> ${movimiento.numero_nota}
<b>Solicitante:</b> ${solicitante?.nombre || 'N/A'}
<b>Empresa:</b> ${movimiento.empresa === 'tecomatlan' ? 'Gas Tecomatlán' : 'Gas El Paraíso'}
<b>Ubicación destino:</b> ${movimiento.ubicacion_nombre || 'N/A'}
<b>Equipo:</b> ${movimiento.equipo_nombre || 'No especificado'}

<b>Refacciones solicitadas:</b>
${items}

🔔 <b>Revisa la solicitud en el sistema</b>
    `;
    return enviarMensaje(mensaje);
}

/**
 * Envía una alerta de cambio de estado
 * @param {Object} movimiento - Datos del movimiento
 * @param {string} estadoNuevo - 'completada' o 'rechazada'
 */
async function alertaCambioEstado(movimiento, estadoNuevo) {
    const emoji = estadoNuevo === 'completada' ? '✅' : '❌';
    const estadoTexto = estadoNuevo === 'completada' ? 'APROBADA' : 'RECHAZADA';

    const mensaje = `
${emoji} <b>SOLICITUD ${estadoTexto}</b>

<b>Número de nota:</b> ${movimiento.numero_nota}
<b>Solicitante:</b> ${movimiento.solicitante_nombre || 'N/A'}
<b>Estado:</b> ${estadoTexto}

${estadoNuevo === 'completada' ? '✅ La solicitud ha sido aprobada y el stock ha sido actualizado.' : '❌ La solicitud ha sido rechazada.'}
    `;
    return enviarMensaje(mensaje);
}

/**
 * Envía una alerta de nueva entrada
 * @param {Object} movimiento - Datos del movimiento
 */
async function alertaNuevaEntrada(movimiento) {
    const items = movimiento.items.map(it =>
        `• ${it.refaccion_nombre || it.refaccion_id} (+${it.cantidad} unidades)`
    ).join('\n');

    const mensaje = `
📦 <b>NUEVA ENTRADA REGISTRADA</b>

<b>Número de nota:</b> ${movimiento.numero_nota}
<b>Proveedor:</b> ${movimiento.origen || 'N/A'}
<b>Refacciones ingresadas:</b>
${items}

✅ <b>Stock actualizado correctamente</b>
    `;
    return enviarMensaje(mensaje);
}

module.exports = {
    enviarMensaje,
    alertaStockBajo,
    alertaNuevaSolicitud,
    alertaCambioEstado,
    alertaNuevaEntrada
};
