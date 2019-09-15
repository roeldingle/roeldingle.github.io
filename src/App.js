import React from 'react';
import './App.css';
import './Animate.css';
import { AwesomeButton, AwesomeButtonSocial } from "react-awesome-button";
import "react-awesome-button/dist/styles.css";
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';

function App() {

  return (
    <div className="App">
      <Container maxWidth="sm">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} className="column-left">
            <h1 className="title animated rubberBand">Roel Dingle</h1>
            <h3 className="subtitle animated fadeInUp delay-1s fast">Web Development</h3>
            <div className="social-wrap">
              <AwesomeButtonSocial type="linkedin" url="https://www.linkedin.com/in/roeldingle/"></AwesomeButtonSocial>&nbsp;
              <AwesomeButtonSocial type="messenger" url="http://m.me/roel.dingle/"></AwesomeButtonSocial>&nbsp;
              <AwesomeButtonSocial type="github" href="https://github.com/roeldingle" target="__blank"></AwesomeButtonSocial>
            </div>
          </Grid>
          <Grid item xs={12} sm={6}>
            <img alt="Roel" src="me.png" className="avatar animated zoomIn delay-2s fast" />
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}

export default App;
