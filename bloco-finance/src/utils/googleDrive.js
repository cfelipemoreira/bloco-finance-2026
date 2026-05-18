const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const TOKEN_KEY = 'bloco_gdrive_token';

const MONTHS_PT = [
  'JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO',
  'JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'
];

// ── Token management ──────────────────────────────────────────────────────────

function saveToken(tokenObj) {
  const expiry = Date.now() + tokenObj.expires_in * 1000;
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ ...tokenObj, expiry }));
}

function loadToken() {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw);
    if (Date.now() > t.expiry - 60_000) { sessionStorage.removeItem(TOKEN_KEY); return null; }
    return t;
  } catch { return null; }
}

export function isGDriveConnected() {
  return !!loadToken();
}

export function disconnectGDrive() {
  sessionStorage.removeItem(TOKEN_KEY);
}

// ── OAuth2 popup ──────────────────────────────────────────────────────────────

export function connectGDrive() {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error('VITE_GOOGLE_CLIENT_ID não configurado.'));
      return;
    }
    const existing = loadToken();
    if (existing) { resolve(existing.access_token); return; }

    const redirectUri = window.location.origin;
    const state = Math.random().toString(36).slice(2);
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', CLIENT_ID);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'token');
    url.searchParams.set('scope', SCOPES);
    url.searchParams.set('state', state);
    url.searchParams.set('prompt', 'select_account');

    const popup = window.open(url.toString(), '_blank', 'width=500,height=640');

    const interval = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(interval);
          reject(new Error('Popup fechada pelo usuário.'));
          return;
        }
        const href = popup.location.href;
        if (href.startsWith(redirectUri) && href.includes('access_token')) {
          clearInterval(interval);
          popup.close();
          const hash = new URLSearchParams(href.split('#')[1]);
          const tokenObj = {
            access_token: hash.get('access_token'),
            expires_in: parseInt(hash.get('expires_in') || '3600', 10),
            token_type: hash.get('token_type'),
          };
          saveToken(tokenObj);
          resolve(tokenObj.access_token);
        }
      } catch {
        // Cross-origin — still waiting for redirect
      }
    }, 300);
  });
}

// ── Drive API helpers ─────────────────────────────────────────────────────────

async function driveRequest(path, options = {}) {
  const token = loadToken();
  if (!token) throw new Error('Não autenticado no Google Drive.');
  const res = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Drive API error ${res.status}`);
  }
  return res.json();
}

async function findFolder(name, parentId) {
  const q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
  const data = await driveRequest(`/files?q=${encodeURIComponent(q)}&fields=files(id,name)`);
  return data.files?.[0] || null;
}

async function createFolder(name, parentId) {
  const token = loadToken();
  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Erro ao criar pasta');
  return data;
}

async function getOrCreateFolder(name, parentId = 'root') {
  const existing = await findFolder(name, parentId);
  if (existing) return existing;
  return createFolder(name, parentId);
}

export async function uploadToDrive(file, month, year) {
  const token = loadToken();
  if (!token) throw new Error('Conecte o Google Drive primeiro.');

  // FINANCEIRO > CARTÃO DE CRÉDITO > MÊS/ANO
  const financeiroFolder = await getOrCreateFolder('FINANCEIRO');
  const cartaoFolder     = await getOrCreateFolder('CARTÃO DE CRÉDITO', financeiroFolder.id);
  const monthLabel       = `${MONTHS_PT[month - 1]}/${year}`;
  const monthFolder      = await getOrCreateFolder(monthLabel, cartaoFolder.id);

  // Multipart upload
  const metadata = { name: file.name, parents: [monthFolder.id] };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.access_token}` },
      body: form,
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Erro no upload');
  return data;
}
