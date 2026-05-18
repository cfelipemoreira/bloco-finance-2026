import { useState, useRef, useCallback } from 'react';
import { extractTextFromPDF, parseExpenses } from '../utils/pdfParser';
import { connectGDrive, uploadToDrive, isGDriveConnected, disconnectGDrive } from '../utils/googleDrive';
import { fmtBRL } from '../utils/formatters';

const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

const STORAGE_PREFIX = 'bloco_cartao_';

function storageKey(year, month) {
  return `${STORAGE_PREFIX}${year}_${String(month).padStart(2,'0')}`;
}

function loadMonth(year, month) {
  try {
    const raw = localStorage.getItem(storageKey(year, month));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveMonth(year, month, data) {
  localStorage.setItem(storageKey(year, month), JSON.stringify(data));
}

function listSavedMonths() {
  const results = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(STORAGE_PREFIX)) {
      const [y, m] = k.replace(STORAGE_PREFIX, '').split('_');
      results.push({ year: parseInt(y), month: parseInt(m) });
    }
  }
  return results.sort((a, b) => b.year - a.year || b.month - a.month);
}

export default function Tab7Cartao() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState(() => loadMonth(now.getFullYear(), now.getMonth() + 1));
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [driveConnected, setDriveConnected] = useState(isGDriveConnected);
  const [status, setStatus] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDesc, setEditDesc] = useState('');
  const [editVal, setEditVal] = useState('');
  const [savedMonths] = useState(listSavedMonths);
  const fileRef = useRef();

  const navigate = useCallback((y, m) => {
    setYear(y); setMonth(m);
    setData(loadMonth(y, m));
    setStatus('');
  }, []);

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    navigate(d.getFullYear(), d.getMonth() + 1);
  };
  const nextMonth = () => {
    const d = new Date(year, month, 1);
    navigate(d.getFullYear(), d.getMonth() + 1);
  };

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setStatus('Selecione um arquivo PDF válido.');
      return;
    }
    setParsing(true);
    setStatus('Lendo PDF…');
    try {
      const lines = await extractTextFromPDF(file);
      const expenses = parseExpenses(lines);
      if (!expenses.length) {
        setStatus('Nenhuma despesa identificada. Você pode adicionar manualmente.');
      } else {
        setStatus(`${expenses.length} despesas extraídas.`);
      }
      const record = {
        year, month,
        pdfName: file.name,
        driveFileId: null,
        driveLink: null,
        expenses,
        uploadedAt: new Date().toISOString(),
      };
      saveMonth(year, month, record);
      setData(record);

      // Upload to Google Drive
      if (driveConnected) {
        await runDriveUpload(file, record);
      }
    } catch (err) {
      setStatus('Erro ao processar PDF: ' + err.message);
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function runDriveUpload(file, record) {
    setUploading(true);
    setStatus(prev => prev + ' Enviando para o Drive…');
    try {
      const result = await uploadToDrive(file, month, year);
      const updated = { ...record, driveFileId: result.id, driveLink: result.webViewLink };
      saveMonth(year, month, updated);
      setData(updated);
      setStatus(prev => prev.replace('Enviando para o Drive…', '') + ' Salvo no Google Drive.');
    } catch (err) {
      setStatus(prev => prev + ' (Falha no Drive: ' + err.message + ')');
    } finally {
      setUploading(false);
    }
  }

  async function handleConnectDrive() {
    try {
      await connectGDrive();
      setDriveConnected(true);
      setStatus('Google Drive conectado.');
    } catch (err) {
      setStatus('Falha ao conectar Drive: ' + err.message);
    }
  }

  function handleDisconnect() {
    disconnectGDrive();
    setDriveConnected(false);
    setStatus('Drive desconectado.');
  }

  function startEdit(exp) {
    setEditingId(exp.id);
    setEditDesc(exp.desc);
    setEditVal(String(exp.value));
  }

  function commitEdit() {
    if (!data || !editingId) return;
    const updated = {
      ...data,
      expenses: data.expenses.map(e =>
        e.id === editingId
          ? { ...e, desc: editDesc, value: parseFloat(editVal.replace(',', '.')) || e.value }
          : e
      ),
    };
    saveMonth(year, month, updated);
    setData(updated);
    setEditingId(null);
  }

  function deleteExpense(id) {
    if (!data) return;
    const updated = { ...data, expenses: data.expenses.filter(e => e.id !== id) };
    saveMonth(year, month, updated);
    setData(updated);
  }

  function addManual() {
    if (!data) {
      const record = { year, month, pdfName: null, driveFileId: null, driveLink: null, expenses: [], uploadedAt: new Date().toISOString() };
      saveMonth(year, month, record);
      setData(record);
      return;
    }
    const newExp = { id: Math.random().toString(36).slice(2,9), desc: 'Nova despesa', date: '', value: 0, category: '' };
    const updated = { ...data, expenses: [...data.expenses, newExp] };
    saveMonth(year, month, updated);
    setData(updated);
    startEdit(newExp);
  }

  const total = data?.expenses?.reduce((s, e) => s + (e.value || 0), 0) || 0;

  return (
    <div className="tab-content">
      {/* Header */}
      <div className="tab-header">
        <h2>Cartão de Crédito</h2>
        <div className="cartao-drive-bar">
          {driveConnected ? (
            <div className="drive-connected-pill">
              <span className="drive-dot" />
              Drive conectado
              <button className="drive-disconnect-btn" onClick={handleDisconnect}>desconectar</button>
            </div>
          ) : (
            <button className="btn-drive-connect" onClick={handleConnectDrive}>
              Conectar Google Drive
            </button>
          )}
        </div>
      </div>

      {/* Month navigator */}
      <div className="cartao-nav">
        <button className="cartao-nav-btn" onClick={prevMonth}>‹</button>
        <div className="cartao-nav-label">
          <span className="cartao-month">{MONTHS_PT[month - 1]}</span>
          <span className="cartao-year">{year}</span>
        </div>
        <button className="cartao-nav-btn" onClick={nextMonth}>›</button>
      </div>

      {/* Upload zone */}
      {!data && (
        <div
          className="cartao-dropzone"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) { fileRef.current.files = e.dataTransfer.files; handleFile({ target: { files: e.dataTransfer.files } }); } }}
        >
          <div className="cartao-dropzone-icon">PDF</div>
          <p>Clique ou arraste a fatura do cartão aqui</p>
          <span>{MONTHS_PT[month - 1]} {year}</span>
          <input ref={fileRef} type="file" accept="application/pdf" style={{ display:'none' }} onChange={handleFile} />
        </div>
      )}

      {/* Re-upload when month already exists */}
      {data && (
        <div className="cartao-reupload-row">
          <div className="cartao-pdf-badge">
            <span className="pdf-icon">PDF</span>
            <span className="pdf-name">{data.pdfName || 'Fatura'}</span>
            {data.driveLink && (
              <a href={data.driveLink} target="_blank" rel="noreferrer" className="drive-link-btn">
                Ver no Drive ↗
              </a>
            )}
          </div>
          <button className="btn-reupload" onClick={() => fileRef.current?.click()}>
            Substituir fatura
          </button>
          <input ref={fileRef} type="file" accept="application/pdf" style={{ display:'none' }} onChange={handleFile} />
        </div>
      )}

      {/* Status */}
      {(parsing || uploading || status) && (
        <p className="cartao-status">{parsing || uploading ? '⏳ ' : ''}{status}</p>
      )}

      {/* Expenses table */}
      {data && (
        <div className="cartao-table-wrap">
          <div className="cartao-table-header">
            <span>Despesa</span>
            <span>Data</span>
            <span>Valor</span>
            <span />
          </div>
          {data.expenses.map(exp => (
            <div key={exp.id} className="cartao-row">
              {editingId === exp.id ? (
                <>
                  <input
                    className="cartao-edit-input"
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && commitEdit()}
                    autoFocus
                  />
                  <span className="cartao-date">{exp.date}</span>
                  <input
                    className="cartao-edit-input cartao-edit-val"
                    value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && commitEdit()}
                  />
                  <div className="cartao-row-actions">
                    <button className="cartao-btn-save" onClick={commitEdit}>✓</button>
                    <button className="cartao-btn-del" onClick={() => setEditingId(null)}>✕</button>
                  </div>
                </>
              ) : (
                <>
                  <span className="cartao-desc" onClick={() => startEdit(exp)}>{exp.desc}</span>
                  <span className="cartao-date">{exp.date}</span>
                  <span className="cartao-val">{fmtBRL(exp.value)}</span>
                  <div className="cartao-row-actions">
                    <button className="cartao-btn-edit" onClick={() => startEdit(exp)}>✎</button>
                    <button className="cartao-btn-del" onClick={() => deleteExpense(exp.id)}>✕</button>
                  </div>
                </>
              )}
            </div>
          ))}
          <div className="cartao-total-row">
            <span>Total da fatura</span>
            <span>{fmtBRL(total)}</span>
          </div>
          <button className="cartao-add-btn" onClick={addManual}>+ Adicionar despesa</button>
        </div>
      )}

      {/* Saved months sidebar list */}
      {savedMonths.length > 0 && (
        <div className="cartao-history">
          <h4>Faturas salvas</h4>
          <div className="cartao-history-list">
            {savedMonths.map(({ year: y, month: m }) => (
              <button
                key={`${y}-${m}`}
                className={`cartao-history-item${y === year && m === month ? ' active' : ''}`}
                onClick={() => navigate(y, m)}
              >
                {MONTHS_PT[m - 1].slice(0,3)} {y}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
