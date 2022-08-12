import { Component } from "solid-js"
import ReplEditor from "./components/ReplEditor"

import styles from "./styles/App.module.css"

const App: Component = () => {

  return (
    <main>
      <header class={styles.header}>
        <h1 class={styles.headerText}>Elv lang REPL</h1>
      </header>
      <ReplEditor />
    </main>
  );
};

export default App
