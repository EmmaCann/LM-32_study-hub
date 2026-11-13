'use client';
import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  keymap,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import {
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language';
import { cpp } from '@codemirror/lang-cpp';
export function CppEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const initial = useRef(value);
  const change = useRef(onChange);
  useEffect(() => {
    change.current = onChange;
  }, [onChange]);
  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initial.current,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          cpp(),
          syntaxHighlighting(defaultHighlightStyle),
          highlightActiveLine(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          EditorView.contentAttributes.of({
            'aria-label': 'Codice C++',
            spellcheck: 'false',
            autocapitalize: 'off',
            autocorrect: 'off',
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) change.current(update.state.doc.toString());
          }),
          EditorView.theme({
            '&': { backgroundColor: 'var(--surface)', color: 'var(--ink)', fontSize: '14px' },
            '.cm-content': {
              fontFamily: 'ui-monospace, monospace',
              minHeight: '300px',
              padding: '12px 0',
              caretColor: 'var(--ink)',
            },
            '.cm-scroller': { overflow: 'auto', maxHeight: '650px' },
            '.cm-gutters': {
              backgroundColor: 'var(--bg)',
              color: 'var(--muted)',
              borderColor: 'var(--line)',
            },
            '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'var(--soft)' },
            '&.cm-focused .cm-cursor': { borderLeftColor: 'var(--ink)' },
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
  }, []);
  useEffect(() => {
    const editor = view.current;
    if (editor && value !== editor.state.doc.toString())
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
  }, [value]);
  return <div className="cpp-editor" ref={host} />;
}
