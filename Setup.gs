const SARA_SCHEMAS = Object.freeze({
  Jerarquias: ['ID', 'Nombre', 'Departamento', 'Puesto', 'Status', 'Rol', 'Correo'],
  Metas: ['Periodo', 'Area', 'Indicador', 'Meta'],
  Alertas: ['ID', 'Concepto', 'Area', 'Responsable', 'FechaVencimiento', 'Estatus', 'Referencia'],
  CRM: ['ID', 'Fecha', 'Departamento', 'Fuente', 'Estatus', 'Monto', 'Responsable', 'Cliente'],
  Facturacion: ['ID', 'Cliente', 'Folio', 'FechaEmision', 'FechaVencimiento', 'Subtotal', 'IVA', 'Total', 'Estatus', 'Pagado'],
  Capacitacion: ['ID', 'Curso', 'Cliente', 'Instructor', 'Fecha', 'HorasInstructor', 'CostoSuscripcion', 'Calificacion', 'Estatus'],
  Proyectos: ['ID', 'Proyecto', 'Area', 'Responsable', 'FechaInicio', 'FechaFin', 'Avance', 'IngresosContratados', 'CostosReales', 'Estatus'],
  Contingencia: ['ID', 'Proyecto', 'Cliente', 'Responsable', 'Avance', 'MontoCotizado', 'CostoEstimado', 'Estatus'],
  SeguridadNormas: ['ID', 'Concepto', 'Tipo', 'Fecha', 'FechaVencimiento', 'Costo', 'Beneficio', 'Estatus', 'Responsable'],
  RecursosHumanos: ['ID', 'Empleado', 'Departamento', 'Puesto', 'FechaIngreso', 'Asistencia', 'Incidencias', 'Estatus'],
  Marketing: ['ID', 'Fecha', 'Canal', 'Evento', 'Seguidores', 'Leads', 'CursosDigitales', 'Publicaciones', 'Gasto'],
  Comercial: ['ID', 'Fecha', 'Vendedor', 'Visitas', 'Leads', 'Ganados', 'Monto'],
  EvaluacionesN4: ['ID', 'Periodo', 'Coordinador', 'Area', 'Eje', 'Indicador', 'Resultado', 'Meta', 'Peso'],
  Bitacora: ['ID', 'FechaHora', 'Usuario', 'Accion', 'Entidad', 'EntidadID', 'ValorAnterior', 'ValorNuevo']
});

function initializeSaraRepository_() {
  const spreadsheet = getRepository_();
  const ownerEmail = normalizeText_(Session.getEffectiveUser().getEmail()).toLowerCase();
  if (!ownerEmail.endsWith('@' + SARA_CONFIG.ALLOWED_DOMAIN)) throw new Error('La configuración inicial debe ejecutarse desde una cuenta corporativa.');

  Object.keys(SARA_SCHEMAS).forEach(name => {
    let sheet = spreadsheet.getSheetByName(name);
    if (!sheet) sheet = spreadsheet.insertSheet(name);
    const headers = SARA_SCHEMAS[name];
    if (sheet.getLastRow() === 0 || sheet.getRange(1, 1).getValue() === '') {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setBackground('#11151c').setFontColor('#ffd400').setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  });

  const hierarchy = spreadsheet.getSheetByName(SARA_CONFIG.SHEETS.HIERARCHIES);
  if (hierarchy.getLastRow() < 2) {
    hierarchy.appendRow(['KBS-001', Session.getEffectiveUser().getEmail().split('@')[0], 'Dirección', 'Administrador inicial', 'ACTIVO', 'DIRECCIÓN', ownerEmail]);
  }
  appendAudit_('INICIALIZAR', 'SISTEMA', 'SARA', '', 'Repositorio preparado', ownerEmail);
  return 'SARA fue inicializado correctamente.';
}

function protectSaraRepository_() {
  const context = getAccessContext_();
  requireDirection_(context);
  const spreadsheet = getRepository_();
  spreadsheet.getSheets().forEach(sheet => {
    const existing = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).find(item => item.getDescription() === 'SARA_MANAGED');
    const protection = existing || sheet.protect().setDescription('SARA_MANAGED');
    protection.setWarningOnly(false);
    const editors = protection.getEditors();
    if (editors.length) protection.removeEditors(editors);
    protection.addEditor(Session.getEffectiveUser());
    if (protection.canDomainEdit()) protection.setDomainEdit(false);
  });
  appendAudit_('PROTEGER', 'SISTEMA', 'SARA', '', 'Pestañas protegidas', context.email);
  return 'Pestañas protegidas. Los cambios deben realizarse desde SARA.';
}


