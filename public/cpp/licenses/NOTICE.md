# C++ Playground — licenze e provenienza

Toolchain: @yowasp/clang 22.0.0-git20542-10, pubblicata il 12 marzo 2026.
Clang e LLD sono compilatori LLVM reali compilati in WebAssembly.

- YoWASP Clang wrapper: Apache-2.0 secondo LICENSE.txt upstream (il campo ISC del manifesto npm è inesatto). Sorgente: https://github.com/YoWASP/clang/tree/944dd7c774954180e621cc8e12984023a7f8bcbe ; progetto migrato a https://codeberg.org/YoWASP/clang . Testo: YoWASP-Apache-2.0.txt.
- LLVM/Clang/LLD e libc++: Apache-2.0 con LLVM exception e licenze storiche indicate nei testi LLVM.txt e libcxx.txt. Sorgente: https://github.com/YoWASP/llvm-project/tree/97196c8eeb1d495fa43bb8af2fb26af5ef5b89fb .
- WASI libc: revision ac020b86fd44bafe60aa4fa12f407d16e3731329, licenze Apache-2.0 con LLVM exception / Apache-2.0 / MIT, con componenti BSD e CC0. Testi e attribuzioni: wasi-libc.txt e file wasi-* di questa directory. Fonti: https://github.com/WebAssembly/wasi-libc/tree/ac020b86fd44bafe60aa4fa12f407d16e3731329 . Le porzioni emmalloc e dlmalloc mantengono i rispettivi avvisi upstream.
- YoWASP JavaScript runtime 11.0.67: ISC, testo yowasp-runtime-ISC.txt; https://github.com/YoWASP/runtime-js .
- browser_wasi_shim 0.4.2: MIT oppure Apache-2.0, testi wasi-shim-*; https://github.com/bjorn3/browser_wasi_shim .
- CodeMirror e Lezer: MIT; testi codemirror-* e lezer-*; https://codemirror.net/ e https://lezer.codemirror.net/ .

I file della toolchain sono copiati senza modifiche dal pacchetto npm fissato in package-lock.json (integrità verificata da npm). public/cpp/vendor/manifest.json contiene dimensioni e SHA-256 degli asset serviti. I worker di integrazione e i limiti sono codice del progetto Study Hub. Nessuna licenza dei materiali universitari viene trasferita: tali materiali non sono distribuiti qui.
