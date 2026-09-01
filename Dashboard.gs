function getDashboardData_(context) {
  requireView_(context, 'overview');
  const billing = rowsFromSheet_(SARA_CONFIG.SHEETS.BILLING, 5000);
  const courses = rowsFromSheet_(SARA_CONFIG.SHEETS.TRAINING, 5000);
  const projects = rowsFromSheet_(SARA_CONFIG.SHEETS.PROJECTS, 5000);
  const leads = rowsFromSheet_(SARA_CONFIG.SHEETS.CRM, 5000);
  const now = new Date();
  const currentMonth = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM');

  const paidStatuses = ['PAGADA', 'PAGADO', 'COBRADA', 'COBRADO'];
  const currentBilling = billing.filter(row => monthKey_(firstValue_(row, ['FechaEmision', 'Fecha'], '')) === currentMonth);
  const revenue = currentBilling.reduce((sum, row) => sum + number_(firstValue_(row, ['Total', 'Monto'], 0)), 0);
  const overdueRows = billing.filter(row => {
    const due = date_(firstValue_(row, ['FechaVencimiento', 'Vencimiento'], ''));
    const status = normalizeComparable_(firstValue_(row, ['Estatus', 'Status'], ''));
    return due && due < now && !paidStatuses.includes(status);
  });
  const overdueAmount = overdueRows.reduce((sum, row) => sum + number_(firstValue_(row, ['Total', 'Monto'], 0)), 0);
  const activeCourses = courses.filter(row => !['CANCELADO', 'CERRADO'].includes(normalizeComparable_(firstValue_(row, ['Estatus', 'Status'], ''))));
  const activeProjects = projects.filter(row => !['CERRADO', 'FINALIZADO', 'CANCELADO'].includes(normalizeComparable_(firstValue_(row, ['Estatus', 'Status'], ''))));
  const activeLeads = leads.filter(row => !['GANADO', 'PERDIDO'].includes(normalizeComparable_(firstValue_(row, ['Estatus', 'Status'], ''))));

  return {
    metrics: [
      { id: 'revenue', label: 'Facturación', value: revenue, display: 'money', icon: '$', trend: comparePreviousMonth_(billing, ['FechaEmision', 'Fecha'], ['Total', 'Monto']), meta: 'vs. mes anterior', color: '#ffd400', warning: getTarget_('Facturación', currentMonth), danger: 0 },
      { id: 'courses', label: 'Cursos activos', value: activeCourses.length, icon: '△', trend: String(courses.length) + ' totales', meta: 'periodo consultado', color: '#3edbd7', warning: 1, danger: 0 },
      { id: 'projects', label: 'Proyectos activos', value: activeProjects.length, icon: '◇', trend: averageProgress_(activeProjects) + '%', meta: 'avance promedio', color: '#44d39a', warning: 1, danger: 0 },
      { id: 'overdue', label: 'Facturas vencidas', value: overdueRows.length, icon: '!', trend: compactMoney_(overdueAmount), meta: 'monto pendiente', color: '#ff5f68', warning: 6, danger: 0, invert: true },
      { id: 'leads', label: 'Leads', value: activeLeads.length, icon: '◎', trend: String(leads.length) + ' totales', meta: 'pipeline activo', color: '#b98cff', warning: 1, danger: 0 }
    ],
    trend: buildBillingTrend_(billing),
    crm: buildCrmFunnel_(leads),
    projects: activeProjects.slice(0, 3).map(row => ({
      name: normalizeText_(firstValue_(row, ['Proyecto', 'Nombre'], 'Proyecto sin nombre')),
      progress: Math.max(0, Math.min(100, number_(firstValue_(row, ['Avance', 'PorcentajeAvance'], 0))))
    }))
  };
}

function comparePreviousMonth_(rows, dateAliases, valueAliases) {
  const now = new Date();
  const current = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM');
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previous = Utilities.formatDate(previousDate, Session.getScriptTimeZone(), 'yyyy-MM');
  const totalFor = key => rows.filter(row => monthKey_(firstValue_(row, dateAliases, '')) === key).reduce((sum, row) => sum + number_(firstValue_(row, valueAliases, 0)), 0);
  const currentValue = totalFor(current);
  const previousValue = totalFor(previous);
  if (!previousValue) return currentValue ? '+100%' : '0%';
  const delta = (currentValue - previousValue) / previousValue * 100;
  return (delta >= 0 ? '+' : '') + delta.toFixed(1) + '%';
}

function averageProgress_(rows) {
  if (!rows.length) return 0;
  return Math.round(rows.reduce((sum, row) => sum + number_(firstValue_(row, ['Avance', 'PorcentajeAvance'], 0)), 0) / rows.length);
}

function getTarget_(indicator, period) {
  const rows = rowsFromSheet_(SARA_CONFIG.SHEETS.TARGETS, 5000);
  const target = rows.find(row => normalizeComparable_(firstValue_(row, ['Indicador'], '')) === normalizeComparable_(indicator) && normalizeText_(firstValue_(row, ['Periodo'], '')) === period);
  return target ? number_(firstValue_(target, ['Meta'], 0)) : 0;
}

function buildBillingTrend_(rows) {
  const now = new Date();
  const labels = [];
  const actual = [];
  const target = [];
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM');
    labels.push(months[date.getMonth()]);
    actual.push(Number((rows.filter(row => monthKey_(firstValue_(row, ['FechaEmision', 'Fecha'], '')) === key).reduce((sum, row) => sum + number_(firstValue_(row, ['Total', 'Monto'], 0)), 0) / 1000000).toFixed(2)));
    target.push(Number((getTarget_('Facturación', key) / 1000000).toFixed(2)));
  }
  const total = actual[actual.length - 1] * 1000000;
  const latestTarget = target[target.length - 1] * 1000000;
  const delta = latestTarget ? Number(((total - latestTarget) / latestTarget * 100).toFixed(1)) : 0;
  return { labels: labels, actual: actual, target: target, total: total, delta: delta };
}

function buildCrmFunnel_(rows) {
  const stages = ['NUEVO', 'CONTACTADO', 'COTIZADO', 'GANADO'];
  const labels = { NUEVO: 'Nuevos', CONTACTADO: 'Contactados', COTIZADO: 'Cotizados', GANADO: 'Ganados' };
  return stages.map(stage => ({ label: labels[stage], value: rows.filter(row => normalizeComparable_(firstValue_(row, ['Estatus', 'Status'], '')) === stage).length }));
}

function compactMoney_(value) {
  const amount = number_(value);
  if (Math.abs(amount) >= 1000000) return '$' + (amount / 1000000).toFixed(1) + ' M';
  if (Math.abs(amount) >= 1000) return '$' + Math.round(amount / 1000) + ' k';
  return '$' + Math.round(amount);
}
