import type { z } from 'zod';
import type { cppTestSchema } from './schema';
export type CppTest = z.infer<typeof cppTestSchema>;
export type RunResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  reason: 'exited' | 'timeout' | 'error';
};
export function compareOutput(actual: string, expected: string, mode: CppTest['comparison']) {
  if (mode === 'exact') return actual === expected;
  const normalize = (s: string) => s.replace(/\r\n/g, '\n').trim();
  if (mode === 'trim') return normalize(actual) === normalize(expected);
  return normalize(actual).split(/\s+/).join(' ') === normalize(expected).split(/\s+/).join(' ');
}
export function passesTest(result: RunResult, test: CppTest) {
  return (
    result.reason === 'exited' &&
    result.exitCode === test.exitCode &&
    compareOutput(result.stdout, test.stdout, test.comparison) &&
    compareOutput(result.stderr, test.stderr, test.comparison)
  );
}
