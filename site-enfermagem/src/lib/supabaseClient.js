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

// Inicializa cliente real se variáveis existirem, senão ativa o mock com persistência local
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new MockSupabaseClient();

export default supabase;
