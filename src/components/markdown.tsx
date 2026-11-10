import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { codeToHtml } from 'shiki';
import { assetPath, type Manifest } from '@/lib/schema';
export async function Notes({ content, manifest }: { content: string; manifest: Manifest }) {
  const blocks = [...content.matchAll(/```(\w*)\n([\s\S]*?)```/g)];
  const highlighted = new Map<string, string>();
  for (const b of blocks) {
    const language = ['cpp', 'c', 'javascript', 'typescript', 'python', 'json', 'text'].includes(
      b[1],
    )
      ? b[1]
      : 'text';
    highlighted.set(
      b[2].replace(/\n$/, ''),
      await codeToHtml(b[2], { lang: language, theme: 'github-dark' }),
    );
  }
  let headingIndex = 0;
  return (
    <div className="prose">
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: 'error', trust: false }]]}
        skipHtml
        components={{
          h2: ({ children }) => <h2 id={`sezione-${++headingIndex}`}>{children}</h2>,
          pre: ({ children }) => <div className="code-container">{children}</div>,
          code: ({ children, className }) => {
            const code = String(children).replace(/\n$/, '');
            const html = highlighted.get(code);
            return html ? (
              <div className="highlight" dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <code className={className}>{children}</code>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href?.startsWith('assets/') ? assetPath(manifest, href.slice(7)) : href}
              rel={href?.startsWith('https:') ? 'noreferrer' : undefined}
            >
              {children}
            </a>
          ),
          // Static content images are validated package assets; no external image optimizer needed.
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                typeof src === 'string' && src.startsWith('assets/')
                  ? assetPath(manifest, src.slice(7))
                  : typeof src === 'string'
                    ? src
                    : undefined
              }
              alt={alt || ''}
              loading="lazy"
            />
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
