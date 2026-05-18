import { fmtBRL, sumActive } from '../utils/formatters';

const BAR_COLORS = ['#001B72', '#4B585A', '#610713', '#1a5c8a', '#5a4b1a', '#2d6a2d'];

export default function CategoryChart({ categories }) {
  const totals = categories.map(cat => ({
    name: cat.name,
    total: cat.items ? sumActive(cat.items) : sumActive(cat.rows || []),
  }));
  const grand = totals.reduce((a, b) => a + b.total, 0);

  return (
    <div className="chart-container">
      <div className="chart-title">Distribuição por Categoria</div>
      {totals.map((cat, i) => {
        const pct = grand > 0 ? (cat.total / grand) * 100 : 0;
        return (
          <div key={cat.name} className="chart-bar-row">
            <div className="chart-bar-label">{cat.name}</div>
            <div className="chart-bar-track">
              <div
                className="chart-bar-fill"
                style={{ width: `${pct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
              />
            </div>
            <div className="chart-bar-pct">{pct.toFixed(1)}%</div>
            <div className="chart-bar-val">{fmtBRL(cat.total)}</div>
          </div>
        );
      })}
    </div>
  );
}
