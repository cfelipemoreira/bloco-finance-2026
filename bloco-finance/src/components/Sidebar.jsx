export default function Sidebar({ activeTab, onTabChange }) {
  const tabs = [
    { id: 1, label: 'Reestruturação (leitura)' },
    { id: 2, label: 'Reestruturação (edição)' },
    { id: 3, label: 'Quadro de Despesas' },
    { id: 4, label: 'Investimentos' },
    { id: 5, label: 'Simulação Mensal' },
    { id: 6, label: 'Metas de Vendas' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="brand-logo">
          <img
            src="/LOGO BLOCO_02@2x-8.png"
            alt="BLOCO."
            className="brand-img"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
          />
          {/* Fallback text if image not found */}
          <span className="brand-wordmark" style={{ display: 'none' }}>BLOCO.</span>
          <span className="brand-sub">Finance</span>
        </div>
        <div className="brand-divider" />
      </div>
      <nav className="sidebar-nav">
        {tabs.map(t => (
          <div
            key={t.id}
            className={`nav-item${activeTab === t.id ? ' active' : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            <span className="nav-num">{t.id}</span>
            <span className="nav-label">{t.label}</span>
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p>Felipe Moreira<br />Sócio-Fundador, BLOCO.<br />Vigência: 01/08/2026</p>
      </div>
    </aside>
  );
}
