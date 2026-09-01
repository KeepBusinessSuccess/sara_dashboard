function getHumanResourcesData_(context) {
  requireView_(context, 'hr');
  const rows = rowsFromSheet_(SARA_CONFIG.SHEETS.HR, 5000);
  const active = rows.filter(row => ['ACTIVO', 'ACTIVE', '1', 'TRUE'].includes(normalizeComparable_(firstValue_(row, ['Estatus', 'Status'], ''))));
  return {
    headcount: active.length,
    incidents: rows.reduce((sum, row) => sum + number_(firstValue_(row, ['Incidencias'], 0)), 0),
    attendance: active.length ? Number((active.reduce((sum, row) => sum + number_(firstValue_(row, ['Asistencia'], 0)), 0) / active.length).toFixed(1)) : 0
  };
}
