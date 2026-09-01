const GATEWAY_ALLOWED_DOMAIN = 'kbsbusiness.com';
const GATEWAY_ALLOWED_ACTIONS = Object.freeze([
  'apiGetBootstrap',
  'apiGetModule',
  'apiSaveHierarchyRecord'
]);

function gatewayRun(action, args) {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!email || !email.endsWith('@' + GATEWAY_ALLOWED_DOMAIN)) {
    throw new Error('Acceso exclusivo para cuentas @' + GATEWAY_ALLOWED_DOMAIN + '.');
  }
  if (!GATEWAY_ALLOWED_ACTIONS.includes(action)) throw new Error('Operación no permitida.');
  const parameters = Array.isArray(args) ? args : [];
  const properties = PropertiesService.getScriptProperties();
  const backendUrl = properties.getProperty('SARA_BACKEND_URL');
  const sharedSecret = properties.getProperty('SARA_SHARED_SECRET');
  if (!backendUrl || !sharedSecret) throw new Error('El gateway de SARA no está configurado.');

  const envelope = {
    timestamp: Date.now(),
    nonce: Utilities.getUuid(),
    email: email,
    action: action,
    args: parameters
  };
  const canonical = JSON.stringify(envelope);
  const signature = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(canonical, sharedSecret),
    true
  );
  const response = UrlFetchApp.fetch(backendUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ envelope: envelope, signature: signature }),
    followRedirects: true,
    muteHttpExceptions: true
  });
  const status = response.getResponseCode();
  let payload;
  try { payload = JSON.parse(response.getContentText()); }
  catch (error) { throw new Error('El backend de SARA devolvió una respuesta inválida.'); }
  if (status < 200 || status >= 300 || !payload.ok) {
    throw new Error(payload && payload.message ? payload.message : 'El backend de SARA rechazó la solicitud.');
  }
  return payload.result;
}
