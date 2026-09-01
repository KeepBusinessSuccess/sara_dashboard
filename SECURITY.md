# Seguridad de SARA v2

## Controles incorporados

1. GitHub Pages contiene únicamente interfaz y datos ficticios de demostración.
2. Google OAuth está configurado para un proyecto interno de Workspace.
3. El gateway comprueba el correo activo y el dominio antes de enviar una solicitud.
4. El gateway sólo permite tres operaciones explícitas; no acepta nombres arbitrarios de funciones.
5. Cada solicitud se firma con HMAC-SHA256 usando un secreto almacenado únicamente en Script Properties.
6. El backend reconstruye la firma y aplica comparación de tiempo constante.
7. Las solicitudes caducan después de cinco minutos y cada nonce sólo puede usarse una vez.
8. El backend vuelve a validar dominio, usuario, estatus, rol y permiso del módulo.
9. `innovacion@kbsbusiness.com` está fijado en código como único superadministrador.
10. Todas las escrituras de jerarquías requieren `requireSuperAdmin_` en el servidor.
11. No existe eliminación irreversible desde la interfaz; se utiliza `INACTIVO`.
12. Todos los cambios administrativos quedan en `Bitacora`.
13. El libro permanece sin compartir con los usuarios finales.

## Verificaciones obligatorias

- [ ] OAuth está en modo Interno para `kbsbusiness.com`.
- [ ] El API executable del gateway permite únicamente el dominio.
- [ ] El Client ID y el gateway pertenecen al mismo proyecto estándar de Google Cloud.
- [ ] El backend ejecuta como propietario.
- [ ] `SARA_SHARED_SECRET` es idéntico en backend y gateway y no aparece en GitHub.
- [ ] El libro no está compartido con empleados finales.
- [ ] Una solicitud sin firma, con firma alterada, vencida o repetida es rechazada.
- [ ] Una cuenta Gmail personal no puede ejecutar el gateway.
- [ ] Un correo corporativo ausente o inactivo en `Jerarquias` no obtiene datos.
- [ ] Dirección no puede invocar `apiSaveHierarchyRecord`.
- [ ] Sólo `innovacion@kbsbusiness.com` ve `Accesos y jerarquías`.
- [ ] El superadministrador puede cambiar los módulos de un usuario y el menú se actualiza en su siguiente sesión.
- [ ] Los temas claro y oscuro conservan suficiente contraste en el proyector real.
- [ ] No hay datos reales ni secretos dentro de `docs`.

## Propiedades secretas

Backend:

- `SARA_SPREADSHEET_ID`
- `SARA_SHARED_SECRET`

Gateway:

- `SARA_BACKEND_URL`
- `SARA_SHARED_SECRET`

Nunca deben guardarse en `config.js`, commits, incidencias, capturas o registros de consola.

## Respuesta a incidentes

Desactiva las implementaciones, cambia `SARA_SHARED_SECRET` en ambos proyectos, revisa `Bitacora` y los registros de ejecución, revoca sesiones comprometidas en Workspace y publica versiones nuevas del backend y gateway.
