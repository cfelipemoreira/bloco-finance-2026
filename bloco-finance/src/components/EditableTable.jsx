import { useState, useRef } from 'react';
import { fmtBRL, sumActive, uid } from '../utils/formatters';

const TYPE_OPTIONS = ['Gestão', 'Posição', 'Retro', 'Parcela', 'Fixo', 'Equip.', 'Banco', 'Despesa', 'Produção', 'Imposto'];
const TYPE_CLASS = {
  Gestão: 'badge-gestao', Posição: 'badge-posicao', Retro: 'badge-retro',
  Parcela: 'badge-parcela', Fixo: 'badge-fixo', 'Equip.': 'badge-equip',
  Banco: 'badge-banco', Despesa: 'badge-despesa', Produção: 'badge-producao',
  Imposto: 'badge-imposto',
};

function InlineText({ value, onChange }) {
  return (
    <input
      className="inline-edit-field"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function InlineValue({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');
  const ref = useRef();

  const startEdit = () => {
    setRaw(String(value));
    setEditing(true);
    setTimeout(() => ref.current?.select(), 10);
  };

  const commit = () => {
    const n = parseFloat(raw.replace(',', '.'));
    if (!isNaN(n)) onChange(n);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        className="inline-edit-field value-field"
        value={raw}
        onChange={e => setRaw(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      style={{ cursor: 'pointer', fontFamily: 'PPTelegraf, sans-serif', fontSize: 13, display: 'block', width: '100%', textAlign: 'right' }}
      title="Clique para editar"
    >
      {fmtBRL(value)}
    </span>
  );
}

export default function EditableTable({ rows, onChange, subtotalLabel, showType = true }) {
  const total = sumActive(rows);

  const update = (id, field, val) => {
    onChange(rows.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const toggleActive = (id) => {
    onChange(rows.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const removeRow = (id) => {
    onChange(rows.filter(r => r.id !== id));
  };

  const addRow = () => {
    onChange([...rows, { id: uid(), name: 'Novo item', desc: '', value: 0, type: 'Fixo', active: true }]);
  };

  return (
    <div className="table-wrap">
      <div className="table-header-row">
        <span className="th col-name">Responsável</span>
        <span className="th col-desc">Descrição</span>
        <span className="th col-value">Valor</span>
        {showType && <span className="th col-type">Tipo</span>}
        <span className="th col-action" style={{ width: 100 }}>Ativo</span>
      </div>
      {rows.map(row => (
        <div key={row.id} className={`table-row${!row.active ? ' inactive' : ''}`}>
          <span className="col-name">
            <InlineText value={row.name} onChange={v => update(row.id, 'name', v)} />
          </span>
          <span className="col-desc">
            <InlineText value={row.desc || ''} onChange={v => update(row.id, 'desc', v)} />
          </span>
          <span className="col-value">
            <InlineValue value={row.value} onChange={v => update(row.id, 'value', v)} />
          </span>
          {showType && (
            <span className="col-type">
              <select
                value={row.type}
                onChange={e => update(row.id, 'type', e.target.value)}
                style={{ fontSize: 11, padding: '2px 4px', borderRadius: 4, border: '1px solid #ddd', background: 'transparent', cursor: 'pointer' }}
              >
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </span>
          )}
          <span className="col-action" style={{ width: 100, display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
            <label className="toggle">
              <input type="checkbox" checked={row.active} onChange={() => toggleActive(row.id)} />
              <span className="toggle-slider" />
            </label>
            <button className="btn btn-icon" style={{ color: '#aaa', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }} onClick={() => removeRow(row.id)} title="Remover">×</button>
          </span>
        </div>
      ))}
      <button className="add-row-btn" onClick={addRow}>+ Adicionar linha</button>
      <div className="table-subtotal">
        <span className="sub-label">{subtotalLabel || 'Subtotal'}</span>
        <span className="sub-value">{fmtBRL(total)}</span>
      </div>
    </div>
  );
}
