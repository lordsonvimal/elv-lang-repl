import { Component } from "solid-js"
import ReplEditor from "./components/ReplEditor"

import styles from "./styles/App.module.css"

const App: Component = () => {

  return (
    <>
      <header><h1 class={styles.headerText}>Elv lang REPL</h1></header>
      <ReplEditor />
    </>
  );
};

export default App
