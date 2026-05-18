import { useState, useRef, useCallback } from 'react';
import { loadMetas, saveMetas, loadStaircase, loadBonus } from '../utils/storage';
import { fmtBRL, uid, getStairLevel } from '../utils/formatters';

// ── Cálculo do lucro líquido de uma venda ──────────────────────────────────
function calcNetProfit(sale) {
  const bruto = parseFloat(sale.value) || 0;
  const custo = parseFloat(sale.cost) || 0;
  const taxAmt = sale.taxType === '%'
    ? bruto * ((parseFloat(sale.tax) || 0) / 100)
    : (parseFloat(sale.tax) || 0);
  const commAmt = sale.commType === '%'
    ? bruto * ((parseFloat(sale.commission) || 0) / 100)
    : (parseFloat(sale.commission) || 0);
  return bruto - custo - taxAmt - commAmt;
}

// ── Formulário inline de nova venda ───────────────────────────────────────
function SaleForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '', value: '', cost: '',
    taxType: '%', tax: '',
    commType: '%', commission: '',
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const bruto = parseFloat(form.value) || 0;
  const custo = parseFloat(form.cost) || 0;
  const taxAmt = form.taxType === '%'
    ? bruto * ((parseFloat(form.tax) || 0) / 100)
    : (parseFloat(form.tax) || 0);
  const commAmt = form.commType === '%'
    ? bruto * ((parseFloat(form.commission) || 0) / 100)
    : (parseFloat(form.commission) || 0);
  const netProfit = bruto - custo - taxAmt - commAmt;
  const margin = bruto > 0 ? (netProfit / bruto) * 100 : 0;

  const handleSave = () => {
    if (!form.name || bruto === 0) return;
    onSave({
      id: uid(),
      name: form.name,
      value: bruto,
      cost: custo,
      taxType: form.taxType,
      tax: parseFloat(form.tax) || 0,
      commType: form.commType,
      commission: parseFloat(form.commission) || 0,
    });
  };

  return (
    <div className="sale-form">
      <div className="sale-form-title">Nova Venda</div>

      <div className="sale-form-grid">
        <div className="sf-group sf-full">
          <label>Nome da receita</label>
          <input
            type="text"
            placeholder="Ex: Job Sanepar — Vídeo Institucional"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            autoFocus
          />
        </div>

        <div className="sf-group">
          <label>Valor bruto da venda</label>
          <input
            type="number"
            placeholder="0,00"
            value={form.value}
            onChange={e => set('value', e.target.value)}
          />
        </div>

        <div className="sf-group">
          <label>Custo do projeto</label>
          <input
            type="number"
            placeholder="0,00"
            value={form.cost}
            onChange={e => set('cost', e.target.value)}
          />
        </div>

        <div className="sf-group">
          <label>Imposto</label>
          <div className="sf-input-with-toggle">
            <input
              type="number"
              placeholder="0"
              value={form.tax}
              onChange={e => set('tax', e.target.value)}
            />
            <div className="sf-type-toggle">
              <button
                className={form.taxType === '%' ? 'active' : ''}
                onClick={() => set('taxType', '%')}
              >%</button>
              <button
                className={form.taxType === 'R$' ? 'active' : ''}
                onClick={() => set('taxType', 'R$')}
              >R$</button>
            </div>
          </div>
          {form.tax > 0 && (
            <span className="sf-calc-hint">= {fmtBRL(taxAmt)}</span>
          )}
        </div>

        <div className="sf-group">
          <label>Comissão comercial</label>
          <div className="sf-input-with-toggle">
            <input
              type="number"
              placeholder="0"
              value={form.commission}
              onChange={e => set('commission', e.target.value)}
            />
            <div className="sf-type-toggle">
              <button
                className={form.commType === '%' ? 'active' : ''}
                onClick={() => set('commType', '%')}
              >%</button>
              <button
                className={form.commType === 'R$' ? 'active' : ''}
                onClick={() => set('commType', 'R$')}
              >R$</button>
            </div>
          </div>
          {form.commission > 0 && (
            <span className="sf-calc-hint">= {fmtBRL(commAmt)}</span>
          )}
        </div>
      </div>

      {/* Preview do lucro líquido */}
      {bruto > 0 && (
        <div className="sale-form-preview">
          <div className="sfp-row">
            <span>Bruto</span>
            <span className="sfp-val">{fmtBRL(bruto)}</span>
          </div>
          <div className="sfp-row">
            <span>− Custo</span>
            <span className="sfp-val text-bordo">−{fmtBRL(custo)}</span>
          </div>
          <div className="sfp-row">
            <span>− Imposto</span>
            <span className="sfp-val text-bordo">−{fmtBRL(taxAmt)}</span>
          </div>
          <div className="sfp-row">
            <span>− Comissão</span>
            <span className="sfp-val text-bordo">−{fmtBRL(commAmt)}</span>
          </div>
          <div className="sfp-divider" />
          <div className="sfp-row sfp-total">
            <span>Lucro Líquido</span>
            <span className={`sfp-val ${netProfit >= 0 ? 'text-azul' : 'text-bordo'}`}>
              {fmtBRL(netProfit)}
              <span className="sfp-margin">({margin.toFixed(1)}%)</span>
            </span>
          </div>
        </div>
      )}

      <div className="sale-form-actions">
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancelar</button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={!form.name || bruto === 0}
        >
          Salvar venda
        </button>
      </div>
    </div>
  );
}

// ── Barra de progresso ─────────────────────────────────────────────────────
function ProgressBar({ pct }) {
  const capped = Math.min(pct, 150);
  const cls = pct >= 100 ? 'progress-over' : pct >= 50 ? 'progress-ok' : 'progress-under';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--verde)', marginBottom: 4 }}>
        <span>0%</span>
        <span style={{ fontWeight: 800, color: pct >= 100 ? 'var(--verde)' : pct >= 50 ? 'var(--azul)' : 'var(--bordo)' }}>
          {pct.toFixed(1)}%
        </span>
        <span>100%</span>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill ${cls}`} style={{ width: `${(capped / 150) * 100}%` }} />
      </div>
    </div>
  );
}

// ── Inline value editor ────────────────────────────────────────────────────
function InlineValue({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');
  const ref = useRef();
  const start = () => { setRaw(String(value)); setEditing(true); setTimeout(() => ref.current?.select(), 10); };
  const commit = () => { const n = parseFloat(raw.replace(',', '.')); if (!isNaN(n)) onChange(n); setEditing(false); };
  if (editing) return (
    <input ref={ref} className="inline-edit-field value-field" value={raw}
      onChange={e => setRaw(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      style={{ display: 'inline-block', width: 120 }} />
  );
  return (
    <span onClick={start} style={{ cursor: 'pointer', fontWeight: 800 }} title="Clique para editar">
      {fmtBRL(value)}
    </span>
  );
}

// ── Painel financeiro do mês ───────────────────────────────────────────────
function MonthFinancePanel({ sales }) {
  const brutoTotal = sales.reduce((a, s) => a + (parseFloat(s.value) || 0), 0);
  const custoTotal = sales.reduce((a, s) => a + (parseFloat(s.cost) || 0), 0);
  const taxTotal = sales.reduce((a, s) => {
    const b = parseFloat(s.value) || 0;
    return a + (s.taxType === '%' ? b * ((parseFloat(s.tax) || 0) / 100) : (parseFloat(s.tax) || 0));
  }, 0);
  const commTotal = sales.reduce((a, s) => {
    const b = parseFloat(s.value) || 0;
    return a + (s.commType === '%' ? b * ((parseFloat(s.commission) || 0) / 100) : (parseFloat(s.commission) || 0));
  }, 0);
  const netTotal = sales.reduce((a, s) => a + calcNetProfit(s), 0);
  const margin = brutoTotal > 0 ? (netTotal / brutoTotal) * 100 : 0;

  if (sales.length === 0) return null;

  return (
    <div className="month-finance-panel">
      <div className="mfp-title">Resultado do Mês</div>
      <div className="mfp-row">
        <span>Total bruto</span>
        <span className="mfp-val">{fmtBRL(brutoTotal)}</span>
      </div>
      <div className="mfp-row mfp-sub">
        <span>− Custo</span>
        <span className="mfp-val text-bordo">−{fmtBRL(custoTotal)}</span>
      </div>
      <div className="mfp-row mfp-sub">
        <span>− Impostos</span>
        <span className="mfp-val text-bordo">−{fmtBRL(taxTotal)}</span>
      </div>
      <div className="mfp-row mfp-sub">
        <span>− Comissões</span>
        <span className="mfp-val text-bordo">−{fmtBRL(commTotal)}</span>
      </div>
      <div className="mfp-divider" />
      <div className="mfp-row mfp-net">
        <span>Lucro Líquido</span>
        <span className={`mfp-val ${netTotal >= 0 ? 'text-azul' : 'text-bordo'}`}>
          {fmtBRL(netTotal)}
        </span>
      </div>
      <div className={`mfp-margin-badge ${margin >= 30 ? 'badge-ok' : margin >= 15 ? 'badge-mid' : 'badge-low'}`}>
        {margin.toFixed(1)}% de margem líquida
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export default function Tab6Metas() {
  const [months, setMonths] = useState(() => loadMetas());
  const [addingTo, setAddingTo] = useState(null); // monthId onde o form está aberto
  const debounceRef = useRef();
  const staircase = loadStaircase();
  const bonusLevels = loadBonus();

  const persist = useCallback((data) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveMetas(data), 500);
  }, []);

  const updateMonth = (id, field, val) => {
    const next = months.map(m => m.id === id ? { ...m, [field]: val } : m);
    setMonths(next); persist(next);
  };

  const saveSale = (monthId, sale) => {
    const next = months.map(m => m.id !== monthId ? m : {
      ...m, sales: [...(m.sales || []), sale]
    });
    setMonths(next); persist(next);
    setAddingTo(null);
  };

  const updateSale = (monthId, saleId, field, val) => {
    const next = months.map(m => m.id !== monthId ? m : {
      ...m,
      sales: m.sales.map(s => s.id === saleId ? { ...s, [field]: val } : s)
    });
    setMonths(next); persist(next);
  };

  const removeSale = (monthId, saleId) => {
    const next = months.map(m => m.id !== monthId ? m : {
      ...m, sales: m.sales.filter(s => s.id !== saleId)
    });
    setMonths(next); persist(next);
  };

  // ── Totais do painel de resumo ─────────────────────────────────────────
  const totalMeta = months.reduce((a, m) => a + (parseFloat(m.meta) || 0), 0);
  const totalBruto = months.reduce((a, m) =>
    a + (m.sales || []).reduce((b, s) => b + (parseFloat(s.value) || 0), 0), 0);
  const totalLiquido = months.reduce((a, m) =>
    a + (m.sales || []).reduce((b, s) => b + calcNetProfit(s), 0), 0);
  const pctAtingido = totalMeta > 0 ? (totalBruto / totalMeta) * 100 : 0;
  const margemGeral = totalBruto > 0 ? (totalLiquido / totalBruto) * 100 : 0;

  const monthsWithData = months.filter(m => (m.sales || []).length > 0);
  const avgMonthly = monthsWithData.length > 0 ? totalBruto / monthsWithData.length : 0;
  const projection = avgMonthly * 12;
  const avgStair = monthsWithData.length > 0 ? getStairLevel(avgMonthly, staircase) : staircase[0];

  let bonusEligibility = null;
  for (let i = bonusLevels.length - 1; i >= 0; i--) {
    if (totalBruto >= (bonusLevels[i].metaValue * (bonusLevels[i].pct / 100))) {
      bonusEligibility = bonusLevels[i];
      break;
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Metas de Novas Vendas</h1>
        <p>Acompanhe e registre as vendas mensais de Ago/26 a Jul/27.</p>
      </div>

      {/* ── Painel de resumo ── */}
      <div className="goals-summary">
        <div className="gs-item">
          <div className="gs-label">Meta Anual</div>
          <div className="gs-value">{fmtBRL(totalMeta)}</div>
        </div>
        <div className="gs-item">
          <div className="gs-label">Total Bruto</div>
          <div className="gs-value">{fmtBRL(totalBruto)}</div>
          <div className="gs-sub">{pctAtingido.toFixed(1)}% da meta</div>
        </div>
        <div className="gs-item">
          <div className="gs-label">Lucro Líquido Total</div>
          <div className="gs-value" style={{ color: totalLiquido >= 0 ? '#b8ff80' : '#ff8080' }}>
            {fmtBRL(totalLiquido)}
          </div>
          <div className="gs-sub">{margemGeral.toFixed(1)}% de margem</div>
        </div>
        <div className="gs-item">
          <div className="gs-label">Degrau Médio</div>
          <div className="gs-value" style={{ fontSize: 15 }}>{avgStair.label}</div>
          <div className="gs-sub">{fmtBRL(avgMonthly)}/mês médio</div>
        </div>
        <div className="gs-item">
          <div className="gs-label">Projeção Anual</div>
          <div className="gs-value">{fmtBRL(projection)}</div>
        </div>
        <div className="gs-item">
          <div className="gs-label">Elegib. Bônus</div>
          {bonusEligibility ? (
            <span className={`bonus-indicator bonus-${bonusEligibility.label.toLowerCase()}`}>
              {bonusEligibility.label} — {bonusEligibility.pct}%
            </span>
          ) : (
            <span className="bonus-indicator bonus-none">Sem elegibilidade</span>
          )}
        </div>
      </div>

      {/* ── Blocos mensais ── */}
      {months.map(month => {
        const sales = month.sales || [];
        const brutoMes = sales.reduce((a, s) => a + (parseFloat(s.value) || 0), 0);
        const meta = parseFloat(month.meta) || 0;
        const delta = brutoMes - meta;
        const pct = meta > 0 ? (brutoMes / meta) * 100 : 0;
        const isAdding = addingTo === month.id;

        return (
          <div key={month.id} className="month-block">
            {/* Cabeçalho */}
            <div className="month-header">
              <h3>{month.month}</h3>
              <div className="month-meta">
                <span className="meta-label">Meta:</span>
                <span className="meta-value">
                  <InlineValue value={month.meta} onChange={v => updateMonth(month.id, 'meta', v)} />
                </span>
                <span className="meta-label">Bruto:</span>
                <span className="meta-value" style={{ color: delta >= 0 ? 'var(--azul)' : 'var(--bordo)' }}>
                  {fmtBRL(brutoMes)}
                </span>
                <span style={{ fontWeight: 800, fontSize: 13, color: delta >= 0 ? 'var(--azul)' : 'var(--bordo)' }}>
                  {delta >= 0 ? '+' : ''}{fmtBRL(delta)}
                </span>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="month-progress">
              <ProgressBar pct={pct} />
            </div>

            {/* Conteúdo: lista + painel financeiro */}
            <div className="month-body">
              {/* Lista de vendas */}
              <div className="month-sales-col">
                {sales.map(sale => {
                  const net = calcNetProfit(sale);
                  const bruto = parseFloat(sale.value) || 0;
                  const saleMargin = bruto > 0 ? (net / bruto) * 100 : 0;
                  return (
                    <div key={sale.id} className="sale-row-rich">
                      <div className="srr-main">
                        <span className="srr-name">{sale.name || '—'}</span>
                        <span className="srr-bruto">{fmtBRL(bruto)}</span>
                        <button
                          onClick={() => removeSale(month.id, sale.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: 16, lineHeight: 1, flexShrink: 0 }}
                        >×</button>
                      </div>
                      <div className="srr-detail">
                        {sale.cost > 0 && <span>Custo: {fmtBRL(sale.cost)}</span>}
                        {sale.tax > 0 && <span>Imposto: {fmtBRL(sale.taxType === '%' ? bruto * (sale.tax / 100) : sale.tax)}</span>}
                        {sale.commission > 0 && <span>Comissão: {fmtBRL(sale.commType === '%' ? bruto * (sale.commission / 100) : sale.commission)}</span>}
                        <span className={`srr-net ${net >= 0 ? 'net-ok' : 'net-bad'}`}>
                          Líquido: {fmtBRL(net)} ({saleMargin.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Formulário inline */}
                {isAdding ? (
                  <SaleForm
                    onSave={sale => saveSale(month.id, sale)}
                    onCancel={() => setAddingTo(null)}
                  />
                ) : (
                  <button className="add-row-btn" onClick={() => setAddingTo(month.id)}>
                    + Adicionar venda
                  </button>
                )}
              </div>

              {/* Painel financeiro */}
              <MonthFinancePanel sales={sales} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
