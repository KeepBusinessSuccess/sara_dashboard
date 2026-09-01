function getBillingData_(context) {
  requireView_(context, 'billing');
  const rows = rowsFromSheet_(SARA_CONFIG.SHEETS.BILLING, 5000);
  const now = new Date();
  let billed = 0, tax = 0, receivable = 0, overdue = 0;
  rows.forEach(row => {
    const total = number_(firstValue_(row, ['Total', 'Monto'], 0));
    const paid = number_(firstValue_(row, ['Pagado'], 0));
    const due = date_(firstValue_(row, ['FechaVencimiento', 'Vencimiento'], ''));
    billed += total;
    tax += number_(firstValue_(row, ['IVA'], 0));
    receivable += Math.max(total - paid, 0);
    if (due && due < now) overdue += Math.max(total - paid, 0);
  });
  return { billed: billed, tax: tax, receivable: receivable, overdue: overdue, records: rows.length };
}
