import { CppPlayground } from '@/components/cpp-playground';
import { CppNavigation } from '@/components/cpp-navigation';
import { PageHeading } from '@/components/catalog';
import './playground.css';
export const metadata = { title: 'C++ Playground' };
export default function PlaygroundPage() {
  return (
    <>
      <CppNavigation />
      <PageHeading
        eyebrow="PROGRAMMA NEL BROWSER"
        title="C++ Playground"
        description="Editor, compilatore reale e console. Inizia con il Playground libero o scegli un’esercitazione."
      />
      <CppPlayground />
    </>
  );
}
