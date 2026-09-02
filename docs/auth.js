window.SaraBridge = (() => {
  let accessToken = '';
  let expiresAt = 0;
  let tokenClient = null;
  let pendingAuth = null;

  function config() { return window.SARA_GITHUB_CONFIG || {}; }
  function isDemo() { return Boolean(config().demoMode); }
  function isConfigured() {
    const value = config();
    return Boolean(value.googleClientId && value.gatewayDeploymentId && !value.googleClientId.startsWith('REEMPLAZAR_') && !value.gatewayDeploymentId.startsWith('REEMPLAZAR_'));
  }
  function ensureLibrary() {
    if (!window.google || !google.accounts || !google.accounts.oauth2) throw new Error('No fue posible cargar el acceso de Google.');
  }
  function initializeClient() {
    ensureLibrary();
    if (tokenClient) return;
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: config().googleClientId,
      scope: (config().oauthScopes || []).join(' '),
      callback: response => {
        if (response && response.access_token) {
          accessToken = response.access_token;
          expiresAt = Date.now() + Number(response.expires_in || 3600) * 1000;
          if (pendingAuth) pendingAuth.resolve(response);
        } else if (pendingAuth) pendingAuth.reject(new Error(response && response.error_description || 'Google no autorizó el acceso.'));
        pendingAuth = null;
      },
      error_callback: error => {
        if (pendingAuth) pendingAuth.reject(new Error(error && error.message || 'Se canceló el acceso con Google.'));
        pendingAuth = null;
      }
    });
  }
  function signIn() {
    if (isDemo()) return Promise.resolve({ demo: true });
    if (!isConfigured()) return Promise.reject(new Error('Falta configurar Google OAuth y el Deployment ID.'));
    initializeClient();
    return new Promise((resolve, reject) => {
      pendingAuth = { resolve, reject };
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    });
  }
  async function run(functionName, ...parameters) {
    if (!accessToken || Date.now() >= expiresAt - 360000) throw new Error('La sesión expiró. Vuelve a iniciar sesión.');
    const response = await fetch(`https://script.googleapis.com/v1/scripts/${encodeURIComponent(config().gatewayDeploymentId)}:run`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ function: 'gatewayRun', parameters: [functionName, parameters], devMode: false })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error && payload.error.message || `Error de conexión ${response.status}.`);
    if (payload.error) {
      const detail = payload.error.details && payload.error.details[0];
      throw new Error(detail && detail.errorMessage || payload.error.message || 'Apps Script rechazó la operación.');
    }
    return payload.response ? payload.response.result : null;
  }
  function signOut() {
    if (accessToken && window.google && google.accounts && google.accounts.oauth2) google.accounts.oauth2.revoke(accessToken, () => {});
    accessToken = '';
    expiresAt = 0;
  }
  return { isDemo, isConfigured, signIn, signOut, run };
})();

