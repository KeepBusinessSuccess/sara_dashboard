function normalizeKey_(value) {
  return String(value == null ? '' : value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();
}

function normalizeText_(value) {
  return String(value == null ? '' : value).trim();
}

function normalizeComparable_(value) {
  return normalizeText_(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function number_(value) {
  if (typeof value === 'number') return isFinite(value) ? value : 0;
  const parsed = Number(String(value || '').replace(/[$,\s]/g, ''));
  return isFinite(parsed) ? parsed : 0;
}

function date_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function getSheet_(name, required) {
  const sheet = getRepository_().getSheetByName(name);
  if (!sheet && required !== false) throw new Error('Falta la pestaña requerida: ' + name + '.');
  return sheet;
}

function rowsFromSheet_(name, limit) {
  const sheet = getSheet_(name, false);
  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) return [];
  const rowCount = Math.min(sheet.getLastRow() - 1, limit || SARA_CONFIG.MAX_ROWS_PER_VIEW);
  const values = sheet.getRange(1, 1, rowCount + 1, sheet.getLastColumn()).getValues();
  const headers = values.shift().map(normalizeKey_);
  return values
    .filter(row => row.some(cell => cell !== '' && cell != null))
    .map((row, index) => {
      const record = { __row: index + 2 };
      headers.forEach((header, column) => { if (header) record[header] = row[column]; });
      return record;
    });
}

function firstValue_(record, aliases, fallback) {
  for (let i = 0; i < aliases.length; i += 1) {
    const key = normalizeKey_(aliases[i]);
    if (Object.prototype.hasOwnProperty.call(record, key) && record[key] !== '') return record[key];
  }
  return fallback;
}

function formatDate_(value, pattern) {
  const parsed = date_(value);
  if (!parsed) return '';
  return Utilities.formatDate(parsed, Session.getScriptTimeZone(), pattern || 'dd MMM yyyy');
}

function monthKey_(value) {
  const parsed = date_(value);
  return parsed ? Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM') : '';
}

function appendAudit_(action, entity, entityId, beforeValue, afterValue, actorEmail) {
  const sheet = getSheet_(SARA_CONFIG.SHEETS.AUDIT, true);
  sheet.appendRow([Utilities.getUuid(), new Date(), actorEmail, action, entity, entityId, beforeValue, afterValue]);
}
