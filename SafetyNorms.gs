function getSafetyData_(context) {
  requireView_(context, 'safety');
  const rows = rowsFromSheet_(SARA_CONFIG.SHEETS.SAFETY, 5000);
  const costs = rows.reduce((sum, row) => sum + number_(firstValue_(row, ['Costo'], 0)), 0);
  const benefits = rows.reduce((sum, row) => sum + number_(firstValue_(row, ['Beneficio'], 0)), 0);
  return { records: rows.length, costs: costs, benefits: benefits, roi: costs ? Number((benefits / costs).toFixed(2)) : 0 };
}
