import { createSignal, For, onMount } from "solid-js"
import { basicSetup, EditorView } from "codemirror"
import { ViewUpdate } from "@codemirror/view"
import { elv, isNil, parser, Scope } from "../lib/elv-lang.es.js"
import "../styles/ReplEditor.scss"

function getGlobalScope(logger: Function) {
  return new Scope({
    print(...args) {
      logger(...args)
    },
    printToConsole(...args) { console.log(...args) }
  })
}

const sampleProgram = `def fib(n) [
  if (n <= 1) [ret 1;]
  ret fib(n - 1) + fib(n - 2);
]
var recFib = fib(5);

def fibo(n) [
  var n1 = 0;
  var n2 = 1;
  var temp = 1;
  var i = 0;
  for (i = 0; i < n; i = i + 1) [
    temp = n1 + n2;
    n1 = n2;
    n2 = temp;
  ]
  ret n2;
]

var loopFib = fibo(5);

print(recFib);
print(loopFib);
`

function ReplEditor() {
  const [log, setLog] = createSignal([] as any[])
  const [program, setProgram] = createSignal(sampleProgram)
  
  const editorParent = <div class="editorParent"></div> as Element

  const updateLitener = (view: ViewUpdate) => {
    if (view.docChanged) {
      setProgram(view.state.doc.toString())
    }
  }

  const logger = (...args: any[]) => {
    let parsedRes = ""
    args.forEach((res: any) => {
      if (isNil(res) || res === undefined || res === null) parsedRes += "nil"
      else if (typeof res === "string") parsedRes += res
      else if (Array.isArray(res)) parsedRes += res.join(",")
      else if (res === false) parsedRes += "false"
      else if (res === true) parsedRes += "true"
      else parsedRes += `${res}`
    })
    const logs = [...log(), parsedRes]
    setLog(logs)
  }

  const runProgram = () => {
    try {
      const ast = parser(program())
      const globals = getGlobalScope(logger)
      const res = elv(ast, globals)
      logger(res)
    } catch(e: any) {
      logger(e.message)
    }
  }

  onMount(() => {

    new EditorView({
      doc: program(),
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
        <button onClick={runProgram}>Run</button>
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
