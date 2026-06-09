// Shared helpers for block components.

import Markdoc from '@markdoc/markdoc';

export function toPublicUrl(libraryPath?: string): string | undefined {
  if (!libraryPath) return undefined;
  if (libraryPath.startsWith('public/')) {
    return `/${libraryPath.slice('public/'.length)}`;
  }
  return undefined;
}

// Resolve an image reference, preferring uploaded files over library paths,
// matching the precedence used by all hardcoded pages.
export function resolveImage(value: {
  image?: string | null;
  imageLibraryPath?: string | null;
  backgroundImage?: string | null;
  backgroundImageLibraryPath?: string | null;
}): string | undefined {
  return (
    value.image ||
    value.backgroundImage ||
    toPublicUrl(value.imageLibraryPath || undefined) ||
    toPublicUrl(value.backgroundImageLibraryPath || undefined) ||
    undefined
  );
}

// Render a Keystatic document tree to an HTML string. Used by RichText / TwoColumn
// blocks so we don't need to hydrate a React renderer.
type DocNode = {
  type?: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  children?: DocNode[];
  href?: string;
  level?: number;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderInline(node: DocNode): string {
  if (typeof node.text === 'string') {
    let html = escapeHtml(node.text);
    if (node.bold) html = `<strong>${html}</strong>`;
    if (node.italic) html = `<em>${html}</em>`;
    if (node.underline) html = `<u>${html}</u>`;
    if (node.code) html = `<code>${html}</code>`;
    return html;
  }
  const inner = (node.children || []).map(renderInline).join('');
  if (node.type === 'link' && node.href) {
    const href = escapeHtml(node.href);
    const isExternal = /^https?:\/\//i.test(node.href);
    const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${href}"${attrs}>${inner}</a>`;
  }
  return inner;
}

function renderBlock(node: DocNode): string {
  const children = (node.children || []).map(renderInline).join('');
  switch (node.type) {
    case 'heading': {
      const level = Math.min(Math.max(node.level || 2, 1), 6);
      return `<h${level}>${children}</h${level}>`;
    }
    case 'paragraph':
      return `<p>${children}</p>`;
    case 'blockquote':
      return `<blockquote>${(node.children || []).map(renderBlock).join('')}</blockquote>`;
    case 'unordered-list':
      return `<ul>${(node.children || []).map(renderBlock).join('')}</ul>`;
    case 'ordered-list':
      return `<ol>${(node.children || []).map(renderBlock).join('')}</ol>`;
    case 'list-item':
      return `<li>${children}</li>`;
    case 'divider':
      return `<hr />`;
    case 'code':
      return `<pre><code>${children}</code></pre>`;
    default:
      return `<p>${children}</p>`;
  }
}

export function renderDocumentToHtml(doc: unknown): string {
  if (!doc) return '';
  if (typeof doc === 'string') return `<p>${escapeHtml(doc)}</p>`;
  const nodes: DocNode[] = Array.isArray(doc)
    ? (doc as DocNode[])
    : Array.isArray((doc as { document?: DocNode[] }).document)
      ? ((doc as { document?: DocNode[] }).document as DocNode[])
      : [];
  return nodes.map(renderBlock).join('');
}

// Render Keystatic's fields.markdoc.inline value to HTML.
// On disk, Keystatic stores the markdoc content as a raw markdown string in the
// JSON (despite the in-memory `{ node: MarkdocNode }` type Keystatic exposes
// for the live editor). We parse the markdown to an AST then render to HTML.
// Falls back to empty string if missing or malformed so the block degrades
// cleanly instead of crashing the page.
export function renderMarkdocToHtml(content: unknown): string {
  if (!content) return '';
  try {
    if (typeof content === 'string') {
      const ast = Markdoc.parse(content);
      return Markdoc.renderers.html(Markdoc.transform(ast));
    }
    if (typeof content === 'object') {
      const node = (content as { node?: unknown }).node;
      if (node) {
        return Markdoc.renderers.html(
          Markdoc.transform(node as Parameters<typeof Markdoc.transform>[0])
        );
      }
    }
    return '';
  } catch {
    return '';
  }
}
