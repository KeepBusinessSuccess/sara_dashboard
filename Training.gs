function getTrainingData_(context) {
  requireView_(context, 'training');
  const rows = rowsFromSheet_(SARA_CONFIG.SHEETS.TRAINING, 5000);
  const ratings = rows.map(row => number_(firstValue_(row, ['Calificacion'], 0))).filter(Boolean);
  return {
    courses: rows.length,
    instructorHours: rows.reduce((sum, row) => sum + number_(firstValue_(row, ['HorasInstructor', 'Horas'], 0)), 0),
    subscriptions: rows.reduce((sum, row) => sum + number_(firstValue_(row, ['CostoSuscripcion', 'Suscripcion'], 0)), 0),
    averageRating: ratings.length ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 0
  };
}
