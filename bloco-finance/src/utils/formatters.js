export function fmtBRL(value) {
  const n = parseFloat(value) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function fmtPct(value, decimals = 1) {
  return `${(parseFloat(value) || 0).toFixed(decimals)}%`;
}

export function sumActive(items) {
  return items.filter(i => i.active).reduce((acc, i) => acc + (parseFloat(i.value) || 0), 0);
}

export function getStairLevel(salesValue, staircase) {
  const sorted = [...staircase].sort((a, b) => b.threshold - a.threshold);
  return sorted.find(s => salesValue >= s.threshold) || staircase[0];
}

export function uid() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function calcPriceFromCost(cost) {
  return cost / (1 - 0.45) / (1 - 0.06);
}
