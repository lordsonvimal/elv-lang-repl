import { onMount } from "solid-js"
import { basicSetup, EditorView } from "codemirror"
import { javascript } from "@codemirror/lang-javascript"

import "../styles/ReplEditor.scss"

function ReplEditor() {
  
  const editorParent = <div class="editorParent"></div>

  onMount(() => {
    new EditorView({
      doc: "console.log('hello')\n",
      extensions: [basicSetup, javascript()],
      parent: editorParent
    })
  })

  return <section class="editorContainer">{editorParent}</section>;
}

export default ReplEditor
