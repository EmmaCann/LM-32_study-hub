import Link from 'next/link';
export function CppNavigation() {
  return (
    <nav className="cpp-navigation" aria-label="C++">
      <Link href="/cpp">Materia C++</Link>
      <Link href="/cpp/esercitazioni">Esercitazioni</Link>
      <Link href="/cpp/playground">Playground libero</Link>
      <Link href="/cpp/simulazioni">Simulazioni interattive</Link>
    </nav>
  );
}
