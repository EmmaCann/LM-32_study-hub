// User source is data for real Clang, never JavaScript evaluated by this worker.
let command;
self.onmessage = async ({ data }) => {
  const { id, code, standard, files = [] } = data;
  let diagnostics = '';
  try {
    if (!['c++11', 'c++14', 'c++17', 'c++20'].includes(standard))
      throw new Error('Standard non supportato');
    if (
      typeof code !== 'string' ||
      new TextEncoder().encode(code).length > 65536 ||
      files.length > 6
    )
      throw new Error('Sorgente troppo grande');
    const tree = { 'main.cpp': code };
    let size = new TextEncoder().encode(code).length;
    for (const file of files) {
      if (
        !/^[a-zA-Z][a-zA-Z0-9_-]*\.(cpp|h|hpp)$/.test(file.name) ||
        file.name === 'main.cpp' ||
        typeof file.content !== 'string'
      )
        throw new Error('File di supporto non ammesso');
      const fileBytes = new TextEncoder().encode(file.content).length;
      size += fileBytes;
      if (size > 131072 || fileBytes > 32768 || Object.hasOwn(tree, file.name))
        throw new Error('Limite file di supporto');
      tree[file.name] = file.content;
    }
    if (!command) {
      self.postMessage({
        id,
        phase: 'loading',
        message: 'Caricamento Clang e libreria standard (circa 100 MiB)…',
      });
      const toolchain = await import('./vendor/clang-22.0.0-git20542-10/bundle.js');
      command = toolchain.commands['clang++'];
      // Warm the immutable resources once; also reports actual download progress.
      await command(
        ['--version'],
        {},
        {
          stdout() {},
          stderr() {},
          fetchProgress({ totalLength, doneLength }) {
            self.postMessage({ id, phase: 'loading', total: totalLength, loaded: doneLength });
          },
        },
      );
    }
    self.postMessage({ id, phase: 'compiling', message: 'Compilazione C++ reale in corso…' });
    const result = await command(
      [
        'main.cpp',
        ...files.filter((f) => f.name.endsWith('.cpp')).map((f) => f.name),
        `-std=${standard}`,
        '-O0',
        '-Wall',
        '-Wextra',
        '-fno-exceptions',
        '-Wl,--max-memory=67108864',
        '-Wl,-z,stack-size=1048576',
        '-o',
        'program.wasm',
      ],
      tree,
      {
        stdout() {},
        stderr(bytes) {
          if (bytes) diagnostics = (diagnostics + new TextDecoder().decode(bytes)).slice(0, 65536);
        },
      },
    );
    const binary = result?.['program.wasm'];
    if (!(binary instanceof Uint8Array) || binary.length > 16777216)
      throw new Error('Il compilatore non ha prodotto un modulo valido');
    self.postMessage({ id, ok: true, diagnostics, binary }, [binary.buffer]);
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      diagnostics: diagnostics || String(error?.message || error),
    });
  }
};
