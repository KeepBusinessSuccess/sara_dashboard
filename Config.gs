const SARA_CONFIG = Object.freeze({
  APP_NAME: 'SARA · KBS Business',
  ALLOWED_DOMAIN: 'kbsbusiness.com',
  SPREADSHEET_PROPERTY: 'SARA_SPREADSHEET_ID',
  MAX_ROWS_PER_VIEW: 500,
  SHEETS: Object.freeze({
    HIERARCHIES: 'Jerarquias',
    TARGETS: 'Metas',
    ALERTS: 'Alertas',
    CRM: 'CRM',
    BILLING: 'Facturacion',
    TRAINING: 'Capacitacion',
    PROJECTS: 'Proyectos',
    CONTINGENCY: 'Contingencia',
    SAFETY: 'SeguridadNormas',
    HR: 'RecursosHumanos',
    MARKETING: 'Marketing',
    COMMERCIAL: 'Comercial',
    EVALUATIONS: 'EvaluacionesN4',
    AUDIT: 'Bitacora'
  }),
  ROLES: Object.freeze(['TRABAJADOR', 'LÍDER', 'COORDINADOR', 'DIRECCIÓN'])
});

function getRepository_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(SARA_CONFIG.SPREADSHEET_PROPERTY);
  if (!spreadsheetId) {
    throw new Error('SARA no está configurado. Falta la propiedad segura SARA_SPREADSHEET_ID.');
  }
  return SpreadsheetApp.openById(spreadsheetId);
}
