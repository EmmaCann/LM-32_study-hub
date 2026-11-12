import type { Metadata } from 'next';
import { Shell } from '@/components/shell';
import 'katex/dist/katex.min.css';
import './globals.css';
import '../simulations/aos-visual.css';
export const metadata: Metadata = {
  title: { default: 'LM·32 Study Hub', template: '%s · LM·32' },
  description:
    'Uno spazio personale per appunti, simulazioni ed esercizi di Ingegneria Informatica.',
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t;try{t=localStorage.getItem('lm32-theme')}catch(e){}document.documentElement.dataset.theme=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'})()`,
          }}
        />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
