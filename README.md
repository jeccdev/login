## Login

## Estructura

```text
login/
├─ index.html            # Pantalla de autenticación
├─ inicio.html           # Pantalla de inicio tras login válido
├─ css/
│  ├─ base.css           # Variables de tema, estilos globales y animaciones base
│  ├─ login.css          # Estilos exclusivos del formulario de login
│  └─ inicio.css         # Estilos exclusivos de la página de inicio
└─ js/
   ├─ login.js           # Validación, autenticación, bloqueo temporal y sesión
   └─ inicio.js          # Validación de sesión activa, inactividad y cierre de sesión
```

## Buenas prácticas aplicadas

- Separación clara por responsabilidades (estructura, estilos y comportamiento).
- Variables CSS centralizadas para tema claro/oscuro.
- Accesibilidad semántica y atributos ARIA.
- Protección básica de sesión en cliente y bloqueo progresivo por intentos fallidos.
- Comentarios de sección en archivos donde agregan contexto técnico.
