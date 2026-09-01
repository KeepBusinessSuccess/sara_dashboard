let SARA_GATEWAY_EMAIL_ = '';

function getAuthenticatedEmail_() {
  return normalizeText_(SARA_GATEWAY_EMAIL_ || Session.getActiveUser().getEmail()).toLowerCase();
}

function doPost(event) {
  try {
    const request = verifyGatewayRequest_(event);
    SARA_GATEWAY_EMAIL_ = request.email;
    const handlers = {
      apiGetBootstrap: () => apiGetBootstrap(),
      apiGetModule: () => apiGetModule(request.args[0]),
      apiSaveHierarchyRecord: () => apiSaveHierarchyRecord(request.args[0])
    };
    if (!handlers[request.action]) throw new Error('Operación no permitida.');
    return jsonResponse_({ ok: true, result: handlers[request.action]() });
  } catch (error) {
    return jsonResponse_({ ok: false, message: error && error.message ? error.message : 'Solicitud rechazada.' });
  } finally {
    SARA_GATEWAY_EMAIL_ = '';
  }
}

function verifyGatewayRequest_(event) {
  if (!event || !event.postData || !event.postData.contents) throw new Error('Solicitud vacía.');
  const secret = PropertiesService.getScriptProperties().getProperty('SARA_SHARED_SECRET');
  if (!secret) throw new Error('El backend de SARA no está configurado.');
  let payload;
  try { payload = JSON.parse(event.postData.contents); }
  catch (error) { throw new Error('Solicitud inválida.'); }
  const envelope = payload.envelope || {};
  const signature = normalizeText_(payload.signature);
  const timestamp = Number(envelope.timestamp);
  if (!timestamp || Math.abs(Date.now() - timestamp) > 300000) throw new Error('La solicitud expiró.');
  const nonce = normalizeText_(envelope.nonce);
  if (!/^[A-Za-z0-9-]{20,80}$/.test(nonce)) throw new Error('Identificador de solicitud inválido.');
  const cache = CacheService.getScriptCache();
  if (cache.get('nonce:' + nonce)) throw new Error('La solicitud ya fue utilizada.');
  const email = normalizeText_(envelope.email).toLowerCase();
  if (!email.endsWith('@' + SARA_CONFIG.ALLOWED_DOMAIN)) throw new Error('Cuenta no autorizada.');
  const action = normalizeText_(envelope.action);
  const args = Array.isArray(envelope.args) ? envelope.args : [];
  const canonical = JSON.stringify({ timestamp: timestamp, nonce: nonce, email: email, action: action, args: args });
  const expected = Utilities.computeHmacSha256Signature(canonical, secret);
  let provided;
  try { provided = Utilities.base64DecodeWebSafe(signature); }
  catch (error) { throw new Error('Firma inválida.'); }
  if (!constantTimeEqual_(expected, provided)) throw new Error('Firma inválida.');
  cache.put('nonce:' + nonce, '1', 600);
  return { email: email, action: action, args: args };
}

function constantTimeEqual_(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= (left[index] & 255) ^ (right[index] & 255);
  return difference === 0;
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
