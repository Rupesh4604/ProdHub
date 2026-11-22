import React from 'react';

// Minimal, safe Markdown renderer for AI output: headings, bullet/numbered
// lists, **bold**, *italic*, `code`. Builds React elements (no innerHTML), so
// text from the model or from calendar event titles can never inject HTML.

function renderInline(text, keyPrefix) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyPrefix}-${i++}`;
    if (tok.startsWith('**')) parts.push(<strong key={key} className="text-white font-semibold">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) parts.push(<code key={key} className="bg-gray-700 px-1 rounded text-xs">{tok.slice(1, -1)}</code>);
    else parts.push(<em key={key}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function SimpleMarkdown({ text }) {
  const lines = (text || '').replace(/\r/g, '').split('\n');
  const blocks = [];
  let list = null; // { ordered, items }

  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag key={`l${blocks.length}`} className={`${list.ordered ? 'list-decimal' : 'list-disc'} pl-6 space-y-1 my-2`}>
        {list.items.map((it, idx) => (
          <li key={idx}>{renderInline(it, `li${blocks.length}-${idx}`)}</li>
        ))}
      </Tag>
    );
    list = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    const heading = line.match(/^(#{1,4})\s+(.*)$/);

    if (bullet || numbered) {
      const ordered = !!numbered;
      if (!list || list.ordered !== ordered) {
        flush();
        list = { ordered, items: [] };
      }
      list.items.push((bullet || numbered)[1]);
      return;
    }
    flush();
    if (!line) return;
    if (heading) {
      const size = heading[1].length <= 2 ? 'text-lg' : 'text-base';
      blocks.push(
        <h3 key={idx} className={`${size} font-bold text-white mt-4 mb-1`}>
          {renderInline(heading[2], `h${idx}`)}
        </h3>
      );
      return;
    }
    blocks.push(
      <p key={idx} className="my-2">
        {renderInline(line, `p${idx}`)}
      </p>
    );
  });
  flush();

  return <div className="text-gray-300 text-sm leading-relaxed">{blocks}</div>;
}
