import React from 'react';
import { AwesomeButtonSocial } from 'react-awesome-button';
import AwesomeButtonStyles from 'react-awesome-button/src/styles/styles.scss'
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <AwesomeButtonSocial cssModule={AwesomeButtonStyles} type="facebook">Button</AwesomeButtonSocial>
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
