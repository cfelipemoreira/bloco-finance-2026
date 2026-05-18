import { fmtBRL, sumActive } from '../utils/formatters';

export default function DebtBox({ rows }) {
  const total = sumActive(rows);
  return (
    <div className="debt-box">
      <div className="debt-box-header">
        <h3>Dívidas &amp; Retroativos</h3>
      </div>
      {rows.map(row => (
        <div key={row.id} className="table-row">
          <span className="col-name">{row.name}</span>
          <span className="col-desc">{row.desc}</span>
          <span className="col-value">{fmtBRL(row.value)}</span>
          <span className="col-type">
            <span className="type-badge badge-parcela">{row.type}</span>
          </span>
        </div>
      ))}
      <div className="table-subtotal">
        <span className="sub-label" style={{ color: 'var(--bordo)' }}>Subtotal Dívidas</span>
        <span className="sub-value" style={{ color: 'var(--bordo)' }}>{fmtBRL(total)}</span>
      </div>
    </div>
  );
}
