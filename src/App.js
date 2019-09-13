import React from 'react';
import { AwesomeButton } from "react-awesome-button";
import "react-awesome-button/dist/styles.css";
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <AwesomeButton type="primary">Button</AwesomeButton>
        <p>
          Roel Dingle
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
