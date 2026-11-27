import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, BookOpen, ZoomIn } from 'lucide-react';

/**
 * Utilitário para parsear markdown de imagens:
 * ![alt text](/questoes_imagens/...) ou [IMAGEM: /questoes_imagens/... | legenda]
 */
const renderizarTextoComImagens = (texto, onZoom) => {
  if (!texto || typeof texto !== 'string') return null;

  const imageRegex = /(!\[(.*?)\]\((.*?)\)|\[IMAGEM:\s*([^\]|]+)(?:\|\s*([^\]]+))?\])/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = imageRegex.exec(texto)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push({
        type: 'text',
        content: texto.slice(lastIndex, matchIndex)
      });
    }

    let url = '';
    let alt = '';

    if (match[1].startsWith('![')) {
      // Markdown: ![alt](url)
      alt = match[2] || '';
      url = match[3] || '';
    } else {
      // Tag customizada: [IMAGEM: url | alt]
      url = (match[4] || '').trim();
      alt = (match[5] || '').trim();
    }

    parts.push({
      type: 'image',
      url,
      alt
    });

    lastIndex = imageRegex.lastIndex;
  }

  if (lastIndex < texto.length) {
    parts.push({
      type: 'text',
      content: texto.slice(lastIndex)
    });
  }

  // Se não tem imagens, retorna texto puro
  if (parts.length === 1 && parts[0].type === 'text') {
    return <span style={{ whiteSpace: 'pre-line' }}>{parts[0].content}</span>;
  }

  return parts.map((part, idx) => {
    if (part.type === 'text') {
      return (
        <span key={`txt-${idx}`} style={{ whiteSpace: 'pre-line' }}>
          {part.content}
        </span>
      );
    }
    return (
      <div className="questao-imagem-container" key={`img-${idx}`}>
        <figure className="questao-imagem-card">
          <img
            src={part.url}
            alt={part.alt || 'Ilustração da questão'}
            className="questao-imagem-img"
            loading="lazy"
            onClick={() => onZoom && onZoom({ url: part.url, alt: part.alt })}
            title="Clique na imagem para ampliar em tela cheia"
          />
          {part.alt && (
            <figcaption className="questao-imagem-caption">
              <span className="icone-lupa">🔍</span>
              <span>{part.alt}</span>
              <span className="dica-zoom">(clique para ampliar)</span>
            </figcaption>
          )}
        </figure>
      </div>
    );
  });
};

export const TextoEnunciado = ({ enunciado, questaoId }) => {
  // Rastreador de expansão por questão: reseta automaticamente na troca de questão
  const [expandidoId, setExpandidoId] = useState(null);
  const [imagemModal, setImagemModal] = useState(null);

  const expandido = expandidoId === questaoId;

  // Fecha o modal de imagem ao pressionar tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setImagemModal(null);
      }
    };
    if (imagemModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imagemModal]);

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

  // Modal Lightbox Render
  const renderLightbox = () => {
    if (!imagemModal) return null;
    return (
      <div
        className="questao-imagem-modal-backdrop"
        onClick={() => setImagemModal(null)}
        role="dialog"
        aria-modal="true"
      >
        <div className="questao-imagem-modal-content" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="questao-imagem-modal-close"
            onClick={() => setImagemModal(null)}
            aria-label="Fechar ampliação"
          >
            ✕
          </button>
          <img
            src={imagemModal.url}
            alt={imagemModal.alt || 'Imagem da questão'}
            className="questao-imagem-modal-img"
          />
          {imagemModal.alt && (
            <div className="questao-imagem-modal-caption">
              {imagemModal.alt}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isTextoLongoComLeitura) {
    return (
      <>
        <div className="question-text" style={{ fontSize: '1.08rem', lineHeight: '1.75' }}>
          <strong>Enunciado:</strong> {renderizarTextoComImagens(enunciado, setImagemModal)}
        </div>
        {renderLightbox()}
      </>
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

  // Versão resumida para quando a caixa estiver recolhida (substitui markdown de imagem por aviso amigável)
  const resumoTextoLeitura = textoLeitura
    .replace(/!\[(.*?)\]\(.*?\)/g, ' 🖼️ [$1] ')
    .replace(/\[IMAGEM:\s*[^\]|]+(?:\|\s*([^\]]+))?\]/g, ' 🖼️ [$1] ');

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

        {/* Texto limitado a no máximo 2 linhas quando fechado, ou completo e formatado quando expandido */}
        <div
          className={`leia-texto-content ${expandido ? 'expandido' : 'clamped-2-lines'}`}
          onClick={() => !expandido && setExpandidoId(questaoId)}
          title={!expandido ? 'Clique para expandir e ler o texto completo' : undefined}
        >
          {expandido
            ? renderizarTextoComImagens(textoLeitura, setImagemModal)
            : resumoTextoLeitura}
        </div>
      </div>

      {/* Comando específico da questão */}
      {comando ? (
        <div className="question-text" style={{ fontSize: '1.08rem', lineHeight: '1.75', marginTop: '1rem' }}>
          <strong>Enunciado:</strong> {renderizarTextoComImagens(comando, setImagemModal)}
        </div>
      ) : (
        !expandido && (
          <div className="leia-texto-hint-inline" onClick={() => setExpandidoId(questaoId)}>
            <span>👇 Clique na setinha acima para abrir o texto e o enunciado completo.</span>
          </div>
        )
      )}

      {renderLightbox()}
    </div>
  );
};

export default TextoEnunciado;
