function getCoordinatorEvaluationsData_(context) {
  requireView_(context, 'evaluations');
  const rows = rowsFromSheet_(SARA_CONFIG.SHEETS.EVALUATIONS, 5000);
  const scores = {};
  rows.forEach(row => {
    const coordinator = normalizeText_(firstValue_(row, ['Coordinador'], 'Sin asignar'));
    const result = number_(firstValue_(row, ['Resultado'], 0));
    const target = number_(firstValue_(row, ['Meta'], 0));
    const weight = number_(firstValue_(row, ['Peso'], 1));
    if (!scores[coordinator]) scores[coordinator] = { weighted: 0, weight: 0 };
    scores[coordinator].weighted += (target ? result / target * 100 : result) * weight;
    scores[coordinator].weight += weight;
  });
  return Object.keys(scores).map(name => ({ coordinator: name, score: scores[name].weight ? Number((scores[name].weighted / scores[name].weight).toFixed(1)) : 0 }));
}
