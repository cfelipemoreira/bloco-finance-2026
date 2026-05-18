import { INITIAL_DATA } from '../data/initialData';
import ReadOnlyTable from '../components/ReadOnlyTable';
import DebtBox from '../components/DebtBox';
import { fmtBRL, sumActive } from '../utils/formatters';

const A = INITIAL_DATA.scenarioA;
const B = INITIAL_DATA.scenarioB;
const STAIR = INITIAL_DATA.staircase;
const BONUS = INITIAL_DATA.bonus;

function totalScenario(sc) {
  return sumActive(sc.pessoal) + sumActive(sc.dividas) + sumActive(sc.escritorio) + sumActive(sc.taxas);
}

const totalA = totalScenario(A);
const totalB = totalScenario(B);

const CONCEPT_CARDS_A = [
  { label: 'Pessoal & Gestão', value: sumActive(A.pessoal), sub: 'Time operacional, posições, distribuição de lucros, retroativos' },
  { label: 'Escritório & Infraestrutura', value: sumActive(A.escritorio), sub: 'Aluguel, condomínio, energia, internet, limpeza, seguro, IPTU' },
  { label: 'Dívidas & Retroativos', value: sumActive(A.dividas), sub: 'Parcelas de obrigações passadas (Nex e Patching Plants)' },
  { label: 'Equipamentos & Produção', value: 3000, sub: 'Locação mensal de equipamentos audiovisuais' },
  { label: 'Taxas, Impostos & Admin', value: sumActive(A.taxas), sub: 'Cartão, verba de produção, imposto, contador, bancárias' },
];

const CHANGES = [
  { name: 'Matheus de Lima Gobbi — Gestão', from: 8000, to: 4000 },
  { name: 'Cezar Felipe Moreira — Gestão', from: 6500, to: 4000 },
  { name: 'Cezar Felipe Moreira — Consultor Projeto', from: 3000, to: 0, removed: true },
  { name: 'Patching Plants — Locação de Equipamentos', from: 3000, to: 1500 },
];

const IMPACTS = [
  { name: 'Matheus de Lima Gobbi', from: 8000, to: 4000 },
  { name: 'Cezar Felipe Moreira', from: 9500, to: 4000 },
  { name: 'Patching Plants', from: 3000, to: 1500 },
];

const GOALS_MONTHS = INITIAL_DATA.monthlyGoals.map((m, i) => ({
  ...m,
  metaAcum: (i + 1) * 30000,
}));

function FlowTable({ mrr, sales30pct, fixedCost, mgmtBonus, label }) {
  const monthlyRecv = mrr + sales30pct;
  const monthly = monthlyRecv - fixedCost;
  let acum = 0;
  const rows = GOALS_MONTHS.map((m, i) => {
    const isBonusMonth = i === 11;
    const bonus = isBonusMonth ? mgmtBonus : 0;
    const net = monthly - bonus;
    acum += net;
    return { month: m.month, recv: monthlyRecv, fixed: fixedCost, bonus, net, acum };
  });
  return (
    <table className="flow-table">
      <thead>
        <tr>
          <th>Mês</th>
          <th>Receita</th>
          <th>Custo Fixo</th>
          <th>Bônus</th>
          <th>Resultado</th>
          <th>Acumulado</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.month}>
            <td>{r.month}</td>
            <td className="flow-positive">{fmtBRL(r.recv)}</td>
            <td className="flow-negative">−{fmtBRL(r.fixed)}</td>
            <td className={r.bonus ? 'flow-negative' : ''}>{r.bonus ? `−${fmtBRL(r.bonus)}` : '—'}</td>
            <td className={r.net >= 0 ? 'flow-positive' : 'flow-negative'}>{fmtBRL(r.net)}</td>
            <td className={r.acum >= 0 ? 'flow-positive' : 'flow-negative'}>{fmtBRL(r.acum)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Tab1Readonly() {
  const pessoalBTotal = sumActive(B.pessoal);
  const escritorioBTotal = sumActive(B.escritorio);
  const dividasBTotal = sumActive(B.dividas);
  const taxasBTotal = sumActive(B.taxas);

  return (
    <div>
      <div className="page-header">
        <h1>Reestruturação Financeira 2026</h1>
        <p>Elaborado por Felipe Moreira — Sócio-Fundador e Gestor, BLOCO.</p>
        <span className="readonly-badge">Somente leitura</span>
      </div>

      {/* ══ CENÁRIO A ══ */}
      <div className="section">
        <div className="section-title">Cenário A — Contas Provisionadas Fixas</div>

        <div className="concept-cards">
          {CONCEPT_CARDS_A.map(c => (
            <div key={c.label} className="concept-card">
              <div className="cc-label">{c.label}</div>
              <div className="cc-value">{fmtBRL(c.value)}</div>
              <div className="cc-sub">{c.sub}</div>
            </div>
          ))}
          <div className="concept-card total-card">
            <div className="cc-label">Total</div>
            <div className="cc-value">{fmtBRL(totalA)}</div>
            <div className="cc-sub">Cenário A completo</div>
          </div>
        </div>

        <div className="section-title mt-16">Pessoal &amp; Gestão</div>
        <ReadOnlyTable rows={A.pessoal} subtotalLabel="Subtotal Pessoal" />

        <div className="section-title mt-16">Dívidas &amp; Retroativos</div>
        <DebtBox rows={A.dividas} />

        <div className="section-title mt-16">Escritório &amp; Infraestrutura</div>
        <ReadOnlyTable rows={A.escritorio} subtotalLabel="Subtotal Escritório" />

        <div className="section-title mt-16">Taxas, Impostos &amp; Administrativo</div>
        <ReadOnlyTable rows={A.taxas} subtotalLabel="Subtotal Taxas" />

        <div className="total-bar">
          <span className="tb-label">Total Cenário A</span>
          <span className="tb-value">{fmtBRL(totalA)}</span>
        </div>
      </div>

      <div className="divider" />

      {/* ══ CENÁRIO B ══ */}
      <div className="section">
        <div className="section-title">Cenário B — Ajustes aprovados (vigência 01/08/2026)</div>
        <div className="vigencia-tag">Vigência: 01/08/2026</div>

        <div className="changes-box">
          <h3>Mudanças aprovadas</h3>
          {CHANGES.map(c => (
            <div key={c.name} className="change-row">
              <span className="change-name">{c.name}</span>
              <span className="change-from">{fmtBRL(c.from)}</span>
              <span className="change-arrow">→</span>
              {c.removed
                ? <span className="change-removed">REMOVIDO</span>
                : <span className="change-to">{fmtBRL(c.to)}</span>}
              {!c.removed && <span className="change-delta">−{fmtBRL(c.from - c.to)}</span>}
            </div>
          ))}
        </div>

        <div className="metric-cards">
          <div className="metric-card highlight">
            <div className="mc-label">Total Ajustado</div>
            <div className="mc-value">{fmtBRL(totalB)}</div>
          </div>
          <div className="metric-card">
            <div className="mc-label">Pessoal</div>
            <div className="mc-value">{fmtBRL(pessoalBTotal)}</div>
          </div>
          <div className="metric-card">
            <div className="mc-label">Fixos (escritório + taxas)</div>
            <div className="mc-value">{fmtBRL(escritorioBTotal + taxasBTotal + dividasBTotal)}</div>
          </div>
          <div className="metric-card economy">
            <div className="mc-label">Economia vs Cenário A</div>
            <div className="mc-value text-bordo">−{fmtBRL(totalA - totalB)}</div>
            <div className="mc-sub">−{(((totalA - totalB) / totalA) * 100).toFixed(1)}%</div>
          </div>
        </div>

        <div className="section-title mt-16">Pessoal &amp; Gestão — Cenário B</div>
        <ReadOnlyTable rows={B.pessoal} subtotalLabel="Subtotal Pessoal B" />

        <div className="section-title mt-16">Dívidas &amp; Retroativos</div>
        <DebtBox rows={B.dividas} />

        <div className="section-title mt-16">Escritório &amp; Infraestrutura — Cenário B</div>
        <ReadOnlyTable rows={B.escritorio} subtotalLabel="Subtotal Escritório B" />

        <div className="section-title mt-16">Taxas, Impostos &amp; Administrativo — Cenário B</div>
        <ReadOnlyTable rows={B.taxas} subtotalLabel="Subtotal Taxas B" />

        <div className="total-bar">
          <span className="tb-label">Total Cenário B</span>
          <span className="tb-value">{fmtBRL(totalB)}</span>
        </div>

        {/* Impact bars */}
        <div className="section-title mt-16">Impacto por Pessoa</div>
        <div className="impact-list">
          {IMPACTS.map(p => {
            const delta = p.from - p.to;
            const pct = ((delta / p.from) * 100).toFixed(1);
            const barPct = (p.to / p.from) * 100;
            return (
              <div key={p.name} className="impact-row">
                <div className="impact-row-top">
                  <span className="impact-name">{p.name}</span>
                  <span className="impact-values">
                    <span className="impact-from">{fmtBRL(p.from)}</span>
                    <span>→</span>
                    <span className="impact-to">{fmtBRL(p.to)}</span>
                    <span className="impact-delta">−{fmtBRL(delta)}</span>
                    <span className="impact-pct">−{pct}%</span>
                  </span>
                </div>
                <div className="impact-bar-bg">
                  <div className="impact-bar-fill" style={{ width: `${barPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="divider" />

      {/* ══ ESCADA ══ */}
      <div className="section">
        <div className="section-title">Escada de Remuneração de Gestão</div>

        <div className="formula-box">
          <p>Fórmula de precificação: <code>Custo ÷ (1 − 0,45) ÷ (1 − 0,06) = preço final</code></p>
          <p style={{ marginTop: 6, fontSize: 12, color: 'var(--verde)' }}>Exemplo: R$ 1.000 → {fmtBRL(1000 / (1 - 0.45) / (1 - 0.06))}</p>
        </div>

        <table className="stair-table">
          <thead>
            <tr>
              <th>Degrau</th>
              <th>Gatilho (Novas Vendas)</th>
              <th>Variação</th>
              <th>Líquido Estimado</th>
              <th>Gobbi</th>
              <th>Cezar</th>
            </tr>
          </thead>
          <tbody>
            {STAIR.map(s => (
              <tr key={s.id} className={s.main ? 'main-row' : ''}>
                <td className="mono">{s.label}{s.main && <span className="meta-star">★ META</span>}</td>
                <td className="mono">{s.threshold === 0 ? 'Abaixo de R$ 20k' : `≥ ${fmtBRL(s.threshold)}`}</td>
                <td className="mono">{s.pctLabel}</td>
                <td className="mono">{s.netLiq !== '—' ? fmtBRL(s.netLiq) : '—'}</td>
                <td className="mono">{fmtBRL(s.gobbi)}</td>
                <td className="mono">{fmtBRL(s.cezar)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="trigger-alert">
          <p>⚠ Gatilho: Se cliente High Tide for perdido → repactuação obrigatória da escada de remuneração.</p>
        </div>
      </div>

      <div className="divider" />

      {/* ══ METAS ══ */}
      <div className="section">
        <div className="section-title">Quadro de Metas — Novas Vendas (Ago/26 a Jul/27)</div>
        <div className="metric-cards">
          <div className="metric-card highlight">
            <div className="mc-label">Meta Mensal</div>
            <div className="mc-value">{fmtBRL(30000)}</div>
          </div>
          <div className="metric-card">
            <div className="mc-label">Período</div>
            <div className="mc-value" style={{ fontSize: 15 }}>12 meses</div>
            <div className="mc-sub">Ago/26 — Jul/27</div>
          </div>
          <div className="metric-card">
            <div className="mc-label">Meta Total Anual</div>
            <div className="mc-value">{fmtBRL(360000)}</div>
          </div>
        </div>
        <table className="goals-table">
          <thead>
            <tr>
              <th>Mês</th>
              <th>Meta</th>
              <th>Realizado</th>
              <th>Δ</th>
              <th>Acum. Meta</th>
              <th>Acum. Realiz.</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {GOALS_MONTHS.map((m, i) => (
              <tr key={m.id}>
                <td>{m.month}</td>
                <td className="mono">{fmtBRL(m.meta)}</td>
                <td className="mono" style={{ color: 'var(--verde)' }}>—</td>
                <td>—</td>
                <td className="mono">{fmtBRL(m.metaAcum)}</td>
                <td className="mono" style={{ color: 'var(--verde)' }}>—</td>
                <td><span className="status-neutral">Pendente</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divider" />

      {/* ══ BÔNUS ══ */}
      <div className="section">
        <div className="section-title">Bônus de Final de Ano</div>
        <table className="stair-table">
          <thead>
            <tr>
              <th>Degrau</th>
              <th>% da Meta</th>
              <th>Volume</th>
              <th>Bônus</th>
            </tr>
          </thead>
          <tbody>
            {BONUS.map(b => (
              <tr key={b.id}>
                <td className="mono">{b.label}</td>
                <td className="mono">{b.pct}%</td>
                <td className="mono">{fmtBRL(b.metaValue)}</td>
                <td>{b.bonus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divider" />

      {/* ══ VIABILIDADE ══ */}
      <div className="section">
        <div className="section-title">Viabilidade do Modelo</div>

        <div className="viability-grid">
          <div className="viability-box">
            <h3>Cenário 30k — Degrau D2</h3>
            <div className="viability-row"><span className="vr-label">MRR base</span><span className="vr-value">{fmtBRL(80000)}</span></div>
            <div className="viability-row"><span className="vr-label">Novas vendas 30%</span><span className="vr-value text-azul">{fmtBRL(9000)}</span></div>
            <div className="viability-row"><span className="vr-label">Receita disponível</span><span className="vr-value">{fmtBRL(89000)}</span></div>
            <div className="viability-row"><span className="vr-label">Custo fixo D2</span><span className="vr-value text-bordo">{fmtBRL(75644)}</span></div>
            <div className="viability-row"><span className="vr-label">Sobra/mês</span><span className="vr-value text-azul">{fmtBRL(13356)}</span></div>
            <div className="viability-row"><span className="vr-label">Reserva final (12m)</span><span className="vr-value">{fmtBRL(148272)}</span></div>
            <div className="viability-row"><span className="vr-label">Com marketing R$6k/mês</span><span className="vr-value">{fmtBRL(76272)}</span></div>
          </div>
          <div className="viability-box">
            <h3>Cenário 50k — Degrau D4</h3>
            <div className="viability-row"><span className="vr-label">MRR base</span><span className="vr-value">{fmtBRL(80000)}</span></div>
            <div className="viability-row"><span className="vr-label">Novas vendas 30%</span><span className="vr-value text-azul">{fmtBRL(15000)}</span></div>
            <div className="viability-row"><span className="vr-label">Receita disponível</span><span className="vr-value">{fmtBRL(95000)}</span></div>
            <div className="viability-row"><span className="vr-label">Custo fixo D4</span><span className="vr-value text-bordo">{fmtBRL(79644)}</span></div>
            <div className="viability-row"><span className="vr-label">Sobra/mês</span><span className="vr-value text-azul">{fmtBRL(15356)}</span></div>
            <div className="viability-row"><span className="vr-label">Reserva final (12m)</span><span className="vr-value">{fmtBRL(168272)}</span></div>
            <div className="viability-row"><span className="vr-label">Com marketing R$6k/mês</span><span className="vr-value">{fmtBRL(96272)}</span></div>
          </div>
        </div>

        <div className="section-title">Fluxo de Caixa — Cenário D2 (R$ 30k)</div>
        <FlowTable mrr={80000} sales30pct={9000} fixedCost={75644} mgmtBonus={12000} />

        <div className="section-title mt-16">Fluxo de Caixa — Cenário D4 (R$ 50k)</div>
        <FlowTable mrr={80000} sales30pct={15000} fixedCost={79644} mgmtBonus={16000} />

        <p className="viability-footnote">* O modelo não contempla despesas de marketing e comercial (R$ 6.000/mês hipotéticos).</p>
      </div>
    </div>
  );
}
