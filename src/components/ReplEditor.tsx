import { createSignal, For, onMount } from "solid-js"
import { basicSetup, EditorView } from "codemirror"
import { ViewUpdate } from "@codemirror/view"

import "../styles/ReplEditor.scss"

function ReplEditor() {
  const [log, setLog] = createSignal(["test", "new"])
  
  const editorParent = <div class="editorParent"></div> as Element

  const updateLitener = (view: ViewUpdate) => {
    if (view.docChanged) {
      // TODO: Parse and evaluate, and update log
      // setProgram(view.state.doc.toString())
    }
  }

  onMount(() => {
    const defaultProgram = `def fib(n) [
  if (n <= 1) ret 1;
  ret fib(n - 1) + fib(n - 2);
]
fibonacci(5);\n`

    new EditorView({
      doc: defaultProgram,
      extensions: [
        basicSetup,
        EditorView.updateListener.of(updateLitener)
      ],
      parent: editorParent
    })

  })

  return (
    <section class="editorContainer">
      <div class="buttons">
        <button onClick={() => setLog([...log(), Math.random().toString()])}>Run</button>
        <button onClick={() => setLog([])}>Clear</button>
      </div>
      {editorParent}
      <section class="editorConsole">
        <For each={log()}>
          {item => <div>{item}</div>}
        </For>
      </section>
    </section>
  )
}

export default ReplEditor
