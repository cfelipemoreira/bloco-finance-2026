import { useState, useRef, useCallback } from 'react';
import { loadInvestimentos, saveInvestimentos } from '../utils/storage';
import { fmtBRL, uid } from '../utils/formatters';

const STATUS_OPTIONS = ['Ativo', 'Pendente', 'Concluído'];
const STATUS_CLASS = { Ativo: 'status-ativo', Pendente: 'status-pendente', Concluído: 'status-concluido' };

function InlineText({ value, onChange }) {
  return <input className="inline-edit-field" value={value} onChange={e => onChange(e.target.value)} />;
}

function InlineValue({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');
  const ref = useRef();
  const start = () => { setRaw(String(value)); setEditing(true); setTimeout(() => ref.current?.select(), 10); };
  const commit = () => { const n = parseFloat(raw.replace(',', '.')); if (!isNaN(n)) onChange(n); setEditing(false); };
  if (editing) return (
    <input ref={ref} className="inline-edit-field value-field" value={raw}
      onChange={e => setRaw(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }} />
  );
  return <span onClick={start} style={{ cursor: 'pointer', fontFamily: 'PPTelegraf, sans-serif', fontSize: 13, display: 'block', textAlign: 'right' }} title="Clique para editar">{fmtBRL(value)}</span>;
}

export default function Tab4Investimentos() {
  const [items, setItems] = useState(() => loadInvestimentos());
  const debounceRef = useRef();

  const persist = useCallback((data) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveInvestimentos(data), 500);
  }, []);

  const update = (id, field, val) => {
    const next = items.map(i => i.id === id ? { ...i, [field]: val } : i);
    setItems(next); persist(next);
  };

  const remove = (id) => {
    const next = items.filter(i => i.id !== id);
    setItems(next); persist(next);
  };

  const add = () => {
    const next = [...items, {
      id: uid(), name: 'Novo investimento', category: 'Equipamento',
      value: 0, date: new Date().toISOString().slice(0, 10),
      status: 'Pendente', notes: ''
    }];
    setItems(next); persist(next);
  };

  const total = items.reduce((a, b) => a + (parseFloat(b.value) || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1>Quadro de Investimentos</h1>
        <p>Registre e acompanhe os investimentos da empresa.</p>
      </div>

      <div className="metric-cards" style={{ marginBottom: 24 }}>
        <div className="metric-card highlight">
          <div className="mc-label">Total Investimentos</div>
          <div className="mc-value">{fmtBRL(total)}</div>
        </div>
        <div className="metric-card">
          <div className="mc-label">Itens cadastrados</div>
          <div className="mc-value" style={{ fontSize: 24 }}>{items.length}</div>
        </div>
        <div className="metric-card">
          <div className="mc-label">Ativos</div>
          <div className="mc-value" style={{ fontSize: 24 }}>{items.filter(i => i.status === 'Ativo').length}</div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="table-wrap">
          <div className="empty-state">
            <p>Nenhum investimento cadastrado ainda.</p>
            <button className="btn btn-primary" onClick={add}>+ Adicionar investimento</button>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <div className="table-header-row">
            <span className="th" style={{ flex: 2 }}>Investimento</span>
            <span className="th" style={{ flex: 1 }}>Categoria</span>
            <span className="th" style={{ flex: 1 }}>Valor</span>
            <span className="th" style={{ flex: 1 }}>Data</span>
            <span className="th" style={{ flex: 1 }}>Status</span>
            <span className="th" style={{ flex: 2 }}>Observações</span>
            <span className="th" style={{ width: 40 }}></span>
          </div>
          {items.map(item => (
            <div key={item.id} className="table-row">
              <span style={{ flex: 2 }}><InlineText value={item.name} onChange={v => update(item.id, 'name', v)} /></span>
              <span style={{ flex: 1 }}><InlineText value={item.category} onChange={v => update(item.id, 'category', v)} /></span>
              <span style={{ flex: 1 }}><InlineValue value={item.value} onChange={v => update(item.id, 'value', v)} /></span>
              <span style={{ flex: 1 }}>
                <input type="date" className="inline-edit-field" value={item.date}
                  onChange={e => update(item.id, 'date', e.target.value)}
                  style={{ fontSize: 12 }} />
              </span>
              <span style={{ flex: 1 }}>
                <select value={item.status} onChange={e => update(item.id, 'status', e.target.value)}
                  style={{ fontSize: 12, padding: '3px 6px', borderRadius: 12, border: '1px solid #ddd', background: 'transparent', cursor: 'pointer' }}>
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </span>
              <span style={{ flex: 2 }}><InlineText value={item.notes || ''} onChange={v => update(item.id, 'notes', v)} /></span>
              <span style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                <button onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: 16 }}>×</button>
              </span>
            </div>
          ))}
          <button className="add-row-btn" onClick={add}>+ Adicionar investimento</button>
        </div>
      )}

      {items.length > 0 && (
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={add}>
          + Adicionar investimento
        </button>
      )}
    </div>
  );
}
