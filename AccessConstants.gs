const SARA_SUPER_ADMIN_EMAIL = 'innovacion@kbsbusiness.com';
const SARA_PERMISSIONS_SHEET = 'Permisos';
const SARA_ALL_VIEWS = Object.freeze([
  'overview', 'alerts', 'crm', 'billing', 'training', 'contingency',
  'safety', 'hr', 'commercial', 'evaluations', 'hierarchies'
]);

function ensurePermissionsSheet_() {
  const spreadsheet = getRepository_();
  let sheet = spreadsheet.getSheetByName(SARA_PERMISSIONS_SHEET);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SARA_PERMISSIONS_SHEET);
    const headers = ['Correo', 'Modulo', 'Permitido', 'ActualizadoPor', 'Fecha'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground('#11151c').setFontColor('#ffd400').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function initializeSaraRepositoryV2_() {
  initializeSaraRepository_();
  ensurePermissionsSheet_();
  const sheet = getSheet_(SARA_CONFIG.SHEETS.HIERARCHIES, true);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(normalizeKey_);
  const emailColumn = headers.indexOf('CORREO');
  const rowIndex = values.findIndex((row, index) => index > 0 && normalizeText_(row[emailColumn]).toLowerCase() === SARA_SUPER_ADMIN_EMAIL);
  const superAdminRow = ['KBS-SA-001', 'Innovación KBS', 'Innovación', 'Superadministrador SARA', 'ACTIVO', 'DIRECCIÓN', SARA_SUPER_ADMIN_EMAIL];
  if (rowIndex > 0) sheet.getRange(rowIndex + 1, 1, 1, superAdminRow.length).setValues([superAdminRow]);
  else sheet.appendRow(superAdminRow);
  appendAudit_('CONFIGURAR_SUPERADMIN', 'JERARQUIA', 'KBS-SA-001', '', SARA_SUPER_ADMIN_EMAIL, SARA_SUPER_ADMIN_EMAIL);
  return 'SARA v2 inicializado con superadministrador y permisos por módulo.';
}
