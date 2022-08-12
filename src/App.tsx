import type { Component } from 'solid-js';

import styles from './styles/App.module.css';

const App: Component = () => {
  return (
    <main classList={{[styles.App]: true}}>
      <header class={styles.header}>
        <h1>elv lang</h1>
      </header>
    </main>
  );
};

export default App;
