# Activar el correo de confirmación de Asistencitas

## Antes de probar

Publica los archivos `index.html`, `ui-polish.css` y `verificar-correo.html` en el mismo sitio y confirma que abran en estas rutas:

- `https://www.asistencitas.com/index.html`
- `https://www.asistencitas.com/verificar-correo.html`

En Firebase Console, agrega `www.asistencitas.com` y `asistencitas.com` en **Authentication → Settings → Authorized domains** si todavía no aparecen.

## Configurar la plantilla

1. Abre **Firebase Console → Authentication → Templates → Email address verification**.
2. Cambia el asunto a **Confirma tu correo para empezar en Asistencitas**.
3. Personaliza el texto introductorio con este mensaje:

   > Hola. Recibimos una solicitud para crear una cuenta clínica en Asistencitas. Confirma que este correo te pertenece con el botón de abajo. Después podrás iniciar sesión y completar la configuración de tu clínica. Si no solicitaste esta cuenta, ignora este mensaje.

4. Conserva el enlace de acción que Firebase agrega al correo. No reemplaces su marcador por un enlace escrito manualmente.
5. En **Customize action URL**, coloca:

   `https://www.asistencitas.com/verificar-correo.html`

6. Guarda la plantilla y realiza una prueba con una cuenta nueva.

La página personalizada también acepta los flujos de restablecimiento de contraseña y recuperación/cambio de correo, porque Firebase reutiliza la URL de acción personalizada en sus plantillas. La página solo procesa el código de acción recibido y vuelve a una ruta fija del sitio; no redirige a destinos externos enviados en la URL.

## Nombre y dominio del remitente

El texto, el asunto y el idioma se configuran en Firebase; el frontend no puede cambiar el correo que Firebase ya envió. La aplicación ahora solicita el idioma español y ofrece una página de confirmación con marca propia. Para que el remitente también use un dominio de Asistencitas, Firebase requiere configurar el dominio y publicar los registros DNS que muestra la consola.

## Comprobación manual

1. Registra una clínica con un correo al que tengas acceso.
2. Confirma que aparece la pantalla de espera y que llega el correo en español.
3. Abre el botón del correo y verifica que la página muestre **Correo confirmado**.
4. Vuelve al acceso e inicia sesión.
5. Prueba un enlace vencido o ya utilizado y confirma que la página muestra una explicación y permite volver al acceso.
6. Si el proyecto usa restablecimiento de contraseña, solicita uno y confirma que el mismo dominio abre el formulario para guardar la nueva contraseña.
