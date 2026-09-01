function getCrmData_(context) {
  requireView_(context, 'crm');
  const rows = rowsFromSheet_(SARA_CONFIG.SHEETS.CRM, 5000);
  const byStatus = {};
  const bySource = {};
  rows.forEach(row => {
    const status = normalizeText_(firstValue_(row, ['Estatus', 'Status'], 'Sin estatus'));
    const source = normalizeText_(firstValue_(row, ['Fuente'], 'Sin fuente'));
    byStatus[status] = (byStatus[status] || 0) + 1;
    bySource[source] = (bySource[source] || 0) + 1;
  });
  return { total: rows.length, amount: rows.reduce((sum, row) => sum + number_(firstValue_(row, ['Monto'], 0)), 0), byStatus: byStatus, bySource: bySource };
}
