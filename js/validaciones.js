// Referencias a nodos del DOM para aislar la manipulación de la interfaz
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

    // Estado de interfaz: tema activo, envío en curso y temporizador de notificación
    const estadoInterfaz = {
      tema: localStorage.getItem("temaPreferido") || "claro",
      enviando: false,
      temporizadorNotificacion: null,
    };

    // Reglas de validación desacopladas para mantener funciones pequeñas y reutilizables
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

    // Actualiza mensaje accesible y estado visual asociado al campo
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

    // Alterna modo claro/oscuro aplicando variables CSS y persistencia local
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

    // Gestión de visibilidad de contraseña con retroalimentación para accesibilidad
    function alternarVisibilidadContrasena() {
      const estaOculta = campoContrasena.type === "password";
      campoContrasena.type = estaOculta ? "text" : "password";
      botonVisorContrasena.textContent = estaOculta ? "Ocultar" : "Mostrar";
      botonVisorContrasena.setAttribute("aria-label", estaOculta ? "Ocultar contraseña" : "Mostrar contraseña");
      botonVisorContrasena.setAttribute("aria-pressed", String(estaOculta));
    }

    // Maneja estado de envío e indicador de carga para simular petición asíncrona
    function establecerEstadoEnvio(enviando) {
      estadoInterfaz.enviando = enviando;
      botonEnviar.disabled = enviando;
      botonEnviar.dataset.enviando = String(enviando);
      textoBotonEnviar.textContent = enviando ? "Validando acceso..." : "Iniciar sesión";
    }

    // Notificación flotante reutilizable para mensajes informativos tras interacción
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

      const correoValido = evaluarCorreo();
      const contrasenaValida = evaluarContrasena();

      if (!correoValido || !contrasenaValida) {
        mostrarNotificacion("Corrige los campos marcados antes de continuar.");
        return;
      }

      establecerEstadoEnvio(true);
      setTimeout(() => {
        establecerEstadoEnvio(false);
        mostrarNotificacion("Inicio de sesión exitoso. Bienvenido.");
      }, 1800);
    }

    // Suscripción de eventos con responsabilidades específicas por interacción
    campoCorreo.addEventListener("blur", evaluarCorreo);
    campoContrasena.addEventListener("blur", evaluarContrasena);
    formularioLogin.addEventListener("submit", manejarEnvioFormulario);
    botonVisorContrasena.addEventListener("click", alternarVisibilidadContrasena);
    botonTema.addEventListener("click", alternarTema);

    // Inicialización del estado persistido del tema al cargar la página
    aplicarTema(estadoInterfaz.tema);
