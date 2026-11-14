export function boundRatio(n: number) {
  if (!Number.isFinite(n) || n <= 0) throw Error('n deve essere positivo.');
  return 4 + 100 / n + 500 / (n * n);
}
export type RecurrenceConfig = { a: number; b: number; power: number; levels: number };
export function recurrenceTree(config: RecurrenceConfig) {
  const { a, b, power, levels } = config;
  if (
    ![1, 2, 3].includes(a) ||
    ![2, 3, 4].includes(b) ||
    ![1, 2].includes(power) ||
    ![1, 2, 3].includes(levels)
  )
    throw Error('Configurazione fuori dai limiti didattici.');
  const n = b ** levels;
  const nodes = Array.from({ length: levels + 1 }, (_, depth) =>
    Array.from({ length: a ** depth }, (_, index) => ({
      id: `r-${depth}-${index}`,
      depth,
      index,
      parent: depth ? `r-${depth - 1}-${Math.floor(index / a)}` : null,
      size: n / b ** depth,
      cost: depth === levels ? 1 : (n / b ** depth) ** power,
    })),
  ).flat();
  const costs = Array.from({ length: levels + 1 }, (_, depth) =>
    nodes.filter((node) => node.depth === depth).reduce((sum, node) => sum + node.cost, 0),
  );
  return { n, nodes, costs, total: costs.reduce((a, b) => a + b, 0), ratio: a / b ** power };
}
export function recurrencePosition(depth: number, index: number, a: number) {
  return { x: 45 + ((index + 0.5) * 810) / a ** depth, y: 70 + depth * 108 };
}
