import { WASI, File, OpenFile, ConsoleStdout } from './vendor/wasi-shim-0.4.2/index.js';
// Only stdin/stdout/stderr are exposed. No preopened directory, network or host APIs.
self.onmessage = async ({ data: { id, binary, stdin } }) => {
  let stdout = '',
    stderr = '',
    outputBytes = 0;
  const decoders = { stdout: new TextDecoder(), stderr: new TextDecoder() };
  try {
    if (
      !(binary instanceof Uint8Array) ||
      binary.length > 16777216 ||
      typeof stdin !== 'string' ||
      new TextEncoder().encode(stdin).length > 32768
    )
      throw new Error('Input non ammesso');
    const capture = (stream) => (bytes) => {
      outputBytes += bytes.length;
      if (outputBytes > 65536) throw new Error('Limite output di 64 KiB superato');
      const text = decoders[stream].decode(bytes, { stream: true });
      if (stream === 'stdout') stdout += text;
      else stderr += text;
    };
    const wasi = new WASI(
      ['program'],
      [],
      [
        new OpenFile(new File(new TextEncoder().encode(stdin))),
        new ConsoleStdout(capture('stdout')),
        new ConsoleStdout(capture('stderr')),
      ],
    );
    const programModule = await WebAssembly.compile(binary);
    const instance = await WebAssembly.instantiate(programModule, {
      wasi_snapshot_preview1: wasi.wasiImport,
    });
    const exitCode = wasi.start(instance);
    stdout += decoders.stdout.decode();
    stderr += decoders.stderr.decode();
    self.postMessage({ id, ok: exitCode === 0, exitCode, stdout, stderr, reason: 'exited' });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      exitCode: -1,
      stdout,
      stderr: stderr + '\n' + String(error?.message || error),
      reason: 'error',
    });
  }
};
