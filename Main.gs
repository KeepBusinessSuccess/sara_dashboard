function include_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet() {
  try {
    getAccessContext_();
    return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle(SARA_CONFIG.APP_NAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (error) {
    return renderAccessDenied_(error && error.message ? error.message : 'Acceso no autorizado.');
  }
}

function renderAccessDenied_(message) {
  const safe = String(message).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  return HtmlService.createHtmlOutput(`<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Acceso restringido · SARA</title></head><body style="margin:0;background:#080a0e;color:#f4f5f7;font-family:Segoe UI,sans-serif;min-height:100vh;display:grid;place-items:center"><main style="width:min(480px,calc(100% - 40px));padding:34px;border:1px solid #282d36;border-radius:18px;background:#11151c"><div style="color:#ffd400;font-weight:900;font-size:30px">KBS</div><h1 style="font-size:22px;margin:22px 0 9px">Acceso restringido</h1><p style="color:#929aa7;line-height:1.6;font-size:13px">${safe}</p><p style="color:#5f6875;font-size:11px;margin-top:28px">Usa tu cuenta corporativa @${SARA_CONFIG.ALLOWED_DOMAIN} o solicita acceso a Dirección.</p></main></body></html>`).setTitle('Acceso restringido · SARA');
}

function apiGetBootstrap() {
  const context = getAccessContext_();
  requireView_(context, 'overview');
  const response = {
    user: publicContext_(context),
    permissions: context.permissions,
    dashboard: getDashboardData_(context),
    alerts: getAlertsData_(context),
    hierarchies: [] ,
    meta: { generatedAt: new Date().toISOString(), mode: 'live' }
  };
  if (context.permissions.views.includes('hierarchies')) response.hierarchies = getHierarchiesData_(context);
  return response;
}

function apiGetModule(moduleName) {
  const context = getAccessContext_();
  const moduleKey = normalizeText_(moduleName).toLowerCase();
  requireView_(context, moduleKey);
  const handlers = {
    alerts: getAlertsData_, crm: getCrmData_, billing: getBillingData_, training: getTrainingData_,
    contingency: getContingencyData_, safety: getSafetyData_, hr: getHumanResourcesData_,
    commercial: getCommercialData_, evaluations: getCoordinatorEvaluationsData_, hierarchies: getHierarchiesData_
  };
  if (!handlers[moduleKey]) throw new Error('Módulo no reconocido.');
  return { data: handlers[moduleKey](context), generatedAt: new Date().toISOString() };
}

