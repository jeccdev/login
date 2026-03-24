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
const mascotaLogin = document.getElementById("mascotaLogin");
const caraMascota = document.getElementById("caraMascota");
const mensajeMascota = document.getElementById("mensajeMascota");

// Estado de la pantalla
const estadoInterfaz = {
  tema: localStorage.getItem("temaPreferido") || "claro",
  enviando: false,
  temporizadorNotificacion: null,
  temporizadorMascota: null,
  intervaloVidaMascota: null,
  pausaVidaMascotaHasta: 0,
};

const mensajesVidaMascota = [
  "Estoy de guardia en modo buen humor.",
  "Mientras escribes, yo practico mi mejor pose.",
  "Sistema activo: cero drama y mucha actitud.",
  "Si te bloqueas, yo te acompaño con estilo.",
  "Respira, escribe y entramos en un momento.",
];

// Validaciones
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

// Mascota interactiva
function establecerHumorMascota(humor, mensaje) {
  if (!mascotaLogin || !mensajeMascota) {
    return;
  }
  mascotaLogin.dataset.humor = humor;
  mensajeMascota.textContent = mensaje;
}

function moverMiradaMascota(longitudTexto) {
  if (!caraMascota) {
    return;
  }
  const desplazamiento = Math.sin(longitudTexto * 0.55) * 4.8;
  caraMascota.style.setProperty("--desplazamiento-pupila", `${desplazamiento.toFixed(2)}px`);
}

function hayInteraccionConCampos() {
  return document.activeElement === campoCorreo || document.activeElement === campoContrasena;
}

function pausarVidaMascota(milisegundos = 2200) {
  estadoInterfaz.pausaVidaMascotaHasta = Date.now() + milisegundos;
}

function tomarMensajeAleatorioMascota() {
  const indice = Math.floor(Math.random() * mensajesVidaMascota.length);
  return mensajesVidaMascota[indice];
}

function ejecutarVidaAutonomaMascota() {
  if (!mascotaLogin || !mensajeMascota || estadoInterfaz.enviando || hayInteraccionConCampos()) {
    return;
  }
  if (Date.now() < estadoInterfaz.pausaVidaMascotaHasta) {
    return;
  }

  const probabilidad = Math.random();
  moverMiradaMascota(Math.floor(Math.random() * 8));

  if (probabilidad < 0.3) {
    establecerHumorMascota("guino", "Vibra positiva activada.");
    setTimeout(() => {
      if (!hayInteraccionConCampos() && !estadoInterfaz.enviando) {
        establecerHumorMascota("reposo", tomarMensajeAleatorioMascota());
      }
    }, 700);
    return;
  }

  if (probabilidad < 0.58) {
    establecerHumorMascota("curioso", tomarMensajeAleatorioMascota());
    return;
  }

  establecerHumorMascota("reposo", tomarMensajeAleatorioMascota());
}

function iniciarVidaAutonomaMascota() {
  if (estadoInterfaz.intervaloVidaMascota) {
    clearInterval(estadoInterfaz.intervaloVidaMascota);
  }
  estadoInterfaz.intervaloVidaMascota = setInterval(ejecutarVidaAutonomaMascota, 3200);
}

function restaurarMascotaConRetraso() {
  clearTimeout(estadoInterfaz.temporizadorMascota);
  estadoInterfaz.temporizadorMascota = setTimeout(() => {
    if (hayInteraccionConCampos()) {
      return;
    }
    pausarVidaMascota(800);
    moverMiradaMascota(0);
    establecerHumorMascota("reposo", "Listo para iniciar sesión");
  }, 350);
}

function reaccionarFocoCorreo() {
  pausarVidaMascota(3000);
  establecerHumorMascota("atento", "Escribe tu correo, estoy siguiendo cada letra.");
}

function reaccionarEscrituraCorreo() {
  pausarVidaMascota(3000);
  const longitudTexto = campoCorreo.value.length;
  moverMiradaMascota(longitudTexto);

  if (longitudTexto === 0) {
    establecerHumorMascota("atento", "Vamos, ese correo no se escribe solo.");
    return;
  }

  establecerHumorMascota("atento", "Muy bien, ese correo ya va tomando forma.");
}

function reaccionarFocoContrasena() {
  pausarVidaMascota(3200);
  establecerHumorMascota("guino", "Prometo no mirar tu clave... bueno, solo un ojo.");
}

function reaccionarEscrituraContrasena() {
  pausarVidaMascota(3200);
  const longitudTexto = campoContrasena.value.length;
  moverMiradaMascota(longitudTexto);

  if (longitudTexto === 0) {
    establecerHumorMascota("atento", "Aquí va tu contraseña secreta.");
    return;
  }

  establecerHumorMascota("guino", "Modo espía activado: un ojo abierto y otro cerrado.");
}

function evaluarCorreo() {
  pausarVidaMascota(2400);
  const validacion = validarCorreo(campoCorreo.value);
  actualizarMensajeCampo(mensajeCorreo, validacion);
  marcarEstadoEntrada(campoCorreo, validacion);

  if (validacion.esValido) {
    establecerHumorMascota("atento", "Correo correcto, vamos excelente.");
  } else {
    establecerHumorMascota("error", "Ese correo necesita un pequeño ajuste.");
  }

  return validacion.esValido;
}

function evaluarContrasena() {
  pausarVidaMascota(2400);
  const validacion = validarContrasena(campoContrasena.value);
  actualizarMensajeCampo(mensajeContrasena, validacion);
  marcarEstadoEntrada(campoContrasena, validacion);

  if (validacion.esValido) {
    establecerHumorMascota("guino", "Clave lista. Misión casi completada.");
  } else {
    establecerHumorMascota("error", "A esa clave le faltan unos caracteres.");
  }

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
  pausarVidaMascota(2200);
  const estaOculta = campoContrasena.type === "password";
  campoContrasena.type = estaOculta ? "text" : "password";
  botonVisorContrasena.textContent = estaOculta ? "Ocultar" : "Mostrar";
  botonVisorContrasena.setAttribute("aria-label", estaOculta ? "Ocultar contraseña" : "Mostrar contraseña");
  botonVisorContrasena.setAttribute("aria-pressed", String(estaOculta));

  if (estaOculta) {
    establecerHumorMascota("sorprendido", "Uy, contraseña visible. Aquí no juzgamos.");
  } else {
    establecerHumorMascota("guino", "Perfecto, volvemos al modo secreto.");
  }
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
  }, 3000);
}

function manejarEnvioFormulario(evento) {
  evento.preventDefault();
  if (estadoInterfaz.enviando) {
    return;
  }

  pausarVidaMascota(4000);

  const correoValido = evaluarCorreo();
  const contrasenaValida = evaluarContrasena();

  if (!correoValido || !contrasenaValida) {
    establecerHumorMascota("error", "Nos falta corregir un detalle antes de entrar.");
    mostrarNotificacion("Corrige los campos marcados antes de continuar.");
    return;
  }

  establecerHumorMascota("atento", "Verificando acceso...");
  establecerEstadoEnvio(true);

  setTimeout(() => {
    establecerEstadoEnvio(false);
    establecerHumorMascota("celebra", "Acceso concedido. Excelente.");
    mostrarNotificacion("Inicio de sesión exitoso. Bienvenido.");
    pausarVidaMascota(1600);
    restaurarMascotaConRetraso();
  }, 1800);
}

// Eventos
campoCorreo.addEventListener("focus", reaccionarFocoCorreo);
campoCorreo.addEventListener("input", reaccionarEscrituraCorreo);
campoCorreo.addEventListener("blur", () => {
  evaluarCorreo();
  restaurarMascotaConRetraso();
});

campoContrasena.addEventListener("focus", reaccionarFocoContrasena);
campoContrasena.addEventListener("input", reaccionarEscrituraContrasena);
campoContrasena.addEventListener("blur", () => {
  evaluarContrasena();
  restaurarMascotaConRetraso();
});

formularioLogin.addEventListener("submit", manejarEnvioFormulario);
botonVisorContrasena.addEventListener("click", alternarVisibilidadContrasena);
botonTema.addEventListener("click", alternarTema);

// Estado inicial
aplicarTema(estadoInterfaz.tema);
establecerHumorMascota("reposo", "Listo para iniciar sesión");
iniciarVidaAutonomaMascota();
