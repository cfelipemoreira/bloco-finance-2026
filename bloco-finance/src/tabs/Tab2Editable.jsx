import { useState, useCallback, useEffect, useRef } from 'react';
import { INITIAL_DATA } from '../data/initialData';
import { loadScenarioB, saveScenarioB, loadStaircase, saveStaircase, loadBonus, saveBonus, resetScenarioB } from '../utils/storage';
import EditableTable from '../components/EditableTable';
import DebtBox from '../components/DebtBox';
import ResetModal from '../components/ResetModal';
import { fmtBRL, sumActive, uid } from '../utils/formatters';

function EditableDebtBox({ rows, onChange }) {
  const total = sumActive(rows);
  const update = (id, field, val) => onChange(rows.map(r => r.id === id ? { ...r, [field]: val } : r));
  const addRow = () => onChange([...rows, { id: uid(), name: 'Nova dívida', desc: '', value: 0, type: 'Parcela', active: true }]);
  const remove = (id) => onChange(rows.filter(r => r.id !== id));
  const toggle = (id) => onChange(rows.map(r => r.id === id ? { ...r, active: !r.active } : r));

  return (
    <div className="debt-box">
      <div className="debt-box-header"><h3>Dívidas &amp; Retroativos</h3></div>
      {rows.map(row => (
        <div key={row.id} className={`table-row${!row.active ? ' inactive' : ''}`}>
          <span className="col-name">
            <input className="inline-edit-field" value={row.name} onChange={e => update(row.id, 'name', e.target.value)} />
          </span>
          <span className="col-desc">
            <input className="inline-edit-field" value={row.desc || ''} onChange={e => update(row.id, 'desc', e.target.value)} />
          </span>
          <span className="col-value">
            <EditableValue value={row.value} onChange={v => update(row.id, 'value', v)} />
          </span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', width: 80, justifyContent: 'center' }}>
            <label className="toggle">
              <input type="checkbox" checked={row.active} onChange={() => toggle(row.id)} />
              <span className="toggle-slider" />
            </label>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 14 }} onClick={() => remove(row.id)}>×</button>
          </span>
        </div>
      ))}
      <button className="add-row-btn" onClick={addRow}>+ Adicionar dívida</button>
      <div className="table-subtotal">
        <span className="sub-label" style={{ color: 'var(--bordo)' }}>Subtotal Dívidas</span>
        <span className="sub-value" style={{ color: 'var(--bordo)' }}>{fmtBRL(total)}</span>
      </div>
    </div>
  );
}

function EditableValue({ value, onChange }) {
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

function StaircaseEditor({ staircase, onChange }) {
  const update = (id, field, val) => onChange(staircase.map(s => s.id === id ? { ...s, [field]: val } : s));
  return (
    <div className="table-wrap">
      <div className="table-header-row">
        <span className="th" style={{ flex: 1 }}>Degrau</span>
        <span className="th" style={{ flex: 1 }}>Gatilho (R$)</span>
        <span className="th" style={{ flex: 1 }}>Variação %</span>
        <span className="th" style={{ flex: 1 }}>Líq. Estimado</span>
        <span className="th" style={{ flex: 1 }}>Gobbi (R$)</span>
        <span className="th" style={{ flex: 1 }}>Cezar (R$)</span>
        <span className="th" style={{ flex: 1 }}>Meta Principal</span>
      </div>
      {staircase.map(s => (
        <div key={s.id} className={`table-row${s.main ? ' main-row' : ''}`} style={{ background: s.main ? 'var(--azul-light)' : undefined }}>
          <span style={{ flex: 1 }}><input className="inline-edit-field" value={s.label} onChange={e => update(s.id, 'label', e.target.value)} /></span>
          <span style={{ flex: 1 }}><EditableValue value={s.threshold} onChange={v => update(s.id, 'threshold', v)} /></span>
          <span style={{ flex: 1 }}><input className="inline-edit-field" value={s.pctLabel} onChange={e => update(s.id, 'pctLabel', e.target.value)} /></span>
          <span style={{ flex: 1 }}>{s.netLiq !== '—' ? <EditableValue value={s.netLiq} onChange={v => update(s.id, 'netLiq', v)} /> : <span style={{ color: 'var(--verde)', fontSize: 12 }}>—</span>}</span>
          <span style={{ flex: 1 }}><EditableValue value={s.gobbi} onChange={v => update(s.id, 'gobbi', v)} /></span>
          <span style={{ flex: 1 }}><EditableValue value={s.cezar} onChange={v => update(s.id, 'cezar', v)} /></span>
          <span style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <label className="toggle">
              <input type="checkbox" checked={!!s.main} onChange={() => onChange(staircase.map(st => ({ ...st, main: st.id === s.id ? !st.main : false })))} />
              <span className="toggle-slider" />
            </label>
          </span>
        </div>
      ))}
    </div>
  );
}

function BonusEditor({ bonus, onChange }) {
  const update = (id, field, val) => onChange(bonus.map(b => b.id === id ? { ...b, [field]: val } : b));
  return (
    <div className="table-wrap">
      <div className="table-header-row">
        <span className="th" style={{ flex: 1 }}>Degrau</span>
        <span className="th" style={{ flex: 1 }}>% da Meta</span>
        <span className="th" style={{ flex: 1 }}>Volume (R$)</span>
        <span className="th" style={{ flex: 2 }}>Bônus</span>
      </div>
      {bonus.map(b => (
        <div key={b.id} className="table-row">
          <span style={{ flex: 1 }}><input className="inline-edit-field" value={b.label} onChange={e => update(b.id, 'label', e.target.value)} /></span>
          <span style={{ flex: 1 }}><EditableValue value={b.pct} onChange={v => update(b.id, 'pct', v)} /></span>
          <span style={{ flex: 1 }}><EditableValue value={b.metaValue} onChange={v => update(b.id, 'metaValue', v)} /></span>
          <span style={{ flex: 2 }}><input className="inline-edit-field" value={b.bonus} onChange={e => update(b.id, 'bonus', e.target.value)} /></span>
        </div>
      ))}
    </div>
  );
}

export default function Tab2Editable() {
  const [data, setData] = useState(() => loadScenarioB());
  const [staircase, setStaircase] = useState(() => loadStaircase());
  const [bonus, setBonus] = useState(() => loadBonus());
  const [showReset, setShowReset] = useState(false);
  const debounceRef = useRef();

  const persist = useCallback((d, sc, bn) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveScenarioB(d);
      saveStaircase(sc);
      saveBonus(bn);
    }, 500);
  }, []);

  const updateData = (key, val) => {
    const next = { ...data, [key]: val };
    setData(next);
    persist(next, staircase, bonus);
  };

  const updateStair = (val) => { setStaircase(val); persist(data, val, bonus); };
  const updateBonus = (val) => { setBonus(val); persist(data, staircase, val); };

  const handleReset = () => {
    resetScenarioB();
    setData(INITIAL_DATA.scenarioB);
    setStaircase(INITIAL_DATA.staircase);
    setBonus(INITIAL_DATA.bonus);
    setShowReset(false);
  };

  const totalB = sumActive(data.pessoal) + sumActive(data.dividas) + sumActive(data.escritorio) + sumActive(data.taxas);

  return (
    <div>
      {showReset && <ResetModal onConfirm={handleReset} onCancel={() => setShowReset(false)} />}

      <div className="reset-btn-wrapper">
        <button className="btn btn-danger" onClick={() => setShowReset(true)}>↺ Reset</button>
      </div>

      <div className="page-header">
        <h1>Reestruturação Financeira 2026</h1>
        <p>Clique em qualquer valor ou texto para editar. Salvo automaticamente.</p>
        <div className="vigencia-tag">Vigência: 01/08/2026</div>
      </div>

      <div className="section">
        <div className="section-title">Pessoal &amp; Gestão — Cenário B</div>
        <EditableTable rows={data.pessoal} onChange={v => updateData('pessoal', v)} subtotalLabel="Subtotal Pessoal" />

        <div className="section-title mt-16">Dívidas &amp; Retroativos</div>
        <EditableDebtBox rows={data.dividas} onChange={v => updateData('dividas', v)} />

        <div className="section-title mt-16">Escritório &amp; Infraestrutura</div>
        <EditableTable rows={data.escritorio} onChange={v => updateData('escritorio', v)} subtotalLabel="Subtotal Escritório" />

        <div className="section-title mt-16">Taxas, Impostos &amp; Administrativo</div>
        <EditableTable rows={data.taxas} onChange={v => updateData('taxas', v)} subtotalLabel="Subtotal Taxas" />

        <div className="total-bar">
          <span className="tb-label">Total Cenário B</span>
          <span className="tb-value">{fmtBRL(totalB)}</span>
        </div>
      </div>

      <div className="divider" />

      <div className="section">
        <div className="section-title">Escada de Remuneração de Gestão</div>
        <StaircaseEditor staircase={staircase} onChange={updateStair} />
        <div className="trigger-alert mt-8">
          <p>⚠ Gatilho: Se cliente High Tide for perdido → repactuação obrigatória.</p>
        </div>
      </div>

      <div className="divider" />

      <div className="section">
        <div className="section-title">Bônus de Final de Ano</div>
        <BonusEditor bonus={bonus} onChange={updateBonus} />
      </div>
    </div>
  );
}
