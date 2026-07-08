import React from 'react';

const MarkdownRenderer = ({ markdown }) => {
  if (!markdown) return null;

  // Simple custom parser for basic CP-review markdown
  const parseMarkdown = (text) => {
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeContent = [];
    let codeLanguage = '';
    const elements = [];

    lines.forEach((line, index) => {
      // 1. Handle Code Blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // Closing code block
          elements.push(
            <pre 
              key={`code-${index}`} 
              style={{
                background: 'var(--pre-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.8rem 1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                overflowX: 'auto',
                marginBottom: '1.25rem',
                color: 'var(--text-primary)',
                whiteSpace: 'pre'
              }}
            >
              <code>{codeContent.join('\n')}</code>
            </pre>
          );
          codeContent = [];
          inCodeBlock = false;
        } else {
          // Opening code block
          codeLanguage = line.trim().slice(3);
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return;
      }

      // 2. Handle Headers
      if (line.trim().startsWith('###')) {
        elements.push(
          <h4 key={index} style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '1.25rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
            {parseInlineMarkup(line.trim().slice(3).trim())}
          </h4>
        );
        return;
      }
      if (line.trim().startsWith('##')) {
        elements.push(
          <h3 key={index} style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
            {parseInlineMarkup(line.trim().slice(2).trim())}
          </h3>
        );
        return;
      }
      if (line.trim().startsWith('#')) {
        elements.push(
          <h2 key={index} style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '1.75rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
            {parseInlineMarkup(line.trim().slice(1).trim())}
          </h2>
        );
        return;
      }

      // 3. Handle Lists
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        elements.push(
          <li key={index} style={{ marginLeft: '1.25rem', marginBottom: '0.35rem', fontSize: '0.92rem', listStyleType: 'disc', color: 'var(--text-primary)' }}>
            {parseInlineMarkup(line.trim().slice(1).trim())}
          </li>
        );
        return;
      }

      // 4. Empty Lines
      if (line.trim() === '') {
        return;
      }

      // 5. Standard Paragraphs
      elements.push(
        <p key={index} style={{ fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          {parseInlineMarkup(line)}
        </p>
      );
    });

    return elements;
  };

  // Helper to parse bold (**bold**) and inline code (`code`) markup
  const parseInlineMarkup = (text) => {
    const parts = [];
    let currentIndex = 0;
    
    // Regex matching bold markers or backtick code markers
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const token = match[0];

      // Add text leading up to the token
      if (matchIndex > currentIndex) {
        parts.push(text.slice(currentIndex, matchIndex));
      }

      if (token.startsWith('**') && token.endsWith('**')) {
        // Bold
        parts.push(
          <strong key={matchIndex} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        // Inline code
        parts.push(
          <code 
            key={matchIndex} 
            style={{
              background: 'var(--pre-bg)',
              color: 'var(--primary)',
              padding: '0.15rem 0.3rem',
              borderRadius: '3px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              border: '1px solid var(--border)'
            }}
          >
            {token.slice(1, -1)}
          </code>
        );
      }

      currentIndex = regex.lastIndex;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.slice(currentIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div style={{ wordBreak: 'break-word' }}>
      {parseMarkdown(markdown)}
    </div>
  );
};

export default MarkdownRenderer;
