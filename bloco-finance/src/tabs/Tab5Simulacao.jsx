import { useState } from 'react';
import { loadScenarioB, loadStaircase } from '../utils/storage';
import { fmtBRL, sumActive, getStairLevel } from '../utils/formatters';

const STAIR_BADGE_CLASS = {
  'Piso': 'stair-piso',
  'D1 +25%': 'stair-d1',
  'D2 +50%': 'stair-d2',
  'D3 +75%': 'stair-d3',
  'D4 +100%': 'stair-d4',
};

function getBadgeClass(label) {
  for (const key in STAIR_BADGE_CLASS) {
    if (label && label.startsWith(key.split(' ')[0])) return STAIR_BADGE_CLASS[key];
  }
  return 'stair-piso';
}

export default function Tab5Simulacao() {
  const [mrr, setMrr] = useState('');
  const [newSales, setNewSales] = useState('');

  const scenarioB = loadScenarioB();
  const staircase = loadStaircase();

  const mrrVal = parseFloat(mrr.replace(/\./g, '').replace(',', '.')) || 0;
  const salesVal = parseFloat(newSales.replace(/\./g, '').replace(',', '.')) || 0;

  const prodCost = salesVal * 0.7;
  const salesMargin = salesVal * 0.3;
  const totalAvailable = mrrVal + salesMargin;

  const stairLevel = getStairLevel(salesVal, staircase);

  // Base fixed costs (Cenário B without management variable part)
  const escritorio = sumActive(scenarioB.escritorio);
  const dividas = sumActive(scenarioB.dividas);
  const taxas = sumActive(scenarioB.taxas);

  // Fixed staff without the Gestão rows
  const staffFixed = scenarioB.pessoal
    .filter(p => p.active && p.type !== 'Gestão')
    .reduce((a, p) => a + parseFloat(p.value || 0), 0);

  const mgmtCost = (stairLevel.gobbi || 0) + (stairLevel.cezar || 0);
  const totalFixed = escritorio + dividas + taxas + staffFixed + mgmtCost;

  const surplus = totalAvailable - totalFixed;
  const minReserve = totalAvailable * 0.2;
  const investable = surplus - minReserve;

  const hasInput = mrrVal > 0 || salesVal > 0;

  return (
    <div>
      <div className="page-header">
        <h1>Simulação Mensal</h1>
        <p>Insira os valores do mês para calcular o resultado financeiro automaticamente.</p>
      </div>

      <div className="simulator-form">
        <div className="sim-form-grid">
          <div className="form-group">
            <label>MRR — Receita Recorrente (R$)</label>
            <input
              type="text"
              placeholder="Ex: 80000"
              value={mrr}
              onChange={e => setMrr(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Novas Vendas Brutas (R$)</label>
            <input
              type="text"
              placeholder="Ex: 30000"
              value={newSales}
              onChange={e => setNewSales(e.target.value)}
            />
          </div>
        </div>

        {hasInput && (
          <div className="sim-results">
            <div className="sim-card">
              <div className="sc-label">Custo de Produção</div>
              <div className="sc-value">{fmtBRL(prodCost)}</div>
              <div className="sc-sub">70% das novas vendas</div>
            </div>
            <div className="sim-card">
              <div className="sc-label">Margem Novas Vendas</div>
              <div className="sc-value">{fmtBRL(salesMargin)}</div>
              <div className="sc-sub">30% das novas vendas</div>
            </div>
            <div className="sim-card highlight" style={{ border: '1px solid var(--azul)', borderLeft: '4px solid var(--azul)', background: 'var(--azul-light)' }}>
              <div className="sc-label">Receita Líquida Disponível</div>
              <div className="sc-value">{fmtBRL(totalAvailable)}</div>
              <div className="sc-sub">MRR + margem de novas vendas</div>
            </div>
          </div>
        )}
      </div>

      {hasInput && (
        <>
          <div className="section-title">Degrau Ativo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span className={`stair-badge ${getBadgeClass(stairLevel.label)}`}>
              {stairLevel.label}
            </span>
            <span style={{ fontSize: 13, color: 'var(--verde)' }}>
              Gatilho: novas vendas ≥ {fmtBRL(stairLevel.threshold)} — Gobbi {fmtBRL(stairLevel.gobbi)} | Cezar {fmtBRL(stairLevel.cezar)}
            </span>
          </div>

          <div className="sim-results" style={{ marginBottom: 24 }}>
            <div className="sim-card">
              <div className="sc-label">Custo Total do Mês</div>
              <div className="sc-value">{fmtBRL(totalFixed)}</div>
              <div className="sc-sub">Fixo base + gestão do degrau</div>
            </div>
            <div className={`sim-card${surplus < 0 ? ' negative' : ' positive'}`}>
              <div className="sc-label">Sobra do Mês</div>
              <div className="sc-value">{fmtBRL(surplus)}</div>
              <div className="sc-sub">Receita disponível − custo total</div>
            </div>
            <div className="sim-card">
              <div className="sc-label">Reserva Mínima (20%)</div>
              <div className="sc-value">{fmtBRL(minReserve)}</div>
              <div className="sc-sub">20% da receita disponível</div>
            </div>
            <div className={`sim-card${investable < 0 ? ' negative' : ' positive'}`}
              style={investable >= 0 ? { border: '1px solid var(--verde)', borderLeft: '4px solid var(--verde)' } : {}}>
              <div className="sc-label">Disponível para Investimento</div>
              <div className="sc-value">{fmtBRL(Math.max(0, investable))}</div>
              <div className="sc-sub">Sobra − reserva mínima</div>
            </div>
          </div>

          {surplus < 0 && (
            <div className="trigger-alert" style={{ marginBottom: 20 }}>
              <p>⚠ Atenção: resultado negativo de {fmtBRL(Math.abs(surplus))}. A receita disponível não cobre os custos fixos do mês.</p>
            </div>
          )}

          {surplus >= 0 && (
            <div style={{ background: 'var(--azul-light)', border: '1px solid var(--azul-mid)', borderLeft: '4px solid var(--azul)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: 'var(--azul)', fontWeight: 800 }}>
                ✓ Mês viável com sobra de {fmtBRL(surplus)} após custos fixos.
              </p>
            </div>
          )}

          <div className="section-title">Breakdown Detalhado — Custos do Mês</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
            <CostBreakdown title="Pessoal — Fixo" items={scenarioB.pessoal.filter(p => p.type !== 'Gestão')} />
            <CostBreakdown title={`Gestão (${stairLevel.label})`} items={[
              { id: 'g1', name: 'Gobbi — Gestão', value: stairLevel.gobbi, active: true },
              { id: 'g2', name: 'Cezar — Gestão', value: stairLevel.cezar, active: true },
            ]} highlight />
            <CostBreakdown title="Escritório & Infraestrutura" items={scenarioB.escritorio} />
            <CostBreakdown title="Dívidas & Retroativos" items={scenarioB.dividas} />
            <CostBreakdown title="Taxas & Administrativo" items={scenarioB.taxas} />
          </div>

          <p style={{ fontSize: 12, color: 'var(--verde)', fontStyle: 'italic' }}>
            Este simulador usa os dados base do Cenário B. Valores editados na Aba 2 são refletidos aqui automaticamente.
          </p>
        </>
      )}
    </div>
  );
}

function CostBreakdown({ title, items, highlight }) {
  const total = sumActive(items);
  return (
    <div style={{
      background: 'var(--white)', border: `1px solid ${highlight ? 'var(--azul)' : 'rgba(13,13,13,0.08)'}`,
      borderLeft: highlight ? '4px solid var(--azul)' : undefined,
      borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)'
    }}>
      <div style={{ padding: '10px 14px', background: highlight ? 'var(--azul-light)' : 'rgba(13,13,13,0.03)', borderBottom: '1px solid rgba(13,13,13,0.06)' }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: highlight ? 'var(--azul)' : 'var(--verde)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
      </div>
      {items.filter(i => i.active).map(item => (
        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 14px', borderBottom: '1px solid rgba(13,13,13,0.04)', fontSize: 12 }}>
          <span style={{ color: 'var(--preto)' }}>{item.name || item.desc}</span>
          <span style={{ fontFamily: 'PPTelegraf, sans-serif', fontWeight: 800 }}>{fmtBRL(item.value)}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', background: 'rgba(13,13,13,0.02)' }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--verde)' }}>Subtotal</span>
        <span style={{ fontFamily: 'PPTelegraf, sans-serif', fontSize: 13, fontWeight: 800 }}>{fmtBRL(total)}</span>
      </div>
    </div>
  );
}
