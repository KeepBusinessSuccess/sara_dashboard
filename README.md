# SARA v2 · KBS Business

Dashboard interno con frontend real en GitHub Pages, autenticación de Google Workspace y datos operativos en Google Sheets.

## Resultado

- `innovacion@kbsbusiness.com` es el único `SUPER ADMIN`, nivel 5.
- Sólo el superadministrador puede crear personas, cambiar roles, activar o desactivar accesos y decidir qué módulos aparecen en cada menú lateral.
- Dirección conserva nivel N4 y puede consultar los módulos que el superadministrador le asigne, pero no puede modificar jerarquías ni permisos.
- Tipografía ampliada para salas de juntas y proyectores.
- Temas claro y oscuro con preferencia conservada en el dispositivo.
- Interfaz sin emojis.
- Frontend publicado desde la carpeta `docs` de GitHub.
- Sheets no se comparte con los usuarios finales.

## Arquitectura

```text
GitHub Pages
  Frontend estático, sin secretos ni datos reales
        │ Google OAuth interno
        ▼
Apps Script Gateway
  Identifica al usuario @kbsbusiness.com
  Limita las operaciones y firma cada solicitud
        │ HMAC + timestamp + nonce
        ▼
Apps Script Backend, ejecutado como propietario
  Valida firma, dominio, rol y permisos
        │
        ▼
Google Sheets
  Repositorio privado y protegido
```

Esta separación evita entregar a cada empleado permisos directos sobre el libro. El navegador sólo solicita los alcances `userinfo.email` y `script.external_request`; nunca recibe el ID del libro ni el secreto compartido.

## Estructura

- `docs/`: frontend que se publica en GitHub Pages.
- `gateway/`: proyecto Apps Script de entrada, desplegado como API executable.
- archivos `.gs` y `.html` de la raíz: backend Apps Script y módulos SARA.
- `AccessConstants.gs`: superadministrador y catálogo de módulos.
- `Security.gs`: dominio, roles, permisos efectivos y restricciones.
- `Hierarchies.gs`: altas y modificaciones de jerarquías y accesos.
- `GatewayBackend.gs`: verificación HMAC, caducidad y protección contra repetición.
- `SECURITY.md`: controles y pruebas obligatorias.

## 1. Preparar el backend

1. Crea un proyecto independiente de Apps Script, propiedad de una cuenta administrativa de `kbsbusiness.com`.
2. Copia al proyecto los archivos `.gs`, `.html` y `appsscript.json` de la raíz. La configuración `.claspignore` excluye automáticamente `docs`, `gateway`, `legacy` y herramientas.
3. En **Configuración del proyecto → Propiedades de la secuencia de comandos**, agrega:

   - `SARA_SPREADSHEET_ID`: ID del libro de SARA.
   - `SARA_SHARED_SECRET`: una cadena aleatoria de al menos 64 caracteres. No la guardes en GitHub.

4. Ejecuta manualmente `initializeSaraRepositoryV2_()` y acepta permisos. Se crearán las pestañas faltantes, incluida `Permisos`, y se registrará `innovacion@kbsbusiness.com` como superadministrador protegido.
5. Ejecuta `protectSaraRepository_()` desde la cuenta propietaria.
6. Despliega como **Aplicación web**, ejecutando como el propietario. El endpoint debe aceptar las solicitudes del gateway; la autorización real se realiza mediante firma HMAC. Copia la URL terminada en `/exec`.
7. No compartas el libro con los usuarios finales.

## 2. Preparar el gateway

1. Crea un proyecto estándar en Google Cloud.
2. Configura la pantalla de consentimiento OAuth como **Interna** para `kbsbusiness.com`.
3. Habilita **Google Apps Script API**.
4. Crea un segundo proyecto de Apps Script y vincúlalo al mismo proyecto estándar de Google Cloud.
5. Copia `gateway/Gateway.gs` y `gateway/appsscript.json`.
6. En las propiedades del proyecto gateway agrega:

   - `SARA_BACKEND_URL`: URL `/exec` del backend.
   - `SARA_SHARED_SECRET`: exactamente el mismo secreto del backend.

7. Despliega el gateway como **API executable** con acceso exclusivo al dominio.
8. Conserva el Deployment ID; no uses el Script ID en el frontend.

## 3. Configurar Google OAuth

1. En el mismo proyecto estándar de Google Cloud crea un Client ID de tipo **Aplicación web**.
2. Agrega como origen autorizado `https://TU_ORGANIZACION.github.io`. Si existe dominio propio, agrega también su origen HTTPS.
3. Copia el Client ID.
4. Confirma que el cliente OAuth y el gateway usan el mismo proyecto estándar de Google Cloud; de lo contrario `scripts.run` responderá 403.

## 4. Configurar y publicar GitHub Pages

1. Edita `docs/config.js`:

   - `googleClientId`: Client ID de Google.
   - `gatewayDeploymentId`: Deployment ID del gateway.
   - deja `demoMode: false`.

2. Sube el proyecto a un repositorio privado de GitHub.
3. En **Settings → Pages**, selecciona publicación desde una rama.
4. Selecciona la rama principal y la carpeta `/docs`.
5. Abre la URL publicada e inicia sesión con `innovacion@kbsbusiness.com`.

El Client ID y el Deployment ID son identificadores públicos y no sustituyen autorización. `SARA_SHARED_SECRET`, el ID del libro, tokens y archivos `.clasp.json` nunca deben publicarse.

## Administración de accesos

El superadministrador verá `Accesos y jerarquías`. Desde ahí puede:

- crear una persona;
- editar nombre, correo, departamento y puesto;
- activar o desactivar el acceso;
- asignar N1, N2, N3 o N4;
- seleccionar individualmente los módulos visibles.

Los permisos individuales se guardan en `Permisos`. Los cambios se registran en `Bitacora`. La cuenta `innovacion@kbsbusiness.com` no puede degradarse, desactivarse ni transferir la capacidad de administrar accesos.

## Vista previa

Para una vista local con datos ficticios, cambia temporalmente `demoMode` a `true` en `docs/config.js` y vuelve a dejarlo en `false` antes de publicar.

