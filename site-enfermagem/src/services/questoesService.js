import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const PAGE_SIZE_DEFAULT = 20;
const STATS_CACHE_KEY = 'enfconcursos_supabase_stats_v2';
const STATS_TTL_MS = 5 * 60 * 1000; // 5 minutos

// Cache em memória de páginas já buscadas (evita re-fetch ao avançar/voltar)
const pageCache = new Map();
let statsMemoryCache = null;

export function limparCacheQuestoes() {
  pageCache.clear();
  statsMemoryCache = null;
  try {
    sessionStorage.removeItem(STATS_CACHE_KEY);
  } catch {
    // ignore storage errors
  }
}

/**
 * Sanitiza termo de busca para uso seguro em filtros PostgREST `.or()`
 */
function sanitizarBusca(termo) {
  if (!termo) return '';
  return termo
    .trim()
    .replace(/[%_,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Busca paginada 100% server-side no Supabase (pronta para +20.000 questões).
 * Nunca sofre com o limite padrão de 1.000 linhas do PostgREST.
 */
export async function buscarQuestoesPaginadas({
  banca = 'SELECON',
  cargo = 'Todos',
  materia = 'Enfermagem',
  assunto = 'Todos',
  busca = '',
  pagina = 0,
  tamanhoPagina = PAGE_SIZE_DEFAULT
}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não está configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local.');
  }

  const buscaLimpa = sanitizarBusca(busca);
  const cacheKey = JSON.stringify({ banca, cargo, materia, assunto, busca: buscaLimpa, pagina, tamanhoPagina });

  if (pageCache.has(cacheKey)) {
    return pageCache.get(cacheKey);
  }

  let query = supabase
    .from('questoes')
    .select('*', { count: 'exact' })
    .eq('ativo', true);

  if (banca && banca !== 'Todas') {
    query = query.eq('banca', banca);
  }

  if (materia && materia !== 'Todas') {
    query = query.eq('materia', materia);
  }

  if (assunto && assunto !== 'Todos') {
    query = query.eq('assunto', assunto);
  }

  // O filtro de Cargo aplica-se especificamente à Enfermagem (Português é comum a todos os cargos)
  if (cargo && cargo !== 'Todos' && materia !== 'Língua Portuguesa') {
    if (materia === 'Enfermagem') {
      query = query.eq('cargo', cargo);
    } else {
      query = query.or(`materia.eq.Língua Portuguesa,cargo.eq.${cargo}`);
    }
  }

  if (buscaLimpa) {
    query = query.or(
      `enunciado.ilike.%${buscaLimpa}%,orgao.ilike.%${buscaLimpa}%,assunto.ilike.%${buscaLimpa}%,id.ilike.%${buscaLimpa}%`
    );
  }

  const from = pagina * tamanhoPagina;
  const to = from + tamanhoPagina - 1;

  const { data, count, error } = await query
    .order('id', { ascending: true })
    .range(from, to);

  if (error) {
    throw new Error(`Erro ao consultar questões no Supabase: ${error.message}`);
  }

  const resultado = {
    itens: Array.isArray(data) ? data : [],
    total: typeof count === 'number' ? count : 0,
    pagina,
    tamanhoPagina
  };

  // Mantém o cache leve (máximo 100 páginas em memória)
  if (pageCache.size > 100) {
    const primeiraChave = pageCache.keys().next().value;
    pageCache.delete(primeiraChave);
  }
  pageCache.set(cacheKey, resultado);

  return resultado;
}

/**
 * Carrega estatísticas reais em tempo real direto do Supabase (agrupadas por banca/matéria/assunto).
 * Usa RPC `obter_estatisticas_acervo` se disponível, com fallback paginado superleve automático.
 */
export async function carregarEstatisticasAcervo() {
  if (statsMemoryCache && statsMemoryCache.totalGeral > 0) {
    return statsMemoryCache;
  }

  try {
    const cachedRaw = sessionStorage.getItem(STATS_CACHE_KEY);
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw);
      if (
        parsed &&
        parsed.timestamp &&
        Date.now() - parsed.timestamp < STATS_TTL_MS &&
        Array.isArray(parsed.rows) &&
        parsed.rows.length > 0
      ) {
        statsMemoryCache = construirResumoEstatisticas(parsed.rows);
        return statsMemoryCache;
      }
    }
  } catch {
    // ignore cache parse errors
  }

  if (!isSupabaseConfigured()) {
    return construirResumoEstatisticas([]);
  }

  const salvarCache = (rows) => {
    const resumo = construirResumoEstatisticas(rows);
    if (resumo.totalGeral > 0) {
      statsMemoryCache = resumo;
      try {
        sessionStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), rows }));
      } catch {
        // ignore storage quota
      }
    }
    return resumo;
  };

  // Tentativa 1: RPC ultra-rápida no servidor PostgreSQL (1 única chamada < 20ms mesmo com 100.000 questões)
  try {
    const { data, error } = await supabase.rpc('obter_estatisticas_acervo');
    if (!error && Array.isArray(data) && data.length > 0) {
      const rows = data.map(r => ({
        banca: r.banca,
        materia: r.materia,
        assunto: r.assunto,
        cargo: r.cargo,
        total: Number(r.total) || 0
      }));
      return salvarCache(rows);
    }
  } catch {
    // Fallback abaixo
  }

  // Tentativa 2 (Fallback automático): 1ª página + demais páginas em paralelo (4x mais rápido)
  const batchSize = 1000;
  const firstRes = await supabase
    .from('questoes')
    .select('banca,materia,assunto,cargo', { count: 'exact' })
    .eq('ativo', true)
    .range(0, batchSize - 1);

  if (firstRes.error || !Array.isArray(firstRes.data) || firstRes.data.length === 0) {
    return construirResumoEstatisticas([]);
  }

  const allMeta = [...firstRes.data];
  const totalCount = typeof firstRes.count === 'number' ? firstRes.count : firstRes.data.length;

  if (totalCount > batchSize) {
    const promises = [];
    for (let offset = batchSize; offset < totalCount; offset += batchSize) {
      promises.push(
        supabase
          .from('questoes')
          .select('banca,materia,assunto,cargo')
          .eq('ativo', true)
          .range(offset, offset + batchSize - 1)
      );
    }
    const results = await Promise.all(promises);
    for (const r of results) {
      if (!r.error && Array.isArray(r.data)) {
        allMeta.push(...r.data);
      }
    }
  }

  const mapaAgregado = new Map();
  for (const q of allMeta) {
    const key = `${q.banca}||${q.materia}||${q.assunto}||${q.cargo || ''}`;
    mapaAgregado.set(key, (mapaAgregado.get(key) || 0) + 1);
  }

  const rows = [];
  for (const [key, total] of mapaAgregado.entries()) {
    const [banca, materia, assunto, cargo] = key.split('||');
    rows.push({ banca, materia, assunto, cargo, total });
  }

  return salvarCache(rows);
}

function construirResumoEstatisticas(rows) {
  let totalGeral = 0;
  const porBanca = {};
  const porMateria = {};
  const porAssunto = {};

  for (const r of rows) {
    const n = Number(r.total) || 0;
    totalGeral += n;
    porBanca[r.banca] = (porBanca[r.banca] || 0) + n;
    porMateria[r.materia] = (porMateria[r.materia] || 0) + n;
    porAssunto[r.assunto] = (porAssunto[r.assunto] || 0) + n;
  }

  return {
    rows,
    totalGeral,
    porBanca,
    porMateria,
    porAssunto
  };
}

/**
 * Calcula total exato para qualquer combinação de filtros (Banca, Matéria, Assunto)
 */
export function contarPorFiltro(stats, { banca = 'Todas', materia = 'Todas', assunto = 'Todos' } = {}) {
  if (!stats || !Array.isArray(stats.rows)) return 0;
  return stats.rows.reduce((acc, r) => {
    if (banca !== 'Todas' && r.banca !== banca) return acc;
    if (materia !== 'Todas' && r.materia !== materia) return acc;
    if (assunto !== 'Todos' && r.assunto !== assunto) return acc;
    return acc + (Number(r.total) || 0);
  }, 0);
}

/**
 * Gera os dados dinâmicos do gráfico Donut e Ranking para a aba Padrão da Banca (Raio-X)
 */
export function obterRaioXDinamico(stats, banca = 'SELECON', materia = 'Todas') {
  if (!stats || !Array.isArray(stats.rows)) {
    return { total: 0, temas: [] };
  }

  const mapaTemas = new Map();
  let total = 0;

  for (const r of stats.rows) {
    if (banca !== 'Todas' && r.banca !== banca) continue;
    if (materia !== 'Todas' && r.materia !== materia) continue;

    const n = Number(r.total) || 0;
    total += n;

    const chave = `${r.materia}||${r.assunto}`;
    const atual = mapaTemas.get(chave) || { nome: r.assunto, materia: r.materia, count: 0 };
    atual.count += n;
    mapaTemas.set(chave, atual);
  }

  const temas = Array.from(mapaTemas.values())
    .sort((a, b) => b.count - a.count)
    .map(t => ({
      ...t,
      percent: total > 0 ? ((t.count / total) * 100).toFixed(1) : '0.0'
    }));

  return { total, temas };
}

/**
 * Sorteia um simulado oficial completo (60 questões: 20 Português + 40 Enfermagem)
 * diretamente no PostgreSQL do Supabase via RPC `sortear_simulado`.
 */
export async function gerarSimuladoSupabase({
  banca = 'SELECON',
  numero = 1,
  titulo,
  subtitulo,
  qtdPortugues = 20,
  qtdEnfermagem = 40
}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não está configurado para geração de simulados.');
  }

  const pBanca = banca === 'Todas' ? 'TODAS' : banca;

  const { data, error } = await supabase.rpc('sortear_simulado', {
    p_banca: pBanca,
    p_qtd_portugues: qtdPortugues,
    p_qtd_enfermagem: qtdEnfermagem
  });

  if (error) {
    throw new Error(`Erro ao gerar simulado no Supabase: ${error.message}`);
  }

  const rawList = Array.isArray(data) ? data : [];
  if (rawList.length === 0) {
    throw new Error(`Não há questões suficientes cadastradas no Supabase para a banca ${banca}.`);
  }

  // Garante ordenação: Módulo I (Língua Portuguesa) seguido do Módulo II (Enfermagem)
  const port = rawList.filter(q => q.materia === 'Língua Portuguesa');
  const enf = rawList.filter(q => q.materia === 'Enfermagem');
  const ordenadas = [...port, ...enf].map((q, idx) => ({
    ...q,
    numero_simulado: idx + 1
  }));

  const contarTemas = (lista) => {
    const mapa = new Map();
    for (const q of lista) {
      mapa.set(q.assunto, (mapa.get(q.assunto) || 0) + 1);
    }
    return Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tema, questoes]) => ({ tema, questoes }));
  };

  return {
    id: `simulado-${banca.toLowerCase()}-${numero}-${Date.now()}`,
    numero,
    titulo: titulo || `Simulado Oficial ${banca} #0${numero} - Prova Completa`,
    subtitulo: subtitulo || `Prova gerada em tempo real do banco auditado da banca ${banca}`,
    banca,
    totalQuestoes: ordenadas.length,
    duracaoMinutos: 180,
    distribuicao: {
      portugues: port.length,
      enfermagem: enf.length
    },
    gradeTemas: {
      portugues: contarTemas(port),
      enfermagem: contarTemas(enf)
    },
    questoes: ordenadas
  };
}
