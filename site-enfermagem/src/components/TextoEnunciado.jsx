import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

export const TextoEnunciado = ({ enunciado, questaoId }) => {
  // Rastreador de expansão por questão: reseta automaticamente na troca de questão
  const [expandidoId, setExpandidoId] = useState(null);
  const expandido = expandidoId === questaoId;

  const toggleExpandido = () => {
    setExpandidoId(prev => (prev === questaoId ? null : questaoId));
  };

  if (!enunciado) {
    return (
      <p className="question-text" style={{ fontSize: '1.08rem', lineHeight: '1.75' }}>
        <strong>Enunciado:</strong> Analise as alternativas abaixo e assinale a opção correta:
      </p>
    );
  }

  // Detecta textos longos de apoio tanto no padrão SELECON ("Leia o texto a seguir")
  // quanto no padrão FCC ("Atenção: Para responder à questão, baseie-se no texto seguinte.", "Considere o texto...", etc.)
  const triggerRegex = /(.*?)(leia o texto(?:\s+a\s+seguir|\s+abaixo)?(?:[^\n.:]*[:.]?)|atenção:\s*(?:para responder[^.\n]*texto[^.\n]*\.|considere[^.\n]*\.|leia[^.\n]*\.))\s*([\s\S]*)/i;
  const match = enunciado.match(triggerRegex);
  const isTextoLongoComLeitura = Boolean(match && enunciado.length > 260);

  if (!isTextoLongoComLeitura) {
    return (
      <p className="question-text" style={{ fontSize: '1.08rem', lineHeight: '1.75', whiteSpace: 'pre-line' }}>
        <strong>Enunciado:</strong> {enunciado}
      </p>
    );
  }

  const prefixo = match[1].trim();
  const triggerRaw = match[2].trim();
  const triggerLabel = /leia o texto/i.test(triggerRaw) ? triggerRaw : 'Leia o texto a seguir';
  const resto = match[3].trim();

  let textoLeitura = resto;
  let comando = '';

  // 1. Se houver separação explícita por parágrafo (\n\n), testa se o último parágrafo é o comando da questão
  const paragrafos = resto.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  if (paragrafos.length >= 2) {
    const ultimo = paragrafos[paragrafos.length - 1];
    if (
      ultimo.length >= 15 &&
      ultimo.length <= 520 &&
      (/[:?]\s*$/.test(ultimo) ||
        /^(?:de acordo|segundo|com base|no texto|a frase|a afirmação|a expressão|no trecho|em relação|assinale|está correta|considerando|o segmento|o trecho|na frase|na passagem|no \d+[ºª°]? parágrafo|[“"])/i.test(ultimo))
    ) {
      comando = ultimo;
      textoLeitura = paragrafos.slice(0, -1).join('\n\n');
    }
  }

  // 2. Fallback por padrão de Fonte / citação / última sentença interrogativa ou terminada em ":"
  if (!comando) {
    const cutPattern = /([\s\S]*?(?:Fonte:[^\n]+?\.?|\(Adaptado de:[^)]+\)|\(Disponível em:[^)]+\)|Excerto adaptado\.?))\s+([A-ZÁÉÍÓÚ“"][^\n]*?[:?]\s*)$/i;
    const cutMatch = resto.match(cutPattern);
    if (cutMatch && cutMatch[2].length > 15 && cutMatch[2].length < 480) {
      textoLeitura = cutMatch[1].trim();
      comando = cutMatch[2].trim();
    } else {
      const citPattern = /([\s\S]*?(?:“[^”]+”|"[^"]+")\s*\([^)]+parágrafo\)\.?)\s+(.+[:?]\s*)$/i;
      const citMatch = resto.match(citPattern);
      if (citMatch && citMatch[2].length > 15 && citMatch[2].length < 480) {
        textoLeitura = citMatch[1].trim();
        comando = citMatch[2].trim();
      } else {
        const lastSentencePattern = /([\s\S]*?[.!?])\s+([A-ZÁÉÍÓÚ“"][^.]*?[:?]\s*)$/;
        const lastMatch = resto.match(lastSentencePattern);
        if (lastMatch && lastMatch[2].length >= 15 && lastMatch[2].length < 380) {
          textoLeitura = lastMatch[1].trim();
          comando = lastMatch[2].trim();
        }
      }
    }
  }

  return (
    <div className="leia-texto-wrapper animate-fade-in">
      {prefixo && (
        <div className="leia-texto-prefixo" style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.35rem' }}>
          {prefixo}
        </div>
      )}

      {/* Caixa Expansível do Texto de Leitura (máximo 2 linhas quando recolhida) */}
      <div className={`leia-texto-box ${expandido ? 'aberto' : 'fechado'}`}>
        <div
          className="leia-texto-header-btn"
          onClick={toggleExpandido}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpandido(); } }}
          title={expandido ? 'Clique para recolher o texto' : 'Clique para abrir o texto completo'}
        >
          <div className="leia-texto-header-left">
            <BookOpen size={17} color="#0d9488" />
            <strong className="leia-texto-label">{triggerLabel}</strong>
            <button
              type="button"
              className="setinha-toggle"
              aria-label={expandido ? 'Recolher texto' : 'Abrir texto completo'}
              tabIndex={-1}
            >
              {expandido ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
          <span className="leia-texto-action-hint">
            {expandido ? 'Recolher texto ▲' : 'Abrir texto completo ▼'}
          </span>
        </div>

        {/* Texto limitado a no máximo 2 linhas quando fechado */}
        <div
          className={`leia-texto-content ${expandido ? 'expandido' : 'clamped-2-lines'}`}
          style={expandido ? { whiteSpace: 'pre-line' } : undefined}
          onClick={() => !expandido && setExpandidoId(questaoId)}
          title={!expandido ? 'Clique para expandir e ler o texto completo' : undefined}
        >
          {textoLeitura}
        </div>
      </div>

      {/* Comando específico da questão */}
      {comando ? (
        <p className="question-text" style={{ fontSize: '1.08rem', lineHeight: '1.75', marginTop: '1rem' }}>
          <strong>Enunciado:</strong> {comando}
        </p>
      ) : (
        !expandido && (
          <div className="leia-texto-hint-inline" onClick={() => setExpandidoId(questaoId)}>
            <span>👇 Clique na setinha acima para abrir o texto e o enunciado completo.</span>
          </div>
        )
      )}
    </div>
  );
};

export default TextoEnunciado;
