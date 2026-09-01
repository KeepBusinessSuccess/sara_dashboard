function getCommercialData_(context) {
  requireView_(context, 'commercial');
  const commercial = rowsFromSheet_(SARA_CONFIG.SHEETS.COMMERCIAL, 5000);
  const marketing = rowsFromSheet_(SARA_CONFIG.SHEETS.MARKETING, 5000);
  const leads = commercial.reduce((sum, row) => sum + number_(firstValue_(row, ['Leads'], 0)), 0);
  const won = commercial.reduce((sum, row) => sum + number_(firstValue_(row, ['Ganados'], 0)), 0);
  return {
    visits: commercial.reduce((sum, row) => sum + number_(firstValue_(row, ['Visitas'], 0)), 0),
    leads: leads,
    conversion: leads ? Number((won / leads * 100).toFixed(1)) : 0,
    revenue: commercial.reduce((sum, row) => sum + number_(firstValue_(row, ['Monto'], 0)), 0),
    adSpend: marketing.reduce((sum, row) => sum + number_(firstValue_(row, ['Gasto'], 0)), 0)
  };
}
