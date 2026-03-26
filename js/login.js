// Referencias de interfaz
const formularioLogin = document.getElementById("formularioLogin");
const campoCorreo = document.getElementById("campoCorreo");
const campoContrasena = document.getElementById("campoContrasena");
const mensajeCorreo = document.getElementById("mensajeCorreo");
const mensajeContrasena = document.getElementById("mensajeContrasena");
const botonVisorContrasena = document.getElementById("botonVisorContrasena");
const botonEnviar = document.getElementById("botonEnviar");
const textoBotonEnviar = botonEnviar.querySelector(".texto-boton");
const botonTema = document.getElementById("botonTema");
const textoTema = document.getElementById("textoTema");
const iconoTema = document.getElementById("iconoTema");
const notificacionFlotante = document.getElementById("notificacionFlotante");

// Configuración de seguridad
const claveSesion = "sesion_login_segura";
const claveEstadoSeguridad = "estado_seguridad_login_v1";
const claveMensajeLogin = "mensaje_login_seguro";

const correoPermitido = "test@gmail.com";
const hashContrasenaPermitida = "ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae";
const intentosMaximos = 5;
const bloqueoBaseMs = 60 * 1000;
const bloqueoMaximoMs = 15 * 60 * 1000;
const duracionSesionMs = 15 * 60 * 1000;

// Estado de interfaz
const estadoInterfaz = {
  tema: localStorage.getItem("temaPreferido") || "claro",
  enviando: false,
  temporizadorNotificacion: null,
  intervaloBloqueo: null,
};

function normalizarCorreo(correo) {
  return correo.trim().toLowerCase();
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generarTokenHex(longitudBytes = 16) {
  const arreglo = new Uint8Array(longitudBytes);
  crypto.getRandomValues(arreglo);
  return Array.from(arreglo, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function compararSeguro(cadenaA, cadenaB) {
  const maximo = Math.max(cadenaA.length, cadenaB.length);
  let diferencia = cadenaA.length ^ cadenaB.length;

  for (let indice = 0; indice < maximo; indice += 1) {
    const codigoA = cadenaA.charCodeAt(indice) || 0;
    const codigoB = cadenaB.charCodeAt(indice) || 0;
    diferencia |= codigoA ^ codigoB;
  }

  return diferencia === 0;
}

async function obtenerHashSHA256(texto) {
  const datos = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest("SHA-256", datos);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function leerEstadoSeguridad() {
  try {
    const valor = localStorage.getItem(claveEstadoSeguridad);
    if (!valor) {
      return { intentosFallidos: 0, bloqueosAcumulados: 0, bloqueadoHasta: 0 };
    }

    const estado = JSON.parse(valor);
    return {
      intentosFallidos: Number(estado.intentosFallidos) || 0,
      bloqueosAcumulados: Number(estado.bloqueosAcumulados) || 0,
      bloqueadoHasta: Number(estado.bloqueadoHasta) || 0,
    };
  } catch {
    return { intentosFallidos: 0, bloqueosAcumulados: 0, bloqueadoHasta: 0 };
  }
}

function guardarEstadoSeguridad(estado) {
  localStorage.setItem(claveEstadoSeguridad, JSON.stringify(estado));
}

function limpiarEstadoSeguridad() {
  localStorage.removeItem(claveEstadoSeguridad);
}

function tiempoRestanteBloqueo() {
  const estado = leerEstadoSeguridad();
  const restante = estado.bloqueadoHasta - Date.now();
  return Math.max(0, restante);
}

function formatearDuracion(ms) {
  const segundos = Math.ceil(ms / 1000);
  const minutos = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return `${String(minutos).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
}

function detenerMonitorBloqueo() {
  if (estadoInterfaz.intervaloBloqueo) {
    clearInterval(estadoInterfaz.intervaloBloqueo);
    estadoInterfaz.intervaloBloqueo = null;
  }
}

function actualizarBloqueoUI() {
  const restante = tiempoRestanteBloqueo();

  if (restante > 0) {
    botonEnviar.disabled = true;
    botonEnviar.dataset.enviando = "false";
    textoBotonEnviar.textContent = `Bloqueado ${formatearDuracion(restante)}`;
    return true;
  }

  if (!estadoInterfaz.enviando) {
    botonEnviar.disabled = false;
    textoBotonEnviar.textContent = "Iniciar sesión";
  }

  detenerMonitorBloqueo();
  return false;
}

function iniciarMonitorBloqueo() {
  if (estadoInterfaz.intervaloBloqueo) {
    return;
  }

  estadoInterfaz.intervaloBloqueo = setInterval(() => {
    actualizarBloqueoUI();
  }, 1000);
}

function registrarFalloAutenticacion() {
  const estado = leerEstadoSeguridad();
  estado.intentosFallidos += 1;

  if (estado.intentosFallidos >= intentosMaximos) {
    estado.bloqueosAcumulados += 1;
    estado.intentosFallidos = 0;

    const duracionBloqueo = Math.min(
      bloqueoBaseMs * (2 ** (estado.bloqueosAcumulados - 1)),
      bloqueoMaximoMs,
    );

    estado.bloqueadoHasta = Date.now() + duracionBloqueo;
  }

  guardarEstadoSeguridad(estado);
}

function validarSesionGuardada() {
  try {
    const valor = sessionStorage.getItem(claveSesion);
    if (!valor) {
      return null;
    }

    const sesion = JSON.parse(valor);
    const estructuraValida = typeof sesion?.correo === "string"
      && typeof sesion?.nonce === "string"
      && typeof sesion?.fechaInicio === "number"
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

function guardarMensajePendiente(mensaje) {
  sessionStorage.setItem(claveMensajeLogin, mensaje);
}

function mostrarMensajePendiente() {
  const mensaje = sessionStorage.getItem(claveMensajeLogin);
  if (!mensaje) {
    return;
  }
  sessionStorage.removeItem(claveMensajeLogin);
  mostrarNotificacion(mensaje);
}

// Validaciones de formato
function validarCorreo(valorCorreo) {
  const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!valorCorreo.trim()) {
    return { esValido: false, mensaje: "El correo es obligatorio." };
  }
  if (!patronCorreo.test(valorCorreo.trim())) {
    return { esValido: false, mensaje: "Ingresa un correo con formato válido." };
  }
  return { esValido: true, mensaje: "Correo válido." };
}

function validarContrasena(valorContrasena) {
  if (!valorContrasena) {
    return { esValido: false, mensaje: "La contraseña es obligatoria." };
  }
  if (valorContrasena.length < 6) {
    return { esValido: false, mensaje: "La contraseña debe tener al menos 6 caracteres." };
  }
  return { esValido: true, mensaje: "Contraseña válida." };
}

function actualizarMensajeCampo(elementoMensaje, validacion) {
  elementoMensaje.textContent = validacion.mensaje;
  elementoMensaje.dataset.estado = validacion.esValido ? "exito" : "error";
}

function marcarEstadoEntrada(entrada, validacion) {
  entrada.setAttribute("aria-invalid", String(!validacion.esValido));
  entrada.style.borderColor = validacion.esValido ? "var(--color-exito)" : "var(--color-error)";
}

function evaluarCorreo() {
  const validacion = validarCorreo(campoCorreo.value);
  actualizarMensajeCampo(mensajeCorreo, validacion);
  marcarEstadoEntrada(campoCorreo, validacion);
  return validacion.esValido;
}

function evaluarContrasena() {
  const validacion = validarContrasena(campoContrasena.value);
  actualizarMensajeCampo(mensajeContrasena, validacion);
  marcarEstadoEntrada(campoContrasena, validacion);
  return validacion.esValido;
}

// Tema claro/oscuro
function aplicarTema(tema) {
  document.documentElement.setAttribute("data-tema", tema);
  const esOscuro = tema === "oscuro";
  textoTema.textContent = esOscuro ? "Claro" : "Oscuro";
  iconoTema.textContent = esOscuro ? "☀️" : "🌙";
  botonTema.setAttribute("aria-pressed", String(esOscuro));
  estadoInterfaz.tema = tema;
  localStorage.setItem("temaPreferido", tema);
}

function alternarTema() {
  const proximoTema = estadoInterfaz.tema === "claro" ? "oscuro" : "claro";
  aplicarTema(proximoTema);
}

// Mostrar y ocultar contraseña
function alternarVisibilidadContrasena() {
  const estaOculta = campoContrasena.type === "password";
  campoContrasena.type = estaOculta ? "text" : "password";
  botonVisorContrasena.textContent = estaOculta ? "Ocultar" : "Mostrar";
  botonVisorContrasena.setAttribute("aria-label", estaOculta ? "Ocultar contraseña" : "Mostrar contraseña");
  botonVisorContrasena.setAttribute("aria-pressed", String(estaOculta));
}

// Estado de envío
function establecerEstadoEnvio(enviando) {
  estadoInterfaz.enviando = enviando;
  botonEnviar.disabled = enviando;
  botonEnviar.dataset.enviando = String(enviando);
  textoBotonEnviar.textContent = enviando ? "Validando acceso..." : "Iniciar sesión";
}

function mostrarNotificacion(mensaje) {
  clearTimeout(estadoInterfaz.temporizadorNotificacion);
  notificacionFlotante.textContent = mensaje;
  notificacionFlotante.dataset.activa = "true";
  estadoInterfaz.temporizadorNotificacion = setTimeout(() => {
    notificacionFlotante.dataset.activa = "false";
  }, 3600);
}

function crearSesionSegura(correoNormalizado) {
  const ahora = Date.now();
  return {
    correo: correoNormalizado,
    nonce: generarTokenHex(16),
    fechaInicio: ahora,
    expiraEn: ahora + duracionSesionMs,
    ultimaActividad: ahora,
  };
}

async function verificarCredenciales(correoNormalizado, contrasena) {
  const hashIngresado = await obtenerHashSHA256(contrasena);
  const correoValido = compararSeguro(correoNormalizado, correoPermitido);
  const hashValido = compararSeguro(hashIngresado, hashContrasenaPermitida);
  return correoValido && hashValido;
}

async function manejarEnvioFormulario(evento) {
  evento.preventDefault();

  if (estadoInterfaz.enviando) {
    return;
  }

  if (actualizarBloqueoUI()) {
    iniciarMonitorBloqueo();
    mostrarNotificacion("Acceso temporalmente bloqueado. Intenta más tarde.");
    return;
  }

  const correoValido = evaluarCorreo();
  const contrasenaValida = evaluarContrasena();

  if (!correoValido || !contrasenaValida) {
    mostrarNotificacion("Completa correctamente los campos antes de continuar.");
    return;
  }

  establecerEstadoEnvio(true);

  const correoNormalizado = normalizarCorreo(campoCorreo.value);
  const contrasenaIngresada = campoContrasena.value;

  await esperar(550);

  const credencialesCorrectas = await verificarCredenciales(correoNormalizado, contrasenaIngresada);

  if (!credencialesCorrectas) {
    registrarFalloAutenticacion();
    campoContrasena.value = "";
    evaluarContrasena();
    establecerEstadoEnvio(false);

    if (actualizarBloqueoUI()) {
      iniciarMonitorBloqueo();
      mostrarNotificacion("Demasiados intentos fallidos. Acceso bloqueado temporalmente.");
      return;
    }

    mostrarNotificacion("Credenciales inválidas.");
    campoContrasena.focus();
    return;
  }

  limpiarEstadoSeguridad();
  detenerMonitorBloqueo();

  const sesion = crearSesionSegura(correoNormalizado);
  sessionStorage.setItem(claveSesion, JSON.stringify(sesion));

  establecerEstadoEnvio(false);
  window.location.replace("./inicio.html");
}

// Eventos
campoCorreo.addEventListener("blur", evaluarCorreo);
campoContrasena.addEventListener("blur", evaluarContrasena);
formularioLogin.addEventListener("submit", manejarEnvioFormulario);
botonVisorContrasena.addEventListener("click", alternarVisibilidadContrasena);
botonTema.addEventListener("click", alternarTema);

// Estado inicial
aplicarTema(estadoInterfaz.tema);
mostrarMensajePendiente();

const sesionValida = validarSesionGuardada();
if (sesionValida) {
  window.location.replace("./inicio.html");
}

if (actualizarBloqueoUI()) {
  iniciarMonitorBloqueo();
}
