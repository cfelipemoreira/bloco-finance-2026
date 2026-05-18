import { fmtBRL, sumActive } from '../utils/formatters';

const TYPE_CLASS = {
  Gestão: 'badge-gestao', Posição: 'badge-posicao', Retro: 'badge-retro',
  Parcela: 'badge-parcela', Fixo: 'badge-fixo', 'Equip.': 'badge-equip',
  Banco: 'badge-banco', Despesa: 'badge-despesa', Produção: 'badge-producao',
  Imposto: 'badge-imposto',
};

export default function ReadOnlyTable({ title, rows, subtotalLabel }) {
  const total = sumActive(rows);
  return (
    <div className="table-wrap">
      {title && (
        <div className="table-header-row">
          <span className="th col-name">Responsável</span>
          <span className="th col-desc">Descrição</span>
          <span className="th col-value">Valor</span>
          <span className="th col-type">Tipo</span>
        </div>
      )}
      {rows.map(row => (
        <div
          key={row.id}
          className={`table-row${!row.active ? ' inactive' : ''}${row.removed ? ' removed' : ''}`}
        >
          <span className="col-name">{row.name}</span>
          <span className="col-desc">{row.desc}</span>
          <span className="col-value">{fmtBRL(row.value)}</span>
          <span className="col-type">
            <span className={`type-badge ${TYPE_CLASS[row.type] || ''}`}>{row.type}</span>
          </span>
        </div>
      ))}
      <div className="table-subtotal">
        <span className="sub-label">{subtotalLabel || 'Subtotal'}</span>
        <span className="sub-value">{fmtBRL(total)}</span>
      </div>
    </div>
  );
}
