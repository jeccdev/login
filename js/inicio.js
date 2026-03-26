// Claves compartidas de sesión y mensajería temporal entre vistas.
const claveSesion = "sesion_login_segura";
const claveMensajeLogin = "mensaje_login_seguro";

// Cierre automático tras inactividad para reducir riesgo en equipos compartidos.
const duracionInactividadMs = 10 * 60 * 1000;

// Referencias de interfaz.
const botonTema = document.getElementById("botonTema");
const textoTema = document.getElementById("textoTema");
const iconoTema = document.getElementById("iconoTema");
const textoSesion = document.getElementById("textoSesion");
const botonCerrarSesion = document.getElementById("botonCerrarSesion");

let intervaloSeguridad = null;

function aplicarTema(tema) {
  document.documentElement.setAttribute("data-tema", tema);
  const esOscuro = tema === "oscuro";
  textoTema.textContent = esOscuro ? "Claro" : "Oscuro";
  iconoTema.textContent = esOscuro ? "☀️" : "🌙";
  botonTema.setAttribute("aria-pressed", String(esOscuro));
  localStorage.setItem("temaPreferido", tema);
}

function alternarTema() {
  const actual = document.documentElement.getAttribute("data-tema") || "claro";
  aplicarTema(actual === "claro" ? "oscuro" : "claro");
}

function guardarMensajeLogin(mensaje) {
  sessionStorage.setItem(claveMensajeLogin, mensaje);
}

function cerrarSesion(mensaje) {
  sessionStorage.removeItem(claveSesion);
  if (mensaje) {
    guardarMensajeLogin(mensaje);
  }
  window.location.replace("./index.html");
}

function leerSesion() {
  try {
    const valor = sessionStorage.getItem(claveSesion);
    if (!valor) {
      return null;
    }

    const sesion = JSON.parse(valor);
    const estructuraValida = typeof sesion?.correo === "string"
      && typeof sesion?.nonce === "string"
      && typeof sesion?.fechaInicio === "number"
      && typeof sesion?.ultimaActividad === "number"
      && typeof sesion?.expiraEn === "number";

    if (!estructuraValida) {
      return null;
    }

    if (!/^[a-f0-9]{32}$/i.test(sesion.nonce)) {
      return null;
    }

    if (Date.now() >= sesion.expiraEn) {
      return null;
    }

    return sesion;
  } catch {
    return null;
  }
}

function guardarSesion(sesion) {
  sessionStorage.setItem(claveSesion, JSON.stringify(sesion));
}

function actualizarActividadSesion() {
  const sesion = leerSesion();
  if (!sesion) {
    return;
  }
  sesion.ultimaActividad = Date.now();
  guardarSesion(sesion);
}

function validarSesionActiva() {
  const sesion = leerSesion();
  if (!sesion) {
    cerrarSesion("Tu sesión no es válida. Inicia sesión nuevamente.");
    return null;
  }

  if (Date.now() - sesion.ultimaActividad > duracionInactividadMs) {
    cerrarSesion("Sesión cerrada por inactividad.");
    return null;
  }

  return sesion;
}

function iniciarMonitorSeguridad() {
  if (intervaloSeguridad) {
    clearInterval(intervaloSeguridad);
  }

  intervaloSeguridad = setInterval(() => {
    validarSesionActiva();
  }, 30 * 1000);
}

function inicializar() {
  const sesion = validarSesionActiva();
  if (!sesion) {
    return;
  }

  textoSesion.textContent = `Sesión activa con: ${sesion.correo}`;

  // Registrar actividad del usuario para evitar cierres durante uso real.
  const eventosActividad = ["click", "keydown", "mousemove", "touchstart", "scroll"];
  eventosActividad.forEach((evento) => {
    window.addEventListener(evento, actualizarActividadSesion, { passive: true });
  });

  botonTema.addEventListener("click", alternarTema);
  botonCerrarSesion.addEventListener("click", () => {
    cerrarSesion("Sesión finalizada correctamente.");
  });

  aplicarTema(localStorage.getItem("temaPreferido") || "claro");
  iniciarMonitorSeguridad();
}

inicializar();
