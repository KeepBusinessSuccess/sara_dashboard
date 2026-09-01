function getAlertsData_(context) {
  requireView_(context, 'alerts');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return rowsFromSheet_(SARA_CONFIG.SHEETS.ALERTS, 5000)
    .map(row => {
      const due = date_(firstValue_(row, ['FechaVencimiento', 'Vencimiento', 'Fecha'], ''));
      const days = due ? Math.ceil((due.getTime() - now.getTime()) / 86400000) : 9999;
      return {
        id: normalizeText_(firstValue_(row, ['ID'], '')),
        title: normalizeText_(firstValue_(row, ['Concepto', 'Titulo', 'Alerta'], 'Alerta sin concepto')),
        area: normalizeText_(firstValue_(row, ['Area', 'Departamento'], 'General')),
        owner: normalizeText_(firstValue_(row, ['Responsable'], 'Sin asignar')),
        dueDate: formatDate_(due),
        days: days,
        status: days <= 7 ? 'critical' : days <= 60 ? 'soon' : 'valid'
      };
    })
    .sort((a, b) => a.days - b.days);
}
