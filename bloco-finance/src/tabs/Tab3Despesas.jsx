import { useState, useRef, useCallback } from 'react';
import { loadDespesas, saveDespesas } from '../utils/storage';
import CategoryChart from '../components/CategoryChart';
import { fmtBRL, sumActive, uid } from '../utils/formatters';

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
  return <span onClick={start} style={{ cursor: 'pointer', fontFamily: 'PPTelegraf, sans-serif', fontSize: 13, display: 'block', width: '100%', textAlign: 'right' }} title="Clique para editar">{fmtBRL(value)}</span>;
}

export default function Tab3Despesas() {
  const [categories, setCategories] = useState(() => loadDespesas());
  const debounceRef = useRef();

  const persist = useCallback((cats) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveDespesas(cats), 500);
  }, []);

  const updateCats = (next) => { setCategories(next); persist(next); };

  const updateItem = (catId, itemId, field, val) => {
    updateCats(categories.map(c =>
      c.id !== catId ? c : {
        ...c,
        items: c.items.map(i => i.id === itemId ? { ...i, [field]: val } : i)
      }
    ));
  };

  const toggleItem = (catId, itemId) => {
    updateCats(categories.map(c =>
      c.id !== catId ? c : {
        ...c,
        items: c.items.map(i => i.id === itemId ? { ...i, active: !i.active } : i)
      }
    ));
  };

  const removeItem = (catId, itemId) => {
    updateCats(categories.map(c =>
      c.id !== catId ? c : { ...c, items: c.items.filter(i => i.id !== itemId) }
    ));
  };

  const addItem = (catId) => {
    updateCats(categories.map(c =>
      c.id !== catId ? c : {
        ...c,
        items: [...c.items, { id: uid(), name: 'Nova despesa', value: 0, active: true }]
      }
    ));
  };

  const updateCatName = (catId, name) => {
    updateCats(categories.map(c => c.id === catId ? { ...c, name } : c));
  };

  const addCategory = () => {
    updateCats([...categories, { id: uid(), name: 'Nova Categoria', items: [] }]);
  };

  const removeCategory = (catId) => {
    if (window.confirm('Remover categoria e todos os itens?')) {
      updateCats(categories.filter(c => c.id !== catId));
    }
  };

  const grandTotal = categories.reduce((acc, cat) => acc + sumActive(cat.items), 0);

  return (
    <div>
      <div className="page-header">
        <h1>Quadro de Despesas</h1>
        <p>Clique em qualquer valor ou nome para editar. Salvo automaticamente.</p>
      </div>

      <div className="total-bar" style={{ marginBottom: 28 }}>
        <span className="tb-label">Total Geral de Despesas</span>
        <span className="tb-value">{fmtBRL(grandTotal)}</span>
      </div>

      <CategoryChart categories={categories} />

      {categories.map(cat => {
        const catTotal = sumActive(cat.items);
        return (
          <div key={cat.id} className="expense-category">
            <div className="cat-header">
              <h3>
                <input
                  value={cat.name}
                  onChange={e => updateCatName(cat.id, e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--creme)', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', textTransform: 'inherit', letterSpacing: 'inherit', outline: 'none', cursor: 'text', width: 'auto' }}
                />
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="cat-total">{fmtBRL(catTotal)}</span>
                <button
                  onClick={() => removeCategory(cat.id)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer', padding: '2px 8px', fontSize: 12 }}
                  title="Remover categoria"
                >×</button>
              </div>
            </div>

            {cat.items.map(item => (
              <div key={item.id} className={`expense-row${!item.active ? ' inactive' : ''}`}>
                <span className="exp-name">
                  <InlineText value={item.name} onChange={v => updateItem(cat.id, item.id, 'name', v)} />
                </span>
                <span className="exp-value">
                  <InlineValue value={item.value} onChange={v => updateItem(cat.id, item.id, 'value', v)} />
                </span>
                <span style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 12 }}>
                  <label className="toggle">
                    <input type="checkbox" checked={item.active} onChange={() => toggleItem(cat.id, item.id)} />
                    <span className="toggle-slider" />
                  </label>
                  <button
                    onClick={() => removeItem(cat.id, item.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: 14, lineHeight: 1 }}
                    title="Remover"
                  >×</button>
                </span>
              </div>
            ))}

            <button className="add-row-btn" onClick={() => addItem(cat.id)}>
              + Adicionar despesa
            </button>
          </div>
        );
      })}

      <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={addCategory}>
        + Adicionar categoria
      </button>
    </div>
  );
}
