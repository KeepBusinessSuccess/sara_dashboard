function getContingencyData_(context) {
  requireView_(context, 'contingency');
  const rows = rowsFromSheet_(SARA_CONFIG.SHEETS.CONTINGENCY, 5000);
  return {
    projects: rows.length,
    averageProgress: averageProgress_(rows),
    quoted: rows.reduce((sum, row) => sum + number_(firstValue_(row, ['MontoCotizado'], 0)), 0),
    estimatedCost: rows.reduce((sum, row) => sum + number_(firstValue_(row, ['CostoEstimado'], 0)), 0)
  };
}
