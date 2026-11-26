import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

export const TextoEnunciado = ({ enunciado, questaoId }) => {
  // Rastreador de expansão por questão: evita useEffect e reseta automaticamente na troca
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

  // Verifica se é uma questão com texto longo de apoio/leitura
  const isTextoLongoComLeitura =
    /leia o texto/i.test(enunciado) && enunciado.length > 180;

  if (!isTextoLongoComLeitura) {
    return (
      <p className="question-text" style={{ fontSize: '1.08rem', lineHeight: '1.75' }}>
        <strong>Enunciado:</strong> {enunciado}
      </p>
    );
  }

  // Extrai prefixo, gatilho ("Leia o texto a seguir") e corpo do texto
  const match = enunciado.match(/(.*?)(leia o texto(?:\s+a\s+seguir|\s+abaixo)?(?:[^\n.:]*[:.]?))\s*(.*)/is);
  const prefixo = match ? match[1].trim() : '';
  const trigger = match ? match[2].trim() : 'Leia o texto a seguir';
  const resto = match ? match[3].trim() : enunciado;

  let textoLeitura = resto;
  let comando = '';

  // Tenta isolar o comando final da questão (ex: após Fonte, ou última frase interrogativa/afirmativa)
  const cutPattern = /(.*?(?:Fonte:[^\n]+?\.?|\(Adaptado de:[^)]+\)|\(Disponível em:[^)]+\)|Excerto adaptado\.?))\s+([A-Z“"].*?[:?]\s*)$/is;
  const cutMatch = resto.match(cutPattern);
  if (cutMatch && cutMatch[2].length > 15) {
    textoLeitura = cutMatch[1].trim();
    comando = cutMatch[2].trim();
  } else {
    const citPattern = /(.*?(?:“[^”]+”|"[^"]+")\s*\([^)]+parágrafo\)\.?)\s+(.+[:?]\s*)$/is;
    const citMatch = resto.match(citPattern);
    if (citMatch && citMatch[2].length > 15) {
      textoLeitura = citMatch[1].trim();
      comando = citMatch[2].trim();
    } else {
      const lastSentencePattern = /(.*?[.!?])\s+([A-Z“"].*?[:?]\s*)$/s;
      const lastMatch = resto.match(lastSentencePattern);
      if (lastMatch && lastMatch[2].length >= 15 && lastMatch[2].length < 350) {
        textoLeitura = lastMatch[1].trim();
        comando = lastMatch[2].trim();
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

      {/* Caixa Expansível do Texto de Leitura */}
      <div className={`leia-texto-box ${expandido ? 'aberto' : 'fechado'}`}>
        <div
          className="leia-texto-header-btn"
          onClick={toggleExpandido}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExpandido(); }}
          title={expandido ? 'Clique para recolher o texto' : 'Clique para abrir o texto completo'}
        >
          <div className="leia-texto-header-left">
            <BookOpen size={17} color="#0d9488" />
            <strong className="leia-texto-label">{trigger}</strong>
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
          onClick={() => !expandido && setExpandidoId(questaoId)}
          title={!expandido ? 'Clique para expandir e ler o texto completo' : undefined}
        >
          {textoLeitura}
        </div>
      </div>

      {/* Comando e pergunta específica da questão */}
      {comando ? (
        <p className="question-text" style={{ fontSize: '1.08rem', lineHeight: '1.75', marginTop: '1rem' }}>
          <strong>Enunciado:</strong> {comando}
        </p>
      ) : (
        !expandido && (
          <div className="leia-texto-hint-inline" onClick={() => setExpandidoId(questaoId)}>
            <span>👇 Clique na setinha acima para ler o texto e o enunciado completo.</span>
          </div>
        )
      )}
    </div>
  );
};

export default TextoEnunciado;
