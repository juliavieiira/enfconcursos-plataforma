import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as credenciais reais do Supabase foram informadas
export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('seu-projeto')
  );
};

// ---------------------------------------------------------------------------
// MOCK SUPABASE CLIENT (Permite testar e usar localmente com persistência)
// ---------------------------------------------------------------------------
const LOCAL_STORAGE_USERS_KEY = 'enfconcursos_mock_users';
const LOCAL_STORAGE_SESSION_KEY = 'enfconcursos_mock_session';

class MockSupabaseAuth {
  constructor() {
    this.listeners = [];
  }

  _getUsers() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_USERS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  _saveUsers(users) {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  }

  _getSession() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  }

  _saveSession(session) {
    if (session) {
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    }
    this._notify(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
  }

  _notify(event, session) {
    this.listeners.forEach(cb => cb(event, session));
  }

  onAuthStateChange(callback) {
    this.listeners.push(callback);
    const session = this._getSession();
    setTimeout(() => callback(session ? 'SIGNED_IN' : 'INITIAL_SESSION', session), 10);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
          }
        }
      }
    };
  }

  async getSession() {
    return { data: { session: this._getSession() }, error: null };
  }

  async getUser() {
    const session = this._getSession();
    return { data: { user: session ? session.user : null }, error: null };
  }

  async signUp({ email, password, options = {} }) {
    await new Promise(r => setTimeout(r, 400));
    const users = this._getUsers();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { data: { user: null, session: null }, error: { message: 'Este e-mail já está cadastrado na plataforma.' } };
    }

    const newUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 11),
      email: email.toLowerCase(),
      password, // Mock local
      user_metadata: options.data || {},
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    this._saveUsers(users);

    // Mock Profile
    const profiles = JSON.parse(localStorage.getItem('enfconcursos_mock_profiles') || '{}');
    profiles[newUser.id] = {
      id: newUser.id,
      nome: options.data?.nome || email.split('@')[0],
      email: newUser.email,
      plano: 'gratuito',
      status: 'ativo',
      limite_diario: 15,
      questoes_respondidas_hoje: 0,
      created_at: newUser.created_at
    };
    localStorage.setItem('enfconcursos_mock_profiles', JSON.stringify(profiles));

    const session = {
      access_token: 'mock_token_' + Date.now(),
      user: newUser
    };
    this._saveSession(session);

    return { data: { user: newUser, session }, error: null };
  }

  async signInWithPassword({ email, password }) {
    await new Promise(r => setTimeout(r, 400));
    const users = this._getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      return { data: { user: null, session: null }, error: { message: 'E-mail ou senha inválidos. Verifique seus dados.' } };
    }

    const session = {
      access_token: 'mock_token_' + Date.now(),
      user
    };
    this._saveSession(session);

    return { data: { user, session }, error: null };
  }

  async signOut() {
    await new Promise(r => setTimeout(r, 200));
    this._saveSession(null);
    return { error: null };
  }

  async resetPasswordForEmail(email) {
    await new Promise(r => setTimeout(r, 300));
    const users = this._getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { data: null, error: { message: 'Nenhuma conta encontrada com este e-mail.' } };
    }
    return { data: {}, error: null };
  }
}

// Mock Database Queries
class MockSupabaseClient {
  constructor() {
    this.auth = new MockSupabaseAuth();
  }

  from(table) {
    return {
      select: (_fields = '*') => ({
        eq: (col, val) => ({
          single: async () => {
            if (table === 'profiles') {
              const profiles = JSON.parse(localStorage.getItem('enfconcursos_mock_profiles') || '{}');
              const profile = profiles[val] || null;
              return { data: profile, error: null };
            }
            return { data: null, error: null };
          }
        })
      }),
      update: (data) => ({
        eq: (col, val) => ({
          then: async (resolve) => {
            if (table === 'profiles') {
              const profiles = JSON.parse(localStorage.getItem('enfconcursos_mock_profiles') || '{}');
              if (profiles[val]) {
                profiles[val] = { ...profiles[val], ...data };
                localStorage.setItem('enfconcursos_mock_profiles', JSON.stringify(profiles));
              }
            }
            resolve({ error: null });
          }
        })
      }),
      insert: async (records) => {
        return { data: records, error: null };
      }
    };
  }
}

const headersToPlainObject = (headers) => {
  if (!headers) return {};
  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    const obj = {};
    headers.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
};

const xhrFetch = (url, init = {}) =>
  new Promise((resolve, reject) => {
    if (typeof XMLHttpRequest === 'undefined') {
      reject(new TypeError('XMLHttpRequest indisponível'));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open((init.method || 'GET').toUpperCase(), url, true);
    const hdrs = init.headers || {};
    for (const [k, v] of Object.entries(hdrs)) {
      if (v !== undefined && v !== null) {
        xhr.setRequestHeader(k, String(v));
      }
    }
    xhr.onload = () => {
      const respHeaders = new Headers();
      const rawHeaders = xhr.getAllResponseHeaders() || '';
      rawHeaders
        .trim()
        .split(/[\r\n]+/)
        .forEach((line) => {
          const idx = line.indexOf(':');
          if (idx > 0) {
            respHeaders.append(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
          }
        });
      resolve(
        new Response(xhr.responseText, {
          status: xhr.status || 200,
          statusText: xhr.statusText || 'OK',
          headers: respHeaders
        })
      );
    };
    xhr.onerror = () => reject(new TypeError('XMLHttpRequest network error'));
    xhr.send(init.body ?? null);
  });

// Em ambiente de desenvolvimento (preview sandbox), reescreve chamadas do Supabase
// para o caminho RELATIVO '/supabase-proxy/...' servido pelo Vite na mesma origem.
// Em produção (Vercel/Netlify/domínio próprio), conecta diretamente à URL oficial do Supabase.
const devProxyFetch = async (input, init = {}) => {
  const rawUrl =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input?.url || String(input);

  let proxiedUrl = rawUrl;
  if (supabaseUrl && rawUrl.startsWith(supabaseUrl)) {
    proxiedUrl = `/supabase-proxy${rawUrl.slice(supabaseUrl.length)}`;
  }

  const cleanInit = {
    method: init?.method || 'GET',
    headers: headersToPlainObject(init?.headers),
    ...(init?.body !== undefined ? { body: init.body } : {}),
    ...(init?.signal ? { signal: init.signal } : {})
  };

  // 1. Caminho relativo '/supabase-proxy/...' (padrão ideal para sandbox preview e localhost)
  try {
    return await window.fetch(proxiedUrl, cleanInit);
  } catch (err1) {
    if (proxiedUrl.startsWith('/')) {
      // 2. Fallback explícito para localhost:8080
      try {
        return await window.fetch(`http://localhost:8080${proxiedUrl}`, cleanInit);
      } catch {
        // 3. Fallback via XMLHttpRequest relativo
        try {
          return await xhrFetch(proxiedUrl, cleanInit);
        } catch {
          const origin = typeof window !== 'undefined' ? window.location?.origin : 'n/a';
          const href = typeof window !== 'undefined' ? window.location?.href : 'n/a';
          throw new TypeError(`${err1?.message || 'Fetch error'} (origin=${origin}, href=${href}, proxy=${proxiedUrl})`);
        }
      }
    }
    throw err1;
  }
};

// Inicializa cliente real se variáveis existirem, senão ativa o mock com persistência local
export const supabase = isSupabaseConfigured()
  ? createClient(
      supabaseUrl,
      supabaseAnonKey,
      import.meta.env.DEV && typeof window !== 'undefined'
        ? { global: { fetch: devProxyFetch } }
        : undefined
    )
  : new MockSupabaseClient();

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    window.location.reload();
  });
}

export default supabase;


