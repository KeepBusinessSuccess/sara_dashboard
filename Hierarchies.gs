function getHierarchiesData_(context) {
  requireView_(context, 'hierarchies');
  requireSuperAdmin_(context);
  return rowsFromSheet_(SARA_CONFIG.SHEETS.HIERARCHIES, 5000).map(row => {
    const email = normalizeText_(firstValue_(row, ['Correo'], '')).toLowerCase();
    const role = canonicalRole_(firstValue_(row, ['Rol'], '')) || normalizeText_(firstValue_(row, ['Rol'], ''));
    return {
      id: normalizeText_(firstValue_(row, ['ID'], '')),
      name: normalizeText_(firstValue_(row, ['Nombre'], '')),
      department: normalizeText_(firstValue_(row, ['Departamento'], '')),
      position: normalizeText_(firstValue_(row, ['Puesto'], '')),
      status: normalizeText_(firstValue_(row, ['Status', 'Estatus'], '')),
      role: email === SARA_SUPER_ADMIN_EMAIL ? 'SUPER ADMIN' : role,
      email: email,
      views: email === SARA_SUPER_ADMIN_EMAIL ? SARA_ALL_VIEWS.slice() : getEffectiveViewsForUser_(email, role),
      protected: email === SARA_SUPER_ADMIN_EMAIL
    };
  });
}

function apiSaveHierarchyRecord(record) {
  const context = getAccessContext_();
  requireSuperAdmin_(context);
  if (!record || typeof record !== 'object') throw new Error('El registro recibido no es válido.');
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet_(SARA_CONFIG.SHEETS.HIERARCHIES, true);
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(normalizeKey_);
    const idColumn = headers.indexOf('ID');
    const emailColumn = headers.indexOf('CORREO');
    if (idColumn < 0 || emailColumn < 0) throw new Error('Jerarquias no contiene las columnas ID y Correo.');

    const email = normalizeText_(record.email).toLowerCase();
    if (!email.endsWith('@' + SARA_CONFIG.ALLOWED_DOMAIN)) throw new Error('El correo debe pertenecer a @' + SARA_CONFIG.ALLOWED_DOMAIN + '.');
    const name = normalizeText_(record.name);
    if (!name) throw new Error('El nombre es obligatorio.');
    let role = canonicalRole_(record.role);
    if (!role) throw new Error('El rol seleccionado no es válido.');
    let status = normalizeComparable_(record.status) === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO';
    if (email === SARA_SUPER_ADMIN_EMAIL) { role = 'DIRECCIÓN'; status = 'ACTIVO'; }

    const suppliedId = normalizeText_(record.id);
    let rowIndex = values.findIndex((row, index) => index > 0 && suppliedId && normalizeText_(row[idColumn]) === suppliedId);
    const duplicateEmail = values.findIndex((row, index) => index > 0 && normalizeText_(row[emailColumn]).toLowerCase() === email && index !== rowIndex);
    if (duplicateEmail > 0) throw new Error('Ya existe una persona con ese correo.');
    const id = rowIndex > 0 ? normalizeText_(values[rowIndex][idColumn]) : ('KBS-' + Utilities.getUuid().slice(0, 8).toUpperCase());
    const previous = rowIndex > 0 ? JSON.stringify(values[rowIndex].slice(0, 7)) : '';
    const row = [id, name, normalizeText_(record.department), normalizeText_(record.position), status, role, email];
    if (rowIndex > 0) sheet.getRange(rowIndex + 1, 1, 1, 7).setValues([row]);
    else sheet.appendRow(row);
    savePermissionOverrides_(email, Array.isArray(record.views) ? record.views : [], context.email);
    SpreadsheetApp.flush();
    appendAudit_(rowIndex > 0 ? 'ACTUALIZAR_JERARQUIA' : 'CREAR_JERARQUIA', 'JERARQUIA', id, previous, JSON.stringify(row), context.email);
    return { ok: true, record: getHierarchiesData_(context).find(item => item.id === id) };
  } finally {
    lock.releaseLock();
  }
}

function savePermissionOverrides_(email, selectedViews, actorEmail) {
  const sheet = ensurePermissionsSheet_();
  const normalizedEmail = normalizeText_(email).toLowerCase();
  for (let row = sheet.getLastRow(); row >= 2; row -= 1) {
    if (normalizeText_(sheet.getRange(row, 1).getValue()).toLowerCase() === normalizedEmail) sheet.deleteRow(row);
  }
  if (normalizedEmail === SARA_SUPER_ADMIN_EMAIL) return;
  const allowed = new Set(selectedViews.map(view => normalizeText_(view).toLowerCase()));
  const rows = SARA_ALL_VIEWS.filter(view => view !== 'hierarchies').map(view => [normalizedEmail, view, allowed.has(view), actorEmail, new Date()]);
  if (rows.length) sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}
