// Lógica principal del sistema Bodega Central
// ===== CONFIGURACION =====
const EMP = {
  tecomatlan: {
    id: "tecomatlan",
    nom: "Gas Tecomatlan",
    tema: "",
    logo: "logo-tecomatlan.png",
  },
  paraiso: {
    id: "paraiso",
    nom: "Gas El Paraiso",
    tema: "tema-paraiso",
    logo: "logo-paraiso.png",
  },
};
const CAT = {
  pipa: { n: "Pipa", c: "bd-pipa" },
  planta: { n: "Planta", c: "bd-planta" },
  trailer: { n: "Trailer", c: "bd-trailer" },

  cilindrera: {
    n: "Cilindrera",
    c: "bd-cilindrera",
  },

  tanque_carburacion: {
    n: "Tanque de Carburación",
    c: "bd-tanque",
  },

  valvulas: { n: "Válvulas", c: "bd-valvulas" },
  mangueras: { n: "Mangueras", c: "bd-mangueras" },
  otro: { n: "Otro", c: "bd-otro" },
};
const TIT = {
  dashboard: { t: "Dashboard", s: "Resumen general del inventario" },
  inventario: { t: "Inventario", s: "Catalogo completo de refacciones" },
  entradas: { t: "Notas de Entrada", s: "Registro de refacciones recibidas" },
  salidas: {
    t: "Salidas / Pedimentos",
    s: "Surtido de refacciones a empresas",
  },
  ubicaciones: { t: "Ubicaciones", s: "Plantas, sucursales y estaciones" },
  usuarios: { t: "Usuarios", s: "Gestion de accesos" },
  reportes: { t: "Reportes", s: "Busqueda y descarga de reportes" },
  alertas: { t: "Alertas", s: "Notificaciones del sistema" },
  equipos: { t: "Equipos", s: "Gestión de pipas, trailers y estaciones" },
};
function obtenerToken() {
  return sessionStorage.getItem("token");
}

function headersAuth() {
  const token = obtenerToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
function usuarioActual() {
  if (S && S.usr) return S.usr;

  try {
    return JSON.parse(sessionStorage.getItem("usuario") || "null");
  } catch (e) {
    return null;
  }
}

function empresaPermitida() {
  const usr = usuarioActual();

  if (!usr) return "";

  // Bodega ve todas las empresas
  if (usr.rol === "bodega") {
    return "";
  }

  // Usuarios normales solo ven su empresa
  return usr.empresa || "";
}

function aplicarEmpresaAFiltros() {
  const usr = usuarioActual();
  if (!usr) return;

  const ids = ["f-emp", "f-ub-emp", "f-equipo-emp", "f-us-emp", "rep-empresa"];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (usr.rol === "bodega") {
      el.disabled = false;
    } else {
      el.value = usr.empresa || "";
      el.disabled = true;
    }
  });
}

function qsConEmpresa(params = new URLSearchParams()) {
  const empresa = empresaPermitida();

  if (empresa && !params.has("empresa")) {
    params.append("empresa", empresa);
  }

  return params;
}
// ===== DATOS =====
function gd(k, d) {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch (e) {
    return d;
  }
}
function sd(k, d) {
  try {
    localStorage.setItem(k, JSON.stringify(d));
  } catch (e) {}
}
function gid() {
  return "id_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
}
function fmon(n) {
  return (
    "$" +
    Number(n).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
function ffec(f) {
  return new Date(f).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function fhor(f) {
  return new Date(f).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function trel(f) {
  const d = Date.now() - new Date(f).getTime(),
    m = Math.floor(d / 60000),
    h = Math.floor(d / 3600000),
    di = Math.floor(d / 86400000);
  if (m < 1) return "Ahora";
  if (m < 60) return "Hace " + m + " min";
  if (h < 24) return "Hace " + h + " hr";
  if (di < 7) return "Hace " + di + "d";
  return ffec(f);
}
function nomUbi(id) {
  const all = gd("ubicaciones", dUbi());
  const u = all.find((x) => x.id === id);
  return u ? u.nom : id;
}
function nomRef(id) {
  const r = gd("refacciones", dRef()).find((x) => x.id === id);
  return r ? r.nom : "?";
}
function rolTxt(r) {
  return (
    {
      bodega: "Bodeguero",
      encargado: "Encargado General",
      solicitante: "Solicitante",
    }[r] || r
  );
}
function eBadge(e) {
  return (
    {
      pendiente: '<span class="bd bd-pendiente">Pendiente</span>',
      completada: '<span class="bd bd-completada">Completada</span>',
      rechazada: '<span class="bd bd-rechazada">Rechazada</span>',
    }[e] || e
  );
}
function sBadge(c, m) {
  if (c <= 0) return '<span class="bd bd-bajo">Agotado</span>';
  if (c <= m) return '<span class="bd bd-bajo">Bajo</span>';
  if (c <= m * 2) return '<span class="bd bd-medio">Medio</span>';
  return '<span class="bd bd-ok">OK</span>';
}
function empBadge(e) {
  return e === "tecomatlan"
    ? '<span class="bd bd-tec">Tecomatlan</span>'
    : '<span class="bd bd-par">Paraiso</span>';
}
function tipoBadge(t) {
  return (
    {
      planta: '<span class="bd bd-t1">Planta</span>',
      sucursal: '<span class="bd bd-t2">Sucursal</span>',
      estacion: '<span class="bd bd-t3">Estacion</span>',
    }[t] || t
  );
}

// Datos por defecto (localStorage)
function dUsu() {
  return [
    {
      id: "u0",
      nom: "Bodeguero Administrador",
      user: "bodega",
      pass: "1234",
      empresa: "",
      ubicacion: "",
      rol: "bodega",
      activo: true,
    },
    {
      id: "u1",
      nom: "Juan Perez Garcia",
      user: "juan",
      pass: "1234",
      empresa: "tecomatlan",
      ubicacion: "ub1",
      rol: "encargado",
      activo: true,
    },
    {
      id: "u2",
      nom: "Maria Lopez Hernandez",
      user: "maria",
      pass: "1234",
      empresa: "tecomatlan",
      ubicacion: "ub2",
      rol: "solicitante",
      activo: true,
    },
    {
      id: "u3",
      nom: "Carlos Ruiz Martinez",
      user: "carlos",
      pass: "1234",
      empresa: "tecomatlan",
      ubicacion: "ub3",
      rol: "solicitante",
      activo: true,
    },
    {
      id: "u4",
      nom: "Ana Diaz Flores",
      user: "ana",
      pass: "1234",
      empresa: "paraiso",
      ubicacion: "ub4",
      rol: "encargado",
      activo: true,
    },
    {
      id: "u5",
      nom: "Pedro Sanchez Luna",
      user: "pedro",
      pass: "1234",
      empresa: "paraiso",
      ubicacion: "ub5",
      rol: "solicitante",
      activo: true,
    },
  ];
}
function dUbi() {
  return [
    {
      id: "ub1",
      nom: "Planta Tecomatlan",
      empresa: "tecomatlan",
      tipo: "planta",
      razon: "Gas Tecomatlan S.A. de C.V.",
      domicilio: "Carretera Federal 180 Km 42, Tecomatlan, Puebla",
      permiso: "CRE-PT-2024-0012",
      telefono: "222-123-4567",
      encargado: "Juan Perez Garcia",
      notas: "Planta principal de distribucion",
    },
    {
      id: "ub2",
      nom: "Sucursal Centro Tecomatlan",
      empresa: "tecomatlan",
      tipo: "sucursal",
      razon: "Gas Tecomatlan S.A. de C.V.",
      domicilio: "Av. Reforma No. 156, Col. Centro, Tecomatlan, Puebla",
      permiso: "CRE-SC-2024-0034",
      telefono: "222-234-5678",
      encargado: "Maria Lopez Hernandez",
      notas: "Sucursal de atencion al publico",
    },
    {
      id: "ub3",
      nom: "Estacion Sur Tecomatlan",
      empresa: "tecomatlan",
      tipo: "estacion",
      razon: "Gas Tecomatlan S.A. de C.V.",
      domicilio: "Blvd. Sur No. 89, Tecomatlan, Puebla",
      permiso: "CRE-ES-2024-0056",
      telefono: "222-345-6789",
      encargado: "Carlos Ruiz Martinez",
      notas: "Estacion de carburacion vehicular",
    },
    {
      id: "ub4",
      nom: "Planta Paraiso",
      empresa: "paraiso",
      tipo: "planta",
      razon: "Gas El Paraiso S.A. de C.V.",
      domicilio: "Km 15 Camino Real, El Paraiso, Puebla",
      permiso: "CRE-PP-2024-0078",
      telefono: "222-456-7890",
      encargado: "Ana Diaz Flores",
      notas: "Planta de llenado y distribucion",
    },
    {
      id: "ub5",
      nom: "Estacion Oriente Paraiso",
      empresa: "paraiso",
      tipo: "estacion",
      razon: "Gas El Paraiso S.A. de C.V.",
      domicilio: "Av. Oriente No. 234, El Paraiso, Puebla",
      permiso: "CRE-EP-2024-0090",
      telefono: "222-567-8901",
      encargado: "Pedro Sanchez Luna",
      notas: "Estacion de carburacion",
    },
  ];
}
function dRef() {
  return [
    {
      id: "r1",
      cod: "PIP-001",
      nom: 'Valvula de seguridad 3/4"',
      desc: "Valvula de alivio de presion para pipa",
      cat: "pipa",
      para: "Pipa - Sistema de seguridad",
      cant: 12,
      min: 5,
      precio: 450,
      empresa: "tecomatlan",
      fec: "2024-11-15",
    },
    {
      id: "r2",
      cod: "PIP-002",
      nom: "Manometro 0-300 PSI",
      desc: "Manometro de presion para pipa",
      cat: "pipa",
      para: "Pipa - Medicion de presion",
      cant: 3,
      min: 4,
      precio: 280,
      empresa: "tecomatlan",
      fec: "2024-11-15",
    },
    {
      id: "r3",
      cod: "PLA-001",
      nom: "Filtro de gas tipo Y",
      desc: "Filtro para linea de gas de planta",
      cat: "planta",
      para: "Planta - Filtrado de gas",
      cant: 8,
      min: 3,
      precio: 1200,
      empresa: "tecomatlan",
      fec: "2024-11-16",
    },
    {
      id: "r4",
      cod: "PLA-002",
      nom: "Regulador de presion 10 PSI",
      desc: "Regulador para planta",
      cat: "planta",
      para: "Planta - Regulacion de presion",
      cant: 2,
      min: 2,
      precio: 3500,
      empresa: "tecomatlan",
      fec: "2024-11-16",
    },
    {
      id: "r5",
      cod: "TRA-001",
      nom: 'Llave de paso 2" BRONCE',
      desc: "Llave de bola para trailer",
      cat: "trailer",
      para: "Trailer - Corte de flujo",
      cant: 6,
      min: 3,
      precio: 890,
      empresa: "tecomatlan",
      fec: "2024-11-17",
    },
    {
      id: "r6",
      cod: "TAN-001",
      nom: "Flotador de nivel",
      desc: "Flotador para tanque de carburacion",
      cat: "tanque_carburacion",
      para: "Tanque de carburacion - Control de nivel",
      cant: 1,
      min: 2,
      precio: 2100,
      empresa: "tecomatlan",
      fec: "2024-11-17",
    },
    {
      id: "r7",
      cod: "VAL-001",
      nom: 'Valvula check 1" SS',
      desc: "Valvula de retencion inoxidable",
      cat: "valvulas",
      para: "General - Antirretorno",
      cant: 15,
      min: 5,
      precio: 670,
      empresa: "tecomatlan",
      fec: "2024-11-18",
    },
    {
      id: "r8",
      cod: "MAN-001",
      nom: 'Manguera flexible 2m 3/4"',
      desc: "Manguera de alta presion",
      cat: "mangueras",
      para: "Pipa/Planta - Conexion flexible",
      cant: 10,
      min: 5,
      precio: 520,
      empresa: "tecomatlan",
      fec: "2024-11-18",
    },
    {
      id: "r9",
      cod: "PIP-003",
      nom: 'Cierre de seguridad 5/8"',
      desc: "Cierre magnetico para pipa",
      cat: "pipa",
      para: "Pipa - Dispositivo de seguridad",
      cant: 7,
      min: 4,
      precio: 1800,
      empresa: "paraiso",
      fec: "2024-11-19",
    },
    {
      id: "r10",
      cod: "PLA-003",
      nom: "Sensor de presion digital",
      desc: "Sensor con display para planta",
      cat: "planta",
      para: "Planta - Monitoreo de presion",
      cant: 4,
      min: 2,
      precio: 4200,
      empresa: "paraiso",
      fec: "2024-11-19",
    },
    {
      id: "r11",
      cod: "TRA-002",
      nom: "Tapa de domo con cierre",
      desc: "Tapa de seguridad para trailer",
      cat: "trailer",
      para: "Trailer - Cierre de domo",
      cant: 0,
      min: 2,
      precio: 1500,
      empresa: "paraiso",
      fec: "2024-11-20",
    },
    {
      id: "r12",
      cod: "TAN-002",
      nom: 'Valvula de drenaje 1/2"',
      desc: "Valvula para drenaje de tanque",
      cat: "tanque_carburacion",
      para: "Tanque de carburacion - Drenaje",
      cant: 5,
      min: 2,
      precio: 380,
      empresa: "paraiso",
      fec: "2024-11-20",
    },
  ];
}
function dMov() {
  return [
    {
      id: "m1",
      tipo: "entrada",
      nota: "ENT-2024-001",
      fec: "2024-12-01",
      empresa: "tecomatlan",
      origen: "Proveedor: Valvulas del Norte S.A.",
      ubDest: "u0",
      solicita: "u0",
      items: [
        { refId: "r1", cant: 10, pu: 450 },
        { refId: "r7", cant: 8, pu: 670 },
      ],
      obs: "Reposicion mensual",
      est: "completada",
    },
    {
      id: "m2",
      tipo: "salida",
      nota: "SAL-2024-001",
      fec: "2024-12-03",
      empresa: "tecomatlan",
      origen: "Bodega Central",
      ubDest: "ub1",
      solicita: "u1",
      items: [
        { refId: "r2", cant: 2, pu: 280 },
        { refId: "r8", cant: 3, pu: 520 },
      ],
      obs: "Surtido para mantenimiento de pipas",
      est: "completada",
    },
    {
      id: "m3",
      tipo: "salida",
      nota: "SAL-2024-002",
      fec: "2024-12-05",
      empresa: "tecomatlan",
      origen: "Bodega Central",
      ubDest: "ub3",
      solicita: "u3",
      items: [{ refId: "r5", cant: 2, pu: 890 }],
      obs: "Reemplazo en trailer unidad 12",
      est: "pendiente",
    },
    {
      id: "m4",
      tipo: "entrada",
      nota: "ENT-2024-002",
      fec: "2024-12-06",
      empresa: "paraiso",
      origen: "Proveedor: Mangueras Industriales",
      ubDest: "u0",
      solicita: "u0",
      items: [
        { refId: "r9", cant: 5, pu: 1800 },
        { refId: "r12", cant: 5, pu: 380 },
      ],
      obs: "Entrada de refacciones de seguridad",
      est: "completada",
    },
    {
      id: "m5",
      tipo: "salida",
      nota: "SAL-2024-003",
      fec: "2024-12-08",
      empresa: "paraiso",
      origen: "Bodega Central",
      ubDest: "ub5",
      solicita: "u5",
      items: [{ refId: "r10", cant: 1, pu: 4200 }],
      obs: "Sensor para estacion",
      est: "pendiente",
    },
  ];
}
function dAle() {
  return [
    {
      id: "a1",
      fec: "2024-12-08T10:30:00",
      tipo: "solicitud",
      msg: "Pedro Sanchez solicito 1 Sensor de presion digital para Estacion Oriente Paraiso",
      empresa: "paraiso",
      uid: "u5",
      leida: false,
    },
    {
      id: "a2",
      fec: "2024-12-08T09:15:00",
      tipo: "stock",
      msg: "Tapa de domo con cierre (TRA-002) en 0 unidades - Stock critico",
      empresa: "paraiso",
      uid: null,
      leida: false,
    },
    {
      id: "a3",
      fec: "2024-12-07T16:45:00",
      tipo: "stock",
      msg: "Flotador de nivel (TAN-001) con solo 1 unidad - Stock bajo",
      empresa: "tecomatlan",
      uid: null,
      leida: false,
    },
    {
      id: "a4",
      fec: "2024-12-07T14:20:00",
      tipo: "solicitud",
      msg: 'Carlos Ruiz solicito 2 Llaves de paso 2" BRONCE para Estacion Sur',
      empresa: "tecomatlan",
      uid: "u3",
      leida: false,
    },
    {
      id: "a5",
      fec: "2024-12-06T11:00:00",
      tipo: "entrada",
      msg: "Entrada registrada: 5 Cierres de seguridad y 5 Valvulas de drenaje",
      empresa: "paraiso",
      uid: null,
      leida: true,
    },
  ];
}

// ===== ESTADO =====
let S = { usr: null, sec: "dashboard" };

// Empresa seleccionada
let empresaActual = "tecomatlan";

function cambiarEmpresa(empresa) {
  empresaActual = empresa;

  localStorage.setItem("empresaActual", empresa);

  document.body.classList.toggle("tema-paraiso", empresa === "paraiso");

  document.getElementById("sb-logo").src =
    empresa === "tecomatlan" ? "logo-tecomatlan.png" : "logo-paraiso.png";

  document.getElementById("sb-nom").textContent =
    empresa === "tecomatlan" ? "Bodega Central" : "Bodega Central";

  render(S.sec);
}

// ===== INIT =====
(function init() {
  // El sistema ahora trabaja contra PostgreSQL por medio de la API.
  // localStorage solo conserva sesión/token, no datos del inventario.
  const token = obtenerToken();
  const usuario = sessionStorage.getItem("usuario");
  if (token && usuario) {
    try {
      const usr = JSON.parse(usuario);
      aplicarSesion(usr);
      verificarStock();
      nav("dashboard");
    } catch (e) {
      logout();
    }
  }
})();

// LOGIN
function aplicarSesion(usr) {
  S.usr = usr;

  document.getElementById("pantalla-login").style.display = "none";
  document.getElementById("app-principal").style.display = "block";

  const ini = (usr.nombre || usr.usuario || "BC")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  document.getElementById("av").textContent = ini;
  document.getElementById("un").textContent =
    usr.nombre || usr.usuario || "Usuario";
  document.getElementById("ur").textContent =
    usr.rol === "bodega"
      ? "Bodeguero - Admin"
      : usr.rol === "encargado"
        ? "Encargado"
        : "Solicitante";

  aplicarEmpresaAFiltros();

  if (usr.empresa) {
    empresaActual = usr.empresa;
    localStorage.setItem("empresaActual", usr.empresa);

    document.body.classList.toggle("tema-paraiso", usr.empresa === "paraiso");

    const logo = document.getElementById("sb-logo");
    if (logo) {
      logo.src =
        usr.empresa === "paraiso" ? "logo-paraiso.png" : "logo-tecomatlan.png";
    }
  }

  mostrarMenuPorRol(usr.rol);
}

function login() {
  const usuario = document.getElementById("l-user").value.trim().toLowerCase();
  const contrasena = document.getElementById("l-pass").value.trim();
  if (!usuario || !contrasena) {
    toast("Completa todos los campos", "er", "Faltan datos");
    return;
  }

  fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, contrasena }),
  })
    .then((res) => {
      if (!res.ok)
        return res.json().then((err) => {
          throw new Error(err.error || "Error en login");
        });
      return res.json();
    })
    .then((data) => {
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("usuario", JSON.stringify(data.usuario));

      aplicarSesion(data.usuario);
      nav("dashboard");
    })
    .catch((err) => {
      toast(err.message, "er", "Error de acceso");
    });
}

function mostrarMenuPorRol(rol) {
  const usr = usuarioActual();

  const soloBodega = ["ubicaciones", "usuarios", "alertas", "equipos"];

  const menuItems = document.querySelectorAll(".ni");

  menuItems.forEach((item) => {
    const sec = item.dataset.s;

    // Solo el bodeguero puede ver estas opciones
    if (soloBodega.includes(sec)) {
      item.style.display = rol === "bodega" ? "flex" : "none";
    }

    // Reportes para bodeguero y encargado
    else if (sec === "reportes") {
      item.style.display = ["bodega", "encargado"].includes(rol)
        ? "flex"
        : "none";
    }

    // El solicitante no ve Entradas
    else if (rol === "solicitante" && sec === "entradas") {
      item.style.display = "none";
    } else {
      item.style.display = "flex";
    }
  });

  const empTec = document.getElementById("emp-tec");
  const empPar = document.getElementById("emp-par");

  if (rol === "bodega") {
    if (empTec) empTec.style.display = "flex";
    if (empPar) empPar.style.display = "flex";
  } else {
    if (empTec)
      empTec.style.display = usr.empresa === "tecomatlan" ? "flex" : "none";

    if (empPar)
      empPar.style.display = usr.empresa === "paraiso" ? "flex" : "none";
  }
}

function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("usuario");
  S.usr = null;
  document.getElementById("app-principal").style.display = "none";
  document.getElementById("pantalla-login").style.display = "";
  document.getElementById("l-user").value = "";
  document.getElementById("l-pass").value = "";
  document.body.classList.remove("tema-paraiso");
}
document.getElementById("l-pass").addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});
document.getElementById("l-user").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("l-pass").focus();
});

// ===== NAV =====
function nav(s) {
  S.sec = s;
  document
    .querySelectorAll(".ni")
    .forEach((n) => n.classList.toggle("act", n.dataset.s === s));
  const i = TIT[s] || { t: s, s: "" };
  document.getElementById("tt").textContent = i.t;
  document.getElementById("ts").textContent = i.s;
  document.querySelectorAll(".sec").forEach((x) => x.classList.remove("act"));
  const el = document.getElementById("s-" + s);
  if (el) el.classList.add("act");
  render(s);
  cSidebar();
}
function render(s) {
  switch (s) {
    case "dashboard":
      rDash();
      break;
    case "inventario":
      rInv();
      break;
    case "entradas":
      rEnt();
      break;
    case "salidas":
      rSal();
      break;
    case "ubicaciones":
      rUbi();
      break;
    case "usuarios":
      rUsu();
      break;
    case "reportes":
      rReportes();
      break;
    case "alertas":
      rAle();
      break;
    case "equipos":
      rEquipos();
      break;
  }
  updB();
}

// ===== SIDEBAR MOVIL =====
function oSidebar() {
  document.getElementById("sidebar").classList.add("abierto");
  document.getElementById("sov").classList.add("vis");
}
function cSidebar() {
  document.getElementById("sidebar").classList.remove("abierto");
  document.getElementById("sov").classList.remove("vis");
}

// ===== DASHBOARD =====
function rDash() {
  const params = qsConEmpresa(new URLSearchParams());

  Promise.all([
    fetch(`/api/refacciones?${params.toString()}`, {
      headers: headersAuth(),
    }).then((r) => (r.ok ? r.json() : [])),

    fetch(`/api/movimientos?${params.toString()}`, {
      headers: headersAuth(),
    }).then((r) => (r.ok ? r.json() : [])),
  ])

    .then(([ref, mov]) => {
      const tRef = ref.length;
      const tUni = ref.reduce((s, r) => s + Number(r.cantidad || 0), 0);
      const tEnt = mov.filter((m) => m.tipo === "entrada").length;
      const tSal = mov.filter((m) => m.tipo === "salida").length;
      const stBajo = ref.filter(
        (r) => Number(r.cantidad || 0) <= Number(r.stock_minimo || 0),
      ).length;
      const valT = ref.reduce(
        (s, r) => s + Number(r.cantidad || 0) * Number(r.precio || 0),
        0,
      );

      document.getElementById("kpi-g").innerHTML = `
        <div class="kc k1"><div class="ki"><i class="fa-solid fa-boxes-stacked"></i></div><div class="kv">${tRef}</div><div class="ke">${tUni} unidades en bodega</div></div>
        <div class="kc k2"><div class="ki"><i class="fa-solid fa-arrow-right-to-bracket"></i></div><div class="kv">${tEnt}</div><div class="ke">Notas de entrada</div></div>
        <div class="kc k3"><div class="ki"><i class="fa-solid fa-arrow-right-from-bracket"></i></div><div class="kv">${tSal}</div><div class="ke">Notas de salida</div></div>
        <div class="kc k4"><div class="ki"><i class="fa-solid fa-triangle-exclamation"></i></div><div class="kv">${stBajo}</div><div class="ke">Stock bajo</div></div>
        <div class="kc k5"><div class="ki"><i class="fa-solid fa-coins"></i></div><div class="kv" style="font-size:22px">${fmon(valT)}</div><div class="ke">Valor total inventario</div></div>`;

      const ult = [...mov]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 6);
      const tm = document.getElementById("tb-mov");
      tm.innerHTML = ult.length
        ? ult
            .map((m) => {
              const dest =
                m.tipo === "entrada"
                  ? "Bodega Central"
                  : m.ubicacion_nombre || "N/A";
              return `<tr><td>${ffec(m.fecha)}</td><td><span class="bd ${m.tipo === "entrada" ? "bd-completada" : "bd-pendiente"}">${m.tipo === "entrada" ? "Entrada" : "Salida"}</span></td><td style="font-weight:600">${m.numero_nota}</td><td>${dest}</td><td>${eBadge(m.estado)}</td></tr>`;
            })
            .join("")
        : `<tr><td colspan="5" class="tv"><i class="fa-solid fa-inbox"></i><p>Sin movimientos</p></td></tr>`;

      const bajo = ref.filter(
        (r) => Number(r.cantidad || 0) <= Number(r.stock_minimo || 0),
      );
      const ts = document.getElementById("tb-sto");
      ts.innerHTML = bajo.length
        ? bajo
            .map(
              (r) =>
                `<tr><td style="font-weight:700">${r.codigo}</td><td>${r.nombre}</td><td><strong style="color:${Number(r.cantidad) <= 0 ? "var(--d)" : "var(--t)"}">${r.cantidad}</strong> / min ${r.stock_minimo}</td><td><span class="bd ${CAT[r.categoria]?.c || "bd-otro"}">${CAT[r.categoria]?.n || r.categoria}</span></td></tr>`,
            )
            .join("")
        : `<tr><td colspan="4" class="tv"><i class="fa-solid fa-check-circle" style="color:var(--a)"></i><p>Todo el stock está bien</p></td></tr>`;
    })
    .catch((err) =>
      toast("Error al cargar dashboard: " + err.message, "er", "Error"),
    );
}

const usr = usuarioActual();

if (usr && usr.rol !== "bodega") {
  const empTec = document.getElementById("emp-tec");
  const empPar = document.getElementById("emp-par");

  if (empTec)
    empTec.style.display = usr.empresa === "tecomatlan" ? "flex" : "none";
  if (empPar)
    empPar.style.display = usr.empresa === "paraiso" ? "flex" : "none";
}

// ===== INVENTARIO =====
function rInv() {
  const busqueda = document.getElementById("b-inv")?.value || "";
  const categoria = document.getElementById("f-cat")?.value || "";
  const empresa =
    empresaPermitida() || document.getElementById("f-emp")?.value || "";

  // Construir query string
  const params = new URLSearchParams();
  if (busqueda) params.append("busqueda", busqueda);
  if (categoria) params.append("categoria", categoria);
  if (empresa) params.append("empresa", empresa);

  fetch(`/api/refacciones?${params.toString()}`, {
    headers: headersAuth(),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Error al obtener refacciones");
      return res.json();
    })
    .then((refacciones) => {
      const tb = document.getElementById("tb-inv");
      if (!refacciones.length) {
        tb.innerHTML = `<tr><td colspan="9" class="tv"><i class="fa-solid fa-box-open"></i><p>No se encontraron refacciones</p></td></tr>`;
        return;
      }

      tb.innerHTML = refacciones
        .map(
          (r) => `
            <tr>
                <td style="font-weight:700;color:var(--p)">${r.codigo}</td>
                <td><strong>${r.nombre}</strong><br><span style="font-size:11px;color:var(--tc)">${r.descripcion || ""}</span></td>
                <td>${empBadge(r.empresa)}</td>
                <td><span class="bd ${CAT[r.categoria]?.c || "bd-otro"}">${CAT[r.categoria]?.n || r.categoria}</span></td>
                <td style="font-size:12px">${r.para_que_es || ""}</td>
                <td style="font-weight:700;font-size:14px">${r.cantidad}</td>
                <td>${fmon(r.precio)}</td>
                <td>${sBadge(r.cantidad, r.stock_minimo)}</td>
                <td><div class="ail">
                    <button class="bi" onclick="mRef('${r.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="bi dg" onclick="delRef('${r.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </div></td>
            </tr>
        `,
        )
        .join("");
    })
    .catch((err) => {
      toast(err.message, "er", "Error");
    });
}

// ===== MODAL REFACCION =====
function mRef(id) {
  if (id) {
    // Obtener datos de la refacción desde la API
    fetch(`/api/refacciones/${id}`, {
      headers: headersAuth(),
    })
      .then((res) => res.json())
      .then((r) => {
        mostrarFormularioRefaccion(r);
      })
      .catch((err) => {
        toast("Error al cargar la refacción", "er", "Error");
      });
  } else {
    mostrarFormularioRefaccion(null);
  }
}

function mostrarFormularioRefaccion(r) {
  const ed = !!r;
  document.getElementById("mt").textContent = ed
    ? "Editar Refacción"
    : "Nueva Refacción";
  const opts = Object.entries(CAT)
    .map(
      ([k, v]) =>
        `<option value="${k}" ${r?.categoria === k ? "selected" : ""}>${v.n}</option>`,
    )
    .join("");

  document.getElementById("mb").innerHTML = `
        <div class="fr">
            <div class="fg"><label>Código</label><input type="text" id="rf-cod" value="${r?.codigo || ""}" placeholder="Ej: PIP-003" ${ed ? 'readonly style="background:#f5f5f5"' : ""}></div>
            <div class="fg"><label>Categoría</label><select id="rf-cat">${opts}</select></div>
        </div>
        <div class="fg"><label>Nombre</label><input type="text" id="rf-nom" value="${r?.nombre || ""}" placeholder="Nombre de la refacción"></div>
        <div class="fg"><label>Descripción</label><textarea id="rf-desc">${r?.descripcion || ""}</textarea></div>
        <div class="fr"><div class="fg fu"><label>Para qué es (equipo / uso)</label><input type="text" id="rf-para" value="${r?.para_que_es || ""}" placeholder="Ej: Pipa - Sistema de seguridad"></div></div>
        <div class="fr">
            <div class="fg"><label>Cantidad actual</label><input type="number" id="rf-cant" value="${r?.cantidad ?? 0}" min="0"></div>
            <div class="fg"><label>Stock mínimo</label><input type="number" id="rf-min" value="${r?.stock_minimo ?? 2}" min="0"></div>
        </div>
        <div class="fr">
            <div class="fg"><label>Precio unitario (MXN)</label><input type="number" id="rf-precio" value="${r?.precio ?? 0}" min="0" step="0.01"></div>
            <div class="fg">
    <label>Empresa</label>

    ${
      usuarioActual()?.rol === "bodega"
        ? `
        <select id="rf-emp">
            <option value="tecomatlan"
                ${(r?.empresa || usuarioActual()?.empresa) === "tecomatlan" ? "selected" : ""}>
                Gas Tecomatlán
            </option>

            <option value="paraiso"
                ${(r?.empresa || usuarioActual()?.empresa) === "paraiso" ? "selected" : ""}>
                Gas El Paraíso
            </option>
        </select>
        `
        : `
        <input
            type="text"
            value="${
              usuarioActual()?.empresa === "paraiso"
                ? "Gas El Paraíso"
                : "Gas Tecomatlán"
            }"
            readonly
            style="background:#f5f5f5">

        <input
            type="hidden"
            id="rf-emp"
            value="${usuarioActual()?.empresa}">
        `
    }
</div>
        </div>
    `;
  document.getElementById("mf").innerHTML = `
        <button class="btn btn-s" onclick="cM()">Cancelar</button>
        <button class="btn btn-p" onclick="savRef('${r?.id || ""}')"><i class="fa-solid fa-save"></i> ${ed ? "Guardar" : "Registrar"}</button>
    `;
  oM();
}
function savRef(id) {
  const codigo = document.getElementById("rf-cod").value.trim();
  const nombre = document.getElementById("rf-nom").value.trim();
  const descripcion = document.getElementById("rf-desc").value.trim();
  const categoria = document.getElementById("rf-cat").value;
  const para_que_es = document.getElementById("rf-para").value.trim();
  const cantidad = parseInt(document.getElementById("rf-cant").value) || 0;
  const stock_minimo = parseInt(document.getElementById("rf-min").value) || 0;
  const precio = parseFloat(document.getElementById("rf-precio").value) || 0;
  const empresa = document.getElementById("rf-emp").value;

  if (!codigo || !nombre || !para_que_es) {
    toast(
      'Código, nombre y "para que es" son obligatorios',
      "er",
      "Dato faltante",
    );
    return;
  }

  const data = {
    codigo,
    nombre,
    descripcion,
    categoria,
    para_que_es,
    cantidad,
    stock_minimo,
    precio,
    empresa,
  };
  const url = id ? `/api/refacciones/${id}` : "/api/refacciones";
  const method = id ? "PUT" : "POST";

  fetch(url, {
    method: method,
    headers: headersAuth(),
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (!res.ok)
        return res.json().then((err) => {
          throw new Error(err.error || "Error al guardar");
        });
      return res.json();
    })
    .then(() => {
      toast(id ? "Refacción actualizada" : "Refacción creada", "ok", "Éxito");
      cM();
      rInv();
      // verificarStock();
    })
    .catch((err) => {
      toast(err.message, "er", "Error");
    });
}
function delRef(id) {
  fetch(`/api/refacciones/${id}`, { headers: headersAuth() })
    .then((res) => {
      if (!res.ok) throw new Error("No se pudo cargar la refacción");
      return res.json();
    })
    .then((r) => {
      document.getElementById("mt").textContent = "Confirmar Eliminación";
      document.getElementById("mb").innerHTML = `
            <div style="text-align:center;padding:10px 0">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:44px;color:var(--d);margin-bottom:14px"></i>
                <p style="font-size:15px;margin-bottom:6px">Vas a eliminar:</p>
                <p style="font-size:17px;font-weight:700">${r.codigo} - ${r.nombre}</p>
            </div>
        `;
      document.getElementById("mf").innerHTML = `
            <button class="btn btn-s" onclick="cM()">Cancelar</button>
            <button class="btn btn-d" onclick="confDelRef('${id}')"><i class="fa-solid fa-trash"></i> Eliminar</button>
        `;
      oM();
    })
    .catch((err) => toast(err.message, "er", "Error"));
}

function confDelRef(id) {
  fetch(`/api/refacciones/${id}`, {
    method: "DELETE",
    headers: headersAuth(),
  })
    .then((res) => {
      if (!res.ok)
        return res.json().then((err) => {
          throw new Error(err.error || "Error al eliminar");
        });
      return res.json();
    })
    .then(() => {
      cM();
      rInv();
      toast("Refacción eliminada", "ok", "Eliminada");
    })
    .catch((err) => {
      toast(err.message, "er", "Error");
      cM();
    });
}
//  NOTAS DE ENTRADA Y SALIDA
function rEnt() {
  const params = qsConEmpresa(new URLSearchParams({ tipo: "entrada" }));

  fetch(`/api/movimientos?${params.toString()}`, { headers: headersAuth() })
    .then((res) => {
      if (!res.ok) throw new Error("Error al cargar entradas");
      return res.json();
    })
    .then((movimientos) => {
      const tb = document.getElementById("tb-ent");
      if (!movimientos.length) {
        tb.innerHTML = `<tr><td colspan="7" class="tv"><i class="fa-solid fa-inbox"></i><p>Sin notas de entrada</p></td></tr>`;
        return;
      }
      tb.innerHTML = movimientos
        .map(
          (m) => `
                <tr>
                    <td style="font-weight:700;color:var(--p)">${m.numero_nota}</td>
                    <td>${ffec(m.fecha)}</td>
                    <td>${m.origen || "N/A"}</td>
                    <td>${m.total_items || 0} art.</td>
                    <td style="font-weight:600">${fmon(m.total_monto || 0)}</td>
                    <td>${eBadge(m.estado)}</td>
                    <td><div class="ail"><button class="bi" onclick="verNota('${m.id}')" title="Ver"><i class="fa-solid fa-eye"></i></button></div></td>
                </tr>
            `,
        )
        .join("");
    })
    .catch((err) => {
      console.error(err);
      toast("Error al cargar entradas: " + err.message, "er", "Error");
    });
}

function rSal() {
  const params = qsConEmpresa(new URLSearchParams({ tipo: "salida" }));

  fetch(`/api/movimientos?${params.toString()}`, { headers: headersAuth() })
    .then((res) => {
      if (!res.ok) throw new Error("Error al cargar salidas");
      return res.json();
    })
    .then((movimientos) => {
      const tb = document.getElementById("tb-sal");
      if (!movimientos.length) {
        tb.innerHTML = `<tr><td colspan="8" class="tv"><i class="fa-solid fa-inbox"></i><p>Sin notas de salida</p></td></tr>`;
        return;
      }
      tb.innerHTML = movimientos
        .map(
          (m) => `
                <tr>
                    <td style="font-weight:700;color:var(--p)">${m.numero_nota}</td>
                    <td>${ffec(m.fecha)}</td>
                    <td>${empBadge(m.empresa)}</td>
                    <td>${m.solicitante_nombre || "N/A"}</td>
                    <td style="font-size:12px">${m.ubicacion_nombre || "N/A"}</td>
                    <td>${m.total_items || 0}</td>
                    <td>${eBadge(m.estado)}</td>
                    <td><div class="ail">
                        <button class="bi" onclick="verNota('${m.id}')" title="Ver"><i class="fa-solid fa-eye"></i></button>
                        ${
                          m.estado === "pendiente"
                            ? `
                            <button class="bi" style="color:var(--a)" onclick="cambEst('${m.id}','completada')" title="Aprobar"><i class="fa-solid fa-check"></i></button>
                            <button class="bi dg" onclick="cambEst('${m.id}','rechazada')" title="Rechazar"><i class="fa-solid fa-xmark"></i></button>
                        `
                            : ""
                        }
                    </div></td>
                </tr>
            `,
        )
        .join("");
    })
    .catch((err) => {
      console.error(err);
      toast("Error al cargar salidas: " + err.message, "er", "Error");
    });
}
// MODAL NOTA
function mNota(tipo) {
  const esE = tipo === "entrada";

  // Guardar el tipo de nota para addFila()
  window._tipoNota = tipo;

  document.getElementById("mt").textContent = esE
    ? "Nueva Nota de Entrada"
    : "Nueva Nota de Salida (Pedimento)";

  const paramsEmpresa = qsConEmpresa(new URLSearchParams());
  const queryEmpresa = paramsEmpresa.toString();

  Promise.all([
    fetch(`/api/refacciones?${queryEmpresa}`, {
      headers: headersAuth(),
    }).then((r) => r.json()),

    fetch(`/api/ubicaciones?${queryEmpresa}`, {
      headers: headersAuth(),
    }).then((r) => r.json()),

    fetch(`/api/usuarios?${queryEmpresa}`, {
      headers: headersAuth(),
    }).then((r) => r.json()),

    fetch(`/api/equipos?${queryEmpresa}`, {
      headers: headersAuth(),
    }).then((r) => r.json()),
  ])
    .then(([refacciones, ubicaciones, usuarios, equipos]) => {
      const optsR = refacciones
        .map(
          (r) => `
            <option
              value="${r.id}"
              data-precio="${Number(r.precio || 0)}"
            >
              ${r.codigo} - ${r.nombre} (Stock: ${r.cantidad})
            </option>
          `,
        )
        .join("");

      let html = "";

      if (esE) {
        html += `
          <div class="fg">
            <label>Proveedor / Origen</label>
            <input
              type="text"
              id="nt-origen"
              placeholder="Ej: Proveedor: Válvulas del Norte"
            >
          </div>
        `;
      } else {
        const optsU = ubicaciones
          .map(
            (u) => `
              <option value="${u.id}">
                ${u.nombre} (${EMP[u.empresa]?.nom || u.empresa})
              </option>
            `,
          )
          .join("");

        const usuariosFiltrados = usuarios.filter(
          (u) => u.rol !== "bodega",
        );

        const optsUs = usuariosFiltrados
          .map(
            (u) => `
              <option value="${u.id}">
                ${u.nombre} (${EMP[u.empresa]?.nom || u.empresa})
              </option>
            `,
          )
          .join("");

        html += `
          <div class="fr">
            <div class="fg">
              <label>Empresa que solicita</label>
              <select id="nt-empresa">
                <option value="tecomatlan">Gas Tecomatlán</option>
                <option value="paraiso">Gas El Paraíso</option>
              </select>
            </div>

            <div class="fg">
              <label>Quién solicita</label>
              <select id="nt-solicita">
                ${optsUs}
              </select>
            </div>
          </div>
        `;

        html += `
          <div class="fg">
            <label>Ubicación destino</label>
            <select
              id="nt-destino"
              onchange="cargarEquiposPorUbicacion()"
            >
              ${optsU}
            </select>
          </div>
        `;

        html += `
          <div class="fg">
            <label>Equipo (Pipa, Trailer, etc.)</label>
            <select id="nt-equipo">
              <option value="">-- Seleccionar equipo --</option>
            </select>
          </div>
        `;
      }

      html += `
        <div style="margin-bottom:14px">
          <label
            style="
              display:block;
              font-weight:600;
              font-size:10px;
              color:var(--tc);
              margin-bottom:6px;
              text-transform:uppercase;
              letter-spacing:.5px
            "
          >
            Refacciones
          </label>

          <div id="nt-items">
            <div
              class="nt-row"
              style="
                display:grid;
                grid-template-columns:1.5fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr 36px;
                gap:6px;
                margin-bottom:6px;
                align-items:end
              "
            >
              <div>
                <select
                  class="nt-r"
                  onchange="actualizarPrecio(this)"
                  style="
                    width:100%;
                    padding:7px;
                    border:2px solid var(--b);
                    border-radius:8px;
                    font-size:12px
                  "
                >
                  ${optsR}
                </select>
              </div>

              <div>
                <input
                  type="number"
                  class="nt-c"
                  value="1"
                  min="1"
                  style="
                    width:100%;
                    padding:7px;
                    border:2px solid var(--b);
                    border-radius:8px;
                    font-size:12px
                  "
                  placeholder="Cant."
                >
              </div>

              <div>
                <input
                  type="number"
                  class="nt-p"
                  value="0"
                  min="0"
                  step="0.01"
                  ${esE ? "" : "readonly"}
                  style="
                    width:100%;
                    padding:7px;
                    border:2px solid var(--b);
                    border-radius:8px;
                    font-size:12px;
                    ${
                      esE
                        ? ""
                        : "background:#f5f5f5;cursor:not-allowed;"
                    }
                  "
                  placeholder="Precio"
                >
              </div>

              <div>
                <select
                  class="nt-tipo"
                  style="
                    width:100%;
                    padding:7px;
                    border:2px solid var(--b);
                    border-radius:8px;
                    font-size:12px
                  "
                >
                  <option value="nueva">Nueva</option>
                  <option value="usada">Usada</option>
                </select>
              </div>

              <div>
                <input
                  type="file"
                  class="nt-foto"
                  accept="image/*"
                  capture="environment"
                  style="
                    width:100%;
                    padding:4px;
                    border:2px solid var(--b);
                    border-radius:8px;
                    font-size:11px
                  "
                >
              </div>

              <button
                class="bi dg"
                onclick="this.closest('.nt-row').remove()"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <button
            class="btn btn-s btn-sm"
            onclick="addFila()"
          >
            <i class="fa-solid fa-plus"></i>
            Agregar refacción
          </button>
        </div>
      `;

      html += `
        <div class="fg">
          <label>Notas / Observaciones</label>
          <textarea
            id="nt-obs"
            placeholder="Observaciones..."
          ></textarea>
        </div>
      `;

      document.getElementById("mb").innerHTML = html;

      document.getElementById("mf").innerHTML = `
        <button class="btn btn-s" onclick="cM()">
          Cancelar
        </button>

        <button
          class="btn btn-${esE ? "e" : "p"}"
          onclick="savNota('${tipo}')"
        >
          <i class="fa-solid fa-save"></i>
          ${esE ? "Registrar Entrada" : "Enviar Salida"}
        </button>
      `;

      window._refacciones = refacciones;
      window._equipos = equipos;

      oM();

      document.querySelectorAll(".nt-r").forEach((select) => {
        actualizarPrecio(select);
      });
    })
    .catch((err) => {
      toast(
        "Error al cargar datos para el formulario",
        "er",
        "Error",
      );

      console.error(err);
    });
}
function cargarEquiposPorUbicacion() {
  const ubicacionId = document.getElementById("nt-destino").value;
  const selectEquipo = document.getElementById("nt-equipo");
  if (!window._equipos) return;

  const filtrados = window._equipos.filter(
    (e) => e.ubicacion_id == ubicacionId && e.activo === true,
  );
  selectEquipo.innerHTML = '<option value="">-- Seleccionar equipo --</option>';
  filtrados.forEach((e) => {
    selectEquipo.innerHTML += `<option value="${e.id}">${e.nombre}</option>`;
  });
}
function addFila() {
  const ref = window._refacciones || [];
  const esEntrada = window._tipoNota === "entrada";

  const opts = ref
    .map(
      (r) => `
        <option
          value="${r.id}"
          data-precio="${Number(r.precio || 0)}"
        >
          ${r.codigo} - ${r.nombre} (Stock: ${r.cantidad})
        </option>
      `,
    )
    .join("");

  const d = document.createElement("div");

  d.className = "nt-row";

  d.style.cssText =
    "display:grid;grid-template-columns:1.5fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr 36px;gap:6px;margin-bottom:6px;align-items:end";

  d.innerHTML = `
    <div>
      <select
        class="nt-r"
        onchange="actualizarPrecio(this)"
        style="width:100%;padding:7px;border:2px solid var(--b);border-radius:8px;font-size:12px"
      >
        ${opts}
      </select>
    </div>

    <div>
      <input
        type="number"
        class="nt-c"
        value="1"
        min="1"
        style="width:100%;padding:7px;border:2px solid var(--b);border-radius:8px;font-size:12px"
      >
    </div>

    <div>
      <input
        type="number"
        class="nt-p"
        value="0"
        min="0"
        step="0.01"
        ${esEntrada ? "" : "readonly"}
        style="
          width:100%;
          padding:7px;
          border:2px solid var(--b);
          border-radius:8px;
          font-size:12px;
          ${
            esEntrada
              ? ""
              : "background:#f5f5f5;cursor:not-allowed;"
          }
        "
      >
    </div>

    <div>
      <select class="nt-tipo">
        <option value="nueva">Nueva</option>
        <option value="usada">Usada</option>
      </select>
    </div>

    <div>
      <input
        type="file"
        class="nt-foto"
        accept="image/*"
      >
    </div>

    <button
      class="bi dg"
      onclick="this.closest('.nt-row').remove()"
    >
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  document.getElementById("nt-items").appendChild(d);

  actualizarPrecio(d.querySelector(".nt-r"));
}
// ESTA FUNCIÓN VA FUERA DE addFila()
function actualizarPrecio(select) {
  const fila = select.closest(".nt-row");
  const inputPrecio = fila.querySelector(".nt-p");
  const opcion = select.options[select.selectedIndex];

  inputPrecio.value = Number(opcion?.dataset.precio || 0).toFixed(2);
}

function savNota(tipo) {
  const esE = tipo === "entrada";
  const origen = esE
    ? document.getElementById("nt-origen").value.trim()
    : "Bodega Central";
  if (esE && !origen) {
    toast("Indica el proveedor", "er", "Dato faltante");
    return;
  }

const filas = document.querySelectorAll(".nt-row");
const items = [];
let err = false;

filas.forEach((f) => {
  const refId = f.querySelector(".nt-r").value;
  const cantidad = Number(f.querySelector(".nt-c").value);
  const precio = Number(f.querySelector(".nt-p").value);
  const tipoRefaccion = f.querySelector(".nt-tipo").value;
  const fotoFile = f.querySelector(".nt-foto").files[0];

  if (!refId) {
    err = true;
    return;
  }

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    err = true;
    return;
  }

  // En entradas el precio nuevo debe ser válido
  if (esE && (!Number.isFinite(precio) || precio <= 0)) {
    err = true;
    return;
  }

  items.push({
    refaccion_id: refId,
    cantidad,
    precio_unitario: precio,
    tipo_refaccion: tipoRefaccion,
    foto: fotoFile,
  });
});

if (!items.length || err) {
  toast(
    esE
      ? "Selecciona una refacción e indica cantidad y precio válidos"
      : "Agrega al menos una refacción con cantidad válida",
    "er",
    "Error",
  );
  return;
}

  // Construir FormData
  const formData = new FormData();
  formData.append("tipo", tipo);
  formData.append("origen", origen);
  formData.append(
    "observaciones",
    document.getElementById("nt-obs").value.trim(),
  );

  const empresaNota = empresaActual || usuarioActual()?.empresa || "tecomatlan";

  if (esE) {
    formData.append("empresa", empresaNota);
    formData.append("ubicacion_destino_id", "");
    formData.append("solicitante_id", "");
    formData.append("equipo_id", "");
  } else {
    formData.append(
      "empresa",
      document.getElementById("nt-empresa").value || empresaNota,
    );
    formData.append(
      "ubicacion_destino_id",
      document.getElementById("nt-destino").value,
    );
    formData.append(
      "solicitante_id",
      document.getElementById("nt-solicita").value,
    );
    formData.append(
      "equipo_id",
      document.getElementById("nt-equipo").value || "",
    );
  }
  // Preparar items como JSON (sin las fotos)
  const itemsData = items.map((it) => ({
    refaccion_id: it.refaccion_id,
    cantidad: it.cantidad,
    precio_unitario: it.precio_unitario,
    tipo_refaccion: it.tipo_refaccion,
  }));
  formData.append("items", JSON.stringify(itemsData));

  // Agregar las fotos (una por cada item)
  items.forEach((it, index) => {
    if (it.foto) {
      formData.append("fotos", it.foto);
    } else {
      // Si no hay foto, enviamos un campo vacío para mantener el índice
      formData.append("fotos", "");
    }
  });

  fetch("/api/movimientos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${obtenerToken()}`,
    },
    body: formData,
  })
    .then((res) => {
      if (!res.ok)
        return res.json().then((err) => {
          throw new Error(err.error || "Error al crear movimiento");
        });
      return res.json();
    })
    .then((mov) => {
      cM();

      nav(tipo === "entrada" ? "entradas" : "salidas");

      toast(
        esE ? "Nota de entrada registrada" : "Solicitud de salida creada",
        "ok",
        mov.numero_nota,
      );
    })
    .catch((err) => toast(err.message, "er", "Error"));
}
function cambEst(id, estado) {
  fetch(`/api/movimientos/${id}/estado`, {
    method: "PUT",
    headers: headersAuth(),
    body: JSON.stringify({ estado }),
  })
    .then((res) => {
      if (!res.ok)
        return res.json().then((err) => {
          throw new Error(err.error || "Error al cambiar estado");
        });
      return res.json();
    })
    .then(() => {
      toast(
        `Nota ${estado === "completada" ? "aprobada" : "rechazada"}`,
        estado === "completada" ? "ok" : "al",
        "Estatus actualizado",
      );
      render(S.sec); // refresca la vista actual
    })
    .catch((err) => toast(err.message, "er", "Error"));
}
function verNota(id) {
  // Primero obtener los equipos para poder mostrar el nombre
  fetch("/api/equipos", { headers: headersAuth() })
    .then((res) => res.json())
    .then((equipos) => {
      window._equipos = equipos; // guardar globalmente
      return fetch(`/api/movimientos/${id}`, { headers: headersAuth() });
    })
    .then((res) => {
      if (!res.ok) throw new Error("Error al obtener detalle");
      return res.json();
    })
    .then((m) => {
      const equipoNombre = m.equipo_id
        ? window._equipos.find((e) => e.id === m.equipo_id)?.nombre ||
          m.equipo_id
        : "N/A";
      const total = m.items.reduce(
        (s, i) => s + i.cantidad * i.precio_unitario,
        0,
      );

      document.getElementById("mt").textContent = "Detalle: " + m.numero_nota;
      document.getElementById("mb").innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">
                <div><span style="font-size:10px;color:var(--tc);text-transform:uppercase">Tipo</span><p style="margin-top:3px"><span class="bd ${m.tipo === "entrada" ? "bd-completada" : "bd-pendiente"}">${m.tipo === "entrada" ? "Entrada" : "Salida"}</span></p></div>
                <div><span style="font-size:10px;color:var(--tc);text-transform:uppercase">Estado</span><p style="margin-top:3px">${eBadge(m.estado)}</p></div>
                <div><span style="font-size:10px;color:var(--tc);text-transform:uppercase">Fecha</span><p style="font-weight:600;margin-top:3px">${ffec(m.fecha)}</p></div>
                <div><span style="font-size:10px;color:var(--tc);text-transform:uppercase">${m.tipo === "entrada" ? "Proveedor" : "Solicitante"}</span><p style="font-weight:600;margin-top:3px">${m.tipo === "entrada" ? m.origen : m.solicitante_nombre || "N/A"}</p></div>
                <div><span style="font-size:10px;color:var(--tc);text-transform:uppercase">Destino</span><p style="font-weight:600;margin-top:3px">${m.tipo === "entrada" ? "Bodega Central" : m.ubicacion_nombre || "N/A"}</p></div>
                <div><span style="font-size:10px;color:var(--tc);text-transform:uppercase">Empresa</span><p style="margin-top:3px">${m.empresa ? empBadge(m.empresa) : "N/A"}</p></div>
                <div>
    <span style="font-size:10px;color:var(--tc);text-transform:uppercase">
        Equipo
    </span>
    <p style="font-weight:600;margin-top:3px">
        ${window._equipos.find((e) => e.id === m.equipo_id)?.tipo || "N/A"}
    </p>
</div>
            </div>
            ${m.observaciones ? `<div style="background:var(--f);padding:10px 14px;border-radius:8px;margin-bottom:16px"><span style="font-size:10px;color:var(--tc);text-transform:uppercase">Observaciones:</span><p style="margin-top:3px;font-size:13px">${m.observaciones}</p></div>` : ""}
            <table style="width:100%;border-collapse:collapse"><thead><tr>
    <th style="text-align:left;padding:8px 10px;background:var(--f);font-size:10px;text-transform:uppercase;color:var(--tc);border-bottom:2px solid var(--b)">Refacción</th>
    <th style="text-align:center;padding:8px 10px;background:var(--f);font-size:10px;text-transform:uppercase;color:var(--tc);border-bottom:2px solid var(--b)">Tipo</th>
    <th style="text-align:center;padding:8px 10px;background:var(--f);font-size:10px;text-transform:uppercase;color:var(--tc);border-bottom:2px solid var(--b)">Foto</th>
    <th style="text-align:right;padding:8px 10px;background:var(--f);font-size:10px;text-transform:uppercase;color:var(--tc);border-bottom:2px solid var(--b)">Cant.</th>
    <th style="text-align:right;padding:8px 10px;background:var(--f);font-size:10px;text-transform:uppercase;color:var(--tc);border-bottom:2px solid var(--b)">P.U.</th>
    <th style="text-align:right;padding:8px 10px;background:var(--f);font-size:10px;text-transform:uppercase;color:var(--tc);border-bottom:2px solid var(--b)">Subtotal</th>
</tr></thead><tbody>
${m.items
  .map(
    (it) => `
    <tr>
        <td style="padding:8px 10px;border-bottom:1px solid var(--b);font-size:12px">${it.codigo} - ${it.refaccion_nombre}</td>
        <td style="padding:8px 10px;border-bottom:1px solid var(--b);font-size:12px;text-align:center">
            <span class="bd ${it.tipo_refaccion === "nueva" ? "bd-completada" : "bd-pendiente"}">${it.tipo_refaccion || "N/A"}</span>
        </td>
        <td style="padding:8px 10px;border-bottom:1px solid var(--b);font-size:12px;text-align:center">
            ${it.foto_url ? `<a href="${it.foto_url}" target="_blank"><i class="fa-solid fa-image" style="font-size:18px;color:var(--p)"></i></a>` : "Sin foto"}
        </td>
        <td style="padding:8px 10px;border-bottom:1px solid var(--b);font-size:12px;text-align:right;font-weight:600">${it.cantidad}</td>
        <td style="padding:8px 10px;border-bottom:1px solid var(--b);font-size:12px;text-align:right">${fmon(it.precio_unitario)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid var(--b);font-size:12px;text-align:right;font-weight:600">${fmon(it.cantidad * it.precio_unitario)}</td>
    </tr>
`,
  )
  .join("")}
</tbody></table>
            <div style="text-align:right;margin-top:12px;font-size:18px;font-weight:900;color:var(--p)">Total: ${fmon(total)}</div>
        `;
      document.getElementById("mf").innerHTML =
        `<button class="btn btn-s" onclick="cM()">Cerrar</button>`;
      oM();
    })
    .catch((err) => toast("Error al cargar detalle", "er", "Error"));
}

// ===== UBICACIONES =====
function rUbi() {
  const ef =
    empresaPermitida() || document.getElementById("f-ub-emp")?.value || "";
  const tf = document.getElementById("f-ub-tipo")?.value || "";

  const params = new URLSearchParams();
  if (ef) params.append("empresa", ef);
  if (tf) params.append("tipo", tf);

  fetch(`/api/ubicaciones?${params.toString()}`, {
    headers: headersAuth(),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Error al obtener ubicaciones");
      return res.json();
    })
    .then((ubicaciones) => {
      const tb = document.getElementById("tb-ubi");
      if (!ubicaciones.length) {
        tb.innerHTML = `<tr><td colspan="8" class="tv"><i class="fa-solid fa-building"></i><p>No hay ubicaciones registradas</p></td></tr>`;
        return;
      }

      tb.innerHTML = ubicaciones
        .map(
          (u) => `
            <tr>
                <td style="font-weight:700">${u.nombre}</td>
                <td>${empBadge(u.empresa)}</td>
                <td>${tipoBadge(u.tipo)}</td>
                <td style="font-size:12px">${u.razon_social || ""}</td>
                <td style="font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${u.domicilio || ""}">${u.domicilio || ""}</td>
                <td style="font-size:11px">${u.permiso || ""}</td>
                <td style="font-size:12px">${u.encargado || ""}</td>
                <td><div class="ail">
                    <button class="bi" onclick="mUbi('${u.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="bi" onclick="verUbi('${u.id}')" title="Ver detalle"><i class="fa-solid fa-eye"></i></button>
                    <button class="bi dg" onclick="delUbi('${u.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </div></td>
            </tr>
        `,
        )
        .join("");
    })
    .catch((err) => {
      toast(err.message, "er", "Error");
    });
}
function mUbi(id) {
  if (id) {
    fetch(`/api/ubicaciones/${id}`, {
      headers: headersAuth(),
    })
      .then((res) => res.json())
      .then((u) => {
        mostrarFormularioUbicacion(u);
      })
      .catch((err) => {
        toast("Error al cargar la ubicación", "er", "Error");
      });
  } else {
    mostrarFormularioUbicacion(null);
  }
}

function mostrarFormularioUbicacion(u) {
  const ed = !!u;
  document.getElementById("mt").textContent = ed
    ? "Editar Ubicación"
    : "Nueva Ubicación";
  document.getElementById("mb").innerHTML = `
        <div class="fr">
            <div class="fg"><label>Nombre de la ubicación</label><input type="text" id="ub-nom" value="${u?.nombre || ""}" placeholder="Ej: Planta Tecomatlán"></div>
            <div class="fg"><label>Tipo</label><select id="ub-tipo">
                <option value="planta" ${u?.tipo === "planta" ? "selected" : ""}>Planta</option>
                <option value="sucursal" ${u?.tipo === "sucursal" ? "selected" : ""}>Sucursal</option>
                <option value="estacion" ${u?.tipo === "estacion" ? "selected" : ""}>Estación</option>
            </select></div>
        </div>
        <div class="fr">
            <div class="fg"><label>Empresa</label><select id="ub-emp">
                <option value="tecomatlan" ${u?.empresa === "tecomatlan" ? "selected" : ""}>Gas Tecomatlán</option>
                <option value="paraiso" ${u?.empresa === "paraiso" ? "selected" : ""}>Gas El Paraíso</option>
            </select></div>
            <div class="fg"><label>Teléfono</label><input type="text" id="ub-tel" value="${u?.telefono || ""}" placeholder="Ej: 222-123-4567"></div>
        </div>
        <div class="fg"><label>Razón Social</label><input type="text" id="ub-razon" value="${u?.razon_social || ""}" placeholder="Razón social completa"></div>
        <div class="fg"><label>Domicilio completo</label><textarea id="ub-dom" placeholder="Calle, número, colonia, municipio, estado">${u?.domicilio || ""}</textarea></div>
        <div class="fr">
            <div class="fg"><label>Número de permiso CRE</label><input type="text" id="ub-perm" value="${u?.permiso || ""}" placeholder="Ej: CRE-PT-2024-0012"></div>
            <div class="fg"><label>Encargado</label><input type="text" id="ub-enc" value="${u?.encargado || ""}" placeholder="Nombre del encargado"></div>
        </div>
        <div class="fg"><label>Notas adicionales</label><textarea id="ub-notas" placeholder="Notas sobre esta ubicación...">${u?.notas || ""}</textarea></div>
    `;
  document.getElementById("mf").innerHTML = `
        <button class="btn btn-s" onclick="cM()">Cancelar</button>
        <button class="btn btn-p" onclick="savUbi('${u?.id || ""}')"><i class="fa-solid fa-save"></i> ${ed ? "Guardar" : "Crear"}</button>
    `;
  oM();
}
function savUbi(id) {
  const nombre = document.getElementById("ub-nom").value.trim();
  const tipo = document.getElementById("ub-tipo").value;
  const empresa = document.getElementById("ub-emp").value;
  const telefono = document.getElementById("ub-tel").value.trim();
  const razon_social = document.getElementById("ub-razon").value.trim();
  const domicilio = document.getElementById("ub-dom").value.trim();
  const permiso = document.getElementById("ub-perm").value.trim();
  const encargado = document.getElementById("ub-enc").value.trim();
  const notas = document.getElementById("ub-notas").value.trim();

  if (!nombre) {
    toast("El nombre es obligatorio", "er", "Dato faltante");
    return;
  }

  const data = {
    nombre,
    tipo,
    empresa,
    telefono,
    razon_social,
    domicilio,
    permiso,
    encargado,
    notas,
  };
  const url = id ? `/api/ubicaciones/${id}` : "/api/ubicaciones";
  const method = id ? "PUT" : "POST";

  fetch(url, {
    method: method,
    headers: headersAuth(),
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (!res.ok)
        return res.json().then((err) => {
          throw new Error(err.error || "Error al guardar");
        });
      return res.json();
    })
    .then(() => {
      toast(id ? "Ubicación actualizada" : "Ubicación creada", "ok", "Éxito");
      cM();
      rUbi();
    })
    .catch((err) => {
      toast(err.message, "er", "Error");
    });
}
function verUbi(id) {
  fetch(`/ubicaciones/${id}`, {
    headers: headersAuth(),
  })
    .then((res) => res.json())
    .then((u) => {
      document.getElementById("mt").textContent = u.nombre;
      document.getElementById("mb").innerHTML = `
            <div style="margin-bottom:14px">${empBadge(u.empresa)} ${tipoBadge(u.tipo)}</div>
            <div class="udg">
                <div class="cp"><div class="cl">Razón Social</div><div class="cv">${u.razon_social || "N/A"}</div></div>
                <div class="cp"><div class="cl">Domicilio</div><div class="cv">${u.domicilio || "N/A"}</div></div>
                <div class="cp"><div class="cl">Permiso CRE</div><div class="cv">${u.permiso || "N/A"}</div></div>
                <div class="cp"><div class="cl">Teléfono</div><div class="cv">${u.telefono || "N/A"}</div></div>
                <div class="cp"><div class="cl">Encargado</div><div class="cv">${u.encargado || "N/A"}</div></div>
                <div class="cp"><div class="cl">Notas</div><div class="cv">${u.notas || "Sin notas"}</div></div>
            </div>
        `;
      document.getElementById("mf").innerHTML =
        `<button class="btn btn-s" onclick="cM()">Cerrar</button>`;
      oM();
    })
    .catch((err) => {
      toast("Error al cargar la ubicación", "er", "Error");
    });
}
function delUbi(id) {
  // Mostrar confirmación
  document.getElementById("mt").textContent = "Confirmar Eliminación";
  document.getElementById("mb").innerHTML = `
        <div style="text-align:center;padding:10px 0">
            <i class="fa-solid fa-triangle-exclamation" style="font-size:44px;color:var(--d);margin-bottom:14px"></i>
            <p style="font-size:15px;margin-bottom:6px">Vas a eliminar la ubicación:</p>
            <p style="font-size:17px;font-weight:700" id="ubi-nom-eliminar">Cargando...</p>
            <p style="font-size:13px;color:var(--tc);margin-top:6px">Asegúrate de que no haya usuarios ni movimientos asociados.</p>
        </div>
    `;
  document.getElementById("mf").innerHTML = `
        <button class="btn btn-s" onclick="cM()">Cancelar</button>
        <button class="btn btn-d" onclick="confDelUbi('${id}')"><i class="fa-solid fa-trash"></i> Eliminar</button>
    `;
  oM();

  // Obtener nombre de la ubicación para mostrarlo en el modal
  fetch(`/ubicaciones/${id}`, { headers: headersAuth() })
    .then((res) => res.json())
    .then((u) => {
      const el = document.getElementById("ubi-nom-eliminar");
      if (el) el.textContent = u.nombre;
    })
    .catch(() => {});
}

function confDelUbi(id) {
  fetch(`/ubicaciones/${id}`, {
    method: "DELETE",
    headers: headersAuth(),
  })
    .then((res) => {
      if (!res.ok)
        return res.json().then((err) => {
          throw new Error(err.error || "Error al eliminar");
        });
      return res.json();
    })
    .then(() => {
      cM();
      rUbi();
      toast("Ubicación eliminada", "ok", "Eliminada");
    })
    .catch((err) => {
      toast(err.message, "er", "Error");
      cM();
    });
}
// Equipos
function rEquipos() {
  const empresa =
    empresaPermitida() || document.getElementById("f-equipo-emp")?.value || "";
  const tipo = document.getElementById("f-equipo-tipo")?.value || "";

  const params = new URLSearchParams();
  if (empresa) params.append("empresa", empresa);
  if (tipo) params.append("tipo", tipo);

  fetch(`/api/equipos?${params.toString()}`, {
    headers: headersAuth(),
  })
    .then((res) => res.json())
    .then((equipos) => {
      const tb = document.getElementById("tb-equipos");
      if (!equipos.length) {
        tb.innerHTML = `<tr><td colspan="6" class="tv"><i class="fa-solid fa-truck"></i><p>No hay equipos registrados</p></td></tr>`;
        return;
      }
      tb.innerHTML = equipos
        .map(
          (e) => `
            <tr>
                <td style="font-weight:700">${e.nombre}</td>
                <td>${empBadge(e.empresa)}</td>
                <td><span class="bd ${e.tipo === "pipa" ? "bd-pipa" : e.tipo === "trailer" ? "bd-trailer" : e.tipo === "estacion" ? "bd-t3" : "bd-otro"}">${e.tipo.charAt(0).toUpperCase() + e.tipo.slice(1)}</span></td>
                <td style="font-size:12px">${e.ubicacion_id ? "Cargando..." : "Sin asignar"}</td>
                <td>${e.activo ? '<span class="bd bd-ok">Activo</span>' : '<span class="bd bd-bajo">Inactivo</span>'}</td>
                <td><div class="ail">
                    <button class="bi" onclick="mEquipo('${e.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="bi dg" onclick="delEquipo('${e.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </div></td>
            </tr>
        `,
        )
        .join("");

      // Cargar nombres de ubicaciones para cada equipo (fetch adicional o usar cache)
      // Como tenemos pocos equipos, podemos hacer un fetch a /ubicaciones y reemplazar
      fetch("/api/ubicaciones", { headers: headersAuth() })
        .then((res) => res.json())
        .then((ubicaciones) => {
          const mapa = Object.fromEntries(
            ubicaciones.map((u) => [u.id, u.nombre]),
          );
          document.querySelectorAll("#tb-equipos tr").forEach((row, index) => {
            if (index < equipos.length) {
              const ubicacionId = equipos[index].ubicacion_id;
              const celda = row.querySelector("td:nth-child(4)");
              if (celda && ubicacionId) {
                celda.textContent = mapa[ubicacionId] || "Sin asignar";
              }
            }
          });
        });
    })
    .catch((err) => {
      toast("Error al cargar equipos", "er", "Error");
      console.error(err);
    });
}
function mEquipo(id) {
  // Cargar ubicaciones para el select
  fetch("/api/ubicaciones", { headers: headersAuth() })
    .then((res) => res.json())
    .then((ubicaciones) => {
      const optsU = ubicaciones
        .map(
          (u) =>
            `<option value="${u.id}">${u.nombre} (${EMP[u.empresa]?.nom || u.empresa})</option>`,
        )
        .join("");

      let html = "";
      if (id) {
        // Si es edición, obtener datos del equipo
        fetch(`/equipos/${id}`, { headers: headersAuth() })
          .then((res) => res.json())
          .then((equipo) => {
            mostrarFormularioEquipo(equipo, optsU);
          });
      } else {
        mostrarFormularioEquipo(null, optsU);
      }
    })
    .catch((err) => {
      toast("Error al cargar ubicaciones", "er", "Error");
      console.error(err);
    });
}

function mostrarFormularioEquipo(equipo, optsU) {
  const ed = !!equipo;
  document.getElementById("mt").textContent = ed
    ? "Editar Equipo"
    : "Nuevo Equipo";

  document.getElementById("mb").innerHTML = `
        <div class="fr">
            <div class="fg"><label>Nombre del equipo</label><input type="text" id="eq-nombre" value="${equipo?.nombre || ""}" placeholder="Ej: Pipa 01"></div>
            <div class="fg"><label>Tipo</label><select id="eq-tipo">
                <option value="pipa" ${equipo?.tipo === "pipa" ? "selected" : ""}>Pipa</option>
                <option value="trailer" ${equipo?.tipo === "trailer" ? "selected" : ""}>Trailer</option>
                <option value="estacion" ${equipo?.tipo === "estacion" ? "selected" : ""}>Estación</option>
                <option value="otro" ${equipo?.tipo === "otro" ? "selected" : ""}>Otro</option>
            </select></div>
        </div>
        <div class="fr">
            <div class="fg"><label>Empresa</label><select id="eq-empresa">
                <option value="tecomatlan" ${equipo?.empresa === "tecomatlan" ? "selected" : ""}>Gas Tecomatlán</option>
                <option value="paraiso" ${equipo?.empresa === "paraiso" ? "selected" : ""}>Gas El Paraíso</option>
            </select></div>
            <div class="fg"><label>Ubicación (opcional)</label><select id="eq-ubicacion">
                <option value="">-- Sin ubicación --</option>
                ${optsU}
            </select></div>
        </div>
        <div class="fg">
            <label><input type="checkbox" id="eq-activo" ${equipo?.activo !== false ? "checked" : ""}> Activo</label>
        </div>
    `;

  // Establecer el valor de ubicación si existe
  if (equipo?.ubicacion_id) {
    document.getElementById("eq-ubicacion").value = equipo.ubicacion_id;
  }

  document.getElementById("mf").innerHTML = `
        <button class="btn btn-s" onclick="cM()">Cancelar</button>
        <button class="btn btn-p" onclick="savEquipo('${equipo?.id || ""}')"><i class="fa-solid fa-save"></i> ${ed ? "Guardar" : "Crear"}</button>
    `;
  oM();
}

function savEquipo(id) {
  const nombre = document.getElementById("eq-nombre").value.trim();
  const tipo = document.getElementById("eq-tipo").value;
  const empresa = document.getElementById("eq-empresa").value;
  const ubicacion_id = document.getElementById("eq-ubicacion").value || null;
  const activo = document.getElementById("eq-activo").checked;

  if (!nombre || !tipo || !empresa) {
    toast("Nombre, tipo y empresa son obligatorios", "er", "Dato faltante");
    return;
  }

  const data = { nombre, tipo, empresa, ubicacion_id, activo };
  const url = id ? `/api/equipos/${id}` : "/api/equipos";
  const method = id ? "PUT" : "POST";

  fetch(url, {
    method: method,
    headers: headersAuth(),
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (!res.ok)
        return res.json().then((err) => {
          throw new Error(err.error || "Error al guardar");
        });
      return res.json();
    })
    .then(() => {
      toast(id ? "Equipo actualizado" : "Equipo creado", "ok", "Éxito");
      cM();
      rEquipos();
    })
    .catch((err) => {
      toast(err.message, "er", "Error");
    });
}
function delEquipo(id) {
  // Obtener el nombre del equipo para mostrarlo en la confirmación
  fetch(`/equipos/${id}`, { headers: headersAuth() })
    .then((res) => res.json())
    .then((equipo) => {
      if (!equipo) return;
      document.getElementById("mt").textContent = "Confirmar Eliminación";
      document.getElementById("mb").innerHTML = `
                <div style="text-align:center;padding:10px 0">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:44px;color:var(--d);margin-bottom:14px"></i>
                    <p style="font-size:15px;margin-bottom:6px">Vas a eliminar el equipo:</p>
                    <p style="font-size:17px;font-weight:700">${equipo.nombre}</p>
                    <p style="font-size:13px;color:var(--tc);margin-top:6px">Si tiene movimientos asociados, no se podrá eliminar.</p>
                </div>
            `;
      document.getElementById("mf").innerHTML = `
                <button class="btn btn-s" onclick="cM()">Cancelar</button>
                <button class="btn btn-d" onclick="confDelEquipo('${id}')"><i class="fa-solid fa-trash"></i> Eliminar</button>
            `;
      oM();
    })
    .catch((err) => {
      toast("Error al cargar datos del equipo", "er", "Error");
    });
}

function confDelEquipo(id) {
  fetch(`/equipos/${id}`, {
    method: "DELETE",
    headers: headersAuth(),
  })
    .then((res) => {
      if (!res.ok)
        return res.json().then((err) => {
          throw new Error(err.error || "Error al eliminar");
        });
      return res.json();
    })
    .then(() => {
      cM();
      rEquipos();
      toast("Equipo eliminado", "ok", "Eliminado");
    })
    .catch((err) => {
      toast(err.message, "er", "Error");
      cM();
    });
}
// ===== USUARIOS =====
function normalizarUsuario(u) {
  return {
    id: u.id,
    nom: u.nombre || u.nom || "",
    user: u.usuario || u.user || "",
    empresa: u.empresa || "",
    ubicacion: u.ubicacion_id || u.ubicacion || "",
    ubicacion_nombre: u.ubicacion_nombre || "",
    rol: u.rol || "",
    activo: u.activo !== false,
  };
}

function rUsu() {
  const ef = document.getElementById("f-us-emp")?.value || "";
  const params = new URLSearchParams();
  if (ef) params.append("empresa", ef);
  Promise.all([
    fetch("/api/usuarios?" + params.toString(), {
      headers: headersAuth(),
    }).then((r) => {
      if (!r.ok) throw new Error("Error al cargar usuarios");
      return r.json();
    }),
    fetch("/api/ubicaciones", { headers: headersAuth() }).then((r) =>
      r.ok ? r.json() : [],
    ),
  ])
    .then(([usuarios, ubicaciones]) => {
      const mapaUbi = Object.fromEntries(
        ubicaciones.map((u) => [u.id, u.nombre]),
      );
      let us = usuarios
        .map(normalizarUsuario)
        .filter((u) => u.rol !== "bodega" && u.activo);
      if (ef) us = us.filter((u) => u.empresa === ef);
      const tb = document.getElementById("tb-usu");
      tb.innerHTML = us.length
        ? us
            .map(
              (u) => `<tr>
        <td style="font-weight:600">${u.nom}</td>
        <td><code style="background:var(--f);padding:2px 7px;border-radius:4px;font-size:12px">${u.user}</code></td>
        <td>${empBadge(u.empresa)}</td>
        <td style="font-size:12px">${u.ubicacion_nombre || mapaUbi[u.ubicacion] || "Sin asignar"}</td>
        <td><span class="bd ${u.rol === "encargado" ? "bd-t1" : "bd-otro"}">${rolTxt(u.rol)}</span></td>
        <td><div class="ail"><button class="bi" onclick="mUsu('${u.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button><button class="bi dg" onclick="delUsu('${u.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button></div></td>
        </tr>`,
            )
            .join("")
        : `<tr><td colspan="6" class="tv"><i class="fa-solid fa-users"></i><p>No hay usuarios</p></td></tr>`;
    })
    .catch((err) => toast(err.message, "er", "Error"));
}

function mUsu(id) {
  Promise.all([
    fetch("/api/usuarios", { headers: headersAuth() }).then((r) => {
      if (!r.ok) throw new Error("Error al cargar usuarios");
      return r.json();
    }),
    fetch("/api/ubicaciones", { headers: headersAuth() }).then((r) => {
      if (!r.ok) throw new Error("Error al cargar ubicaciones");
      return r.json();
    }),
  ])
    .then(([usuarios, ubis]) => {
      const us = usuarios.map(normalizarUsuario);
      const u = id ? us.find((x) => String(x.id) === String(id)) : null;
      const ed = !!u;
      const optsU = ubis
        .map(
          (x) =>
            `<option value="${x.id}" ${u?.ubicacion == x.id ? "selected" : ""}>${x.nombre} (${EMP[x.empresa]?.nom || x.empresa})</option>`,
        )
        .join("");
      document.getElementById("mt").textContent = ed
        ? "Editar Usuario"
        : "Nuevo Usuario";
      document.getElementById("mb").innerHTML = `
        <div class="fg"><label>Nombre completo</label><input type="text" id="us-nom" value="${u?.nom || ""}" placeholder="Ej: Juan Perez Garcia"></div>
        <div class="fr"><div class="fg"><label>Usuario (login)</label><input type="text" id="us-user" value="${u?.user || ""}" placeholder="Ej: juan" ${ed ? 'readonly style="background:#f5f5f5"' : ""}></div><div class="fg"><label>Contrasena</label><input type="password" id="us-pass" value="" placeholder="${ed ? "Dejar vacio para no cambiar" : "Contrasena"}"></div></div>
        <div class="fr"><div class="fg"><label>Empresa</label><select id="us-emp"><option value="tecomatlan" ${u?.empresa === "tecomatlan" ? "selected" : ""}>Gas Tecomatlan</option><option value="paraiso" ${u?.empresa === "paraiso" ? "selected" : ""}>Gas El Paraiso</option></select></div><div class="fg"><label>Rol</label><select id="us-rol"><option value="encargado" ${u?.rol === "encargado" ? "selected" : ""}>Encargado General</option><option value="solicitante" ${u?.rol === "solicitante" ? "selected" : ""}>Solicitante</option></select></div></div>
        <div class="fg"><label>Ubicacion asignada</label><select id="us-ubi"><option value="">-- Seleccionar --</option>${optsU}</select></div>`;
      document.getElementById("mf").innerHTML =
        `<button class="btn btn-s" onclick="cM()">Cancelar</button><button class="btn btn-p" onclick="savUsu('${id || ""}')"><i class="fa-solid fa-save"></i> ${ed ? "Guardar" : "Crear"}</button>`;
      oM();
    })
    .catch((err) => toast(err.message, "er", "Error"));
}

function savUsu(id) {
  const nombre = document.getElementById("us-nom").value.trim();
  const usuario = document.getElementById("us-user").value.trim().toLowerCase();
  const contrasena = document.getElementById("us-pass").value;
  const empresa = document.getElementById("us-emp").value;
  const rol = document.getElementById("us-rol").value;
  const ubicacion_id = document.getElementById("us-ubi").value || null;
  if (!nombre || !usuario) {
    toast("Nombre y usuario son obligatorios", "er", "Dato faltante");
    return;
  }
  if (!id && !contrasena) {
    toast("La contrasena es obligatoria", "er", "Dato faltante");
    return;
  }
  const data = { nombre, usuario, empresa, ubicacion_id, rol, activo: true };
  if (contrasena) data.contrasena = contrasena;
  fetch(id ? `/api/usuarios/${id}` : "/api/usuarios", {
    method: id ? "PUT" : "POST",
    headers: headersAuth(),
    body: JSON.stringify(data),
  })
    .then((r) =>
      r.ok
        ? r.json()
        : r.json().then((e) => {
            throw new Error(e.error || "Error al guardar usuario");
          }),
    )
    .then(() => {
      toast(
        id ? "Usuario actualizado" : "Usuario creado",
        "ok",
        id ? "Actualizado" : "Nuevo usuario",
      );
      cM();
      rUsu();
    })
    .catch((err) => toast(err.message, "er", "Error"));
}

function delUsu(id) {
  document.getElementById("mt").textContent = "Confirmar Eliminacion";
  document.getElementById("mb").innerHTML =
    `<div style="text-align:center;padding:10px 0"><i class="fa-solid fa-triangle-exclamation" style="font-size:44px;color:var(--d);margin-bottom:14px"></i><p style="font-size:15px;margin-bottom:6px">Vas a eliminar/desactivar este usuario.</p></div>`;
  document.getElementById("mf").innerHTML =
    `<button class="btn btn-s" onclick="cM()">Cancelar</button><button class="btn btn-d" onclick="confDelUsu('${id}')"><i class="fa-solid fa-trash"></i> Eliminar</button>`;
  oM();
}
function confDelUsu(id) {
  fetch(`/usuarios/${id}`, { method: "DELETE", headers: headersAuth() })
    .then((r) =>
      r.ok
        ? r.json()
        : r.json().then((e) => {
            throw new Error(e.error || "Error al eliminar usuario");
          }),
    )
    .then(() => {
      cM();
      rUsu();
      toast("Usuario eliminado", "ok", "Eliminado");
    })
    .catch((err) => {
      cM();
      toast(err.message, "er", "Error");
    });
}

// ===== REPORTES =====
function paramsReportes(tipo = null) {
  const params = new URLSearchParams();
  const fi = document.getElementById("rep-fecha-inicio")?.value || "";
  const ff = document.getElementById("rep-fecha-fin")?.value || "";
  const emp =
    empresaPermitida() || document.getElementById("rep-empresa")?.value || "";
  const txt = document.getElementById("rep-busqueda")?.value.trim() || "";
  const rep =
    tipo || document.getElementById("rep-tipo")?.value || "movimientos";

  params.append("tipo", rep);
  if (fi) params.append("fechaInicio", fi);
  if (ff) params.append("fechaFin", ff);
  if (emp) params.append("empresa", emp);
  if (txt) params.append("texto", txt);
  return params;
}

function rReportes() {
  aplicarEmpresaAFiltros();
  const resumen = document.getElementById("rep-resumen");
  const body = document.getElementById("tb-rep");
  const head = document.getElementById("tb-rep-head");
  if (resumen)
    resumen.textContent =
      "Usa los filtros y presiona Buscar para ver el reporte en pantalla.";
  if (head) head.innerHTML = "";
  if (body)
    body.innerHTML = `<tr><td class="tv"><i class="fa-solid fa-magnifying-glass"></i><p>Sin busqueda realizada</p></td></tr>`;
}

function buscarReportes() {
  const params = paramsReportes();
  const body = document.getElementById("tb-rep");
  const head = document.getElementById("tb-rep-head");
  const resumen = document.getElementById("rep-resumen");

  if (body)
    body.innerHTML = `<tr><td class="tv"><i class="fa-solid fa-spinner fa-spin"></i><p>Buscando reporte...</p></td></tr>`;

  fetch(`/api/reportes/buscar?${params.toString()}`, { headers: headersAuth() })
    .then((r) => {
      if (!r.ok) throw new Error("No se pudo obtener el reporte");
      return r.json();
    })
    .then((data) => {
      const rows = data.rows || [];
      if (resumen)
        resumen.textContent = `${data.titulo || "Reporte"}: ${rows.length} registro(s) encontrado(s).`;

      if (!rows.length) {
        if (head) head.innerHTML = "";
        if (body)
          body.innerHTML = `<tr><td class="tv"><i class="fa-solid fa-inbox"></i><p>Sin resultados con esos filtros</p></td></tr>`;
        return;
      }

      const cols = Object.keys(rows[0]);
      if (head)
        head.innerHTML = `<tr>${cols.map((c) => `<th>${c.replaceAll("_", " ")}</th>`).join("")}</tr>`;
      if (body) {
        body.innerHTML = rows
          .map((row) => {
            return `<tr>${cols.map((c) => `<td>${formatoCeldaReporte(row[c], c)}</td>`).join("")}</tr>`;
          })
          .join("");
      }
    })
    .catch((err) => {
      if (body)
        body.innerHTML = `<tr><td class="tv"><i class="fa-solid fa-circle-exclamation"></i><p>${err.message}</p></td></tr>`;
      toast(err.message, "er", "Error");
    });
}

function formatoCeldaReporte(valor, columna) {
  if (valor === null || valor === undefined) return "";
  if (columna === "empresa") return EMP[valor]?.nom || valor;
  if (columna === "fecha") return ffec(valor);
  if (["importe", "precio", "precio_unitario", "valor_total"].includes(columna))
    return fmon(valor);
  if (columna === "tipo")
    return valor === "entrada"
      ? "Entrada"
      : valor === "salida"
        ? "Salida"
        : valor;
  return String(valor);
}

function limpiarReportes() {
  ["rep-fecha-inicio", "rep-fecha-fin", "rep-busqueda"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const emp = document.getElementById("rep-empresa");
  if (emp && !emp.disabled) emp.value = "";
  const tipo = document.getElementById("rep-tipo");
  if (tipo) tipo.value = "movimientos";
  rReportes();
}

function descargarReporte(tipo, formato) {
  const token = obtenerToken();
  const params = new URLSearchParams();

  const fechaInicio = document.getElementById("rep-fecha-inicio")?.value;
  const fechaFin = document.getElementById("rep-fecha-fin")?.value;
  const empresa = document.getElementById("rep-empresa")?.value;
  const texto = document.getElementById("rep-busqueda")?.value;

  if (fechaInicio) params.append("fechaInicio", fechaInicio);
  if (fechaFin) params.append("fechaFin", fechaFin);
  if (empresa) params.append("empresa", empresa);
  if (texto) params.append("texto", texto);

  params.append("token", token);

  window.open(
    `/api/reportes/${tipo}/${formato}?${params.toString()}`,
    "_blank",
  );
}

// ===== ALERTAS =====
function mapAlerta(a) {
  return {
    id: a.id,
    fec: a.fecha || a.fec,
    tipo: a.tipo,
    msg: a.mensaje || a.msg,
    empresa: a.empresa,
    leida: a.leida,
  };
}
function rAle() {
  fetch("/api/alertas", {
    headers: headersAuth(),
  })
    .then((r) => {
      if (!r.ok) throw new Error("Error al cargar alertas");
      return r.json();
    })
    .then((data) => {
      const ale = data
        .map(mapAlerta)
        .sort((a, b) => new Date(b.fec) - new Date(a.fec));
      const c = document.getElementById("lst-al");
      if (!ale.length) {
        c.innerHTML =
          '<div class="tv"><i class="fa-solid fa-bell-slash"></i><p>No hay alertas</p></div>';
        return;
      }
      const im = {
        solicitud: "fa-paper-plane",
        stock: "fa-box-open",
        entrada: "fa-arrow-right-to-bracket",
      };
      c.innerHTML = ale
        .map(
          (a) =>
            `<div class="ai ${a.leida ? "" : "nl"}" onclick="marcarLeida('${a.id}')"><div class="aic ${a.tipo}"><i class="fa-solid ${im[a.tipo] || "fa-bell"}"></i></div><div class="aix"><strong>${a.msg}</strong><p>${trel(a.fec)} ${a.empresa ? "- " + EMP[a.empresa]?.nom : ""}</p></div><div class="aih">${fhor(a.fec)}</div></div>`,
        )
        .join("");
    })
    .catch((err) => toast(err.message, "er", "Error"));
}
function marcarLeida(id) {
  fetch(`/api/alertas/${id}/leida`, {
    method: "PUT",
    headers: headersAuth(),
  }).then(() => {
    rAle();
    updB();
  });
}
function marcarTodas() {
  fetch("/api/alertas/marcar-todas/leidas", {
    method: "PUT",
    headers: headersAuth(),
  }).then(() => {
    rAle();
    updB();
    toast("Todas las alertas leidas", "ok", "Listo");
  });
}

// ===== VERIFICAR STOCK =====
function verificarStock() {
  const params = qsConEmpresa(new URLSearchParams());

  fetch(`/api/alertas/verificar-stock?${params.toString()}`, {
    method: "POST",
    headers: headersAuth(),
  })
    .then((res) => {
      if (!res.ok) {
        console.warn("No se pudo verificar stock");
        return null;
      }
      return res.json();
    })
    .then(() => {
      if (typeof updB === "function") updB();
    })
    .catch((err) => {
      console.warn("Error al verificar stock:", err.message);
    });
}

// ===== BADGES =====
function updB() {
  fetch("/api/alertas", { headers: headersAuth() })
    .then((r) => (r.ok ? r.json() : []))
    .then((ale) => {
      const nl = ale.filter((a) => !a.leida).length;
      const b1 = document.getElementById("nb-al"),
        b2 = document.getElementById("ba-al");
      if (!b1 || !b2) return;
      if (nl > 0) {
        b1.style.display = "";
        b1.textContent = nl;
        b2.style.display = "";
        b2.textContent = nl;
      } else {
        b1.style.display = "none";
        b2.style.display = "none";
      }
    });
  fetch("/api/movimientos?tipo=salida&estado=pendiente", {
    headers: headersAuth(),
  })
    .then((r) => (r.ok ? r.json() : []))
    .then((mov) => {
      const b3 = document.getElementById("nb-sal");
      if (!b3) return;
      if (mov.length > 0) {
        b3.style.display = "";
        b3.textContent = mov.length;
      } else {
        b3.style.display = "none";
      }
    });
}

// ===== MODAL =====
function oM() {
  document.getElementById("mo").classList.add("vis");
  document.body.style.overflow = "hidden";
}
function cM() {
  document.getElementById("mo").classList.remove("vis");
  document.body.style.overflow = "";
}
document.getElementById("mo").addEventListener("click", function (e) {
  if (e.target === this) cM();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cM();
});

// ===== TOAST =====
function toast(msg, tipo = "ok", tit = "") {
  const c = document.getElementById("toc");
  const im = {
    ok: "fa-circle-check",
    er: "fa-circle-xmark",
    al: "fa-circle-exclamation",
  };
  const d = document.createElement("div");
  d.className = "toast t-" + tipo;
  d.innerHTML = `<div class="toast-i"><i class="fa-solid ${im[tipo] || "fa-bell"}"></i></div><div class="toast-t">${tit ? "<strong>" + tit + "</strong>" : ""}<span>${msg}</span></div>`;
  c.appendChild(d);
  setTimeout(() => {
    d.classList.add("out");
    setTimeout(() => d.remove(), 300);
  }, 4000);
}
