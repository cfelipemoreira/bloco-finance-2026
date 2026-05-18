import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Login, { isAuthenticated, logout } from './components/Login';
import Tab1Readonly from './tabs/Tab1Readonly';
import Tab2Editable from './tabs/Tab2Editable';
import Tab3Despesas from './tabs/Tab3Despesas';
import Tab4Investimentos from './tabs/Tab4Investimentos';
import Tab5Simulacao from './tabs/Tab5Simulacao';
import Tab6Metas from './tabs/Tab6Metas';
import Tab7Cartao from './tabs/Tab7Cartao';

const TABS = {
  1: Tab1Readonly,
  2: Tab2Editable,
  3: Tab3Despesas,
  4: Tab4Investimentos,
  5: Tab5Simulacao,
  6: Tab6Metas,
  7: Tab7Cartao,
};

function App() {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [activeTab, setActiveTab] = useState(1);
  const TabComponent = TABS[activeTab];

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={() => { logout(); setAuthed(false); }} />
      <main className="main-content">
        <TabComponent />
      </main>
    </div>
  );
}

export default App;
