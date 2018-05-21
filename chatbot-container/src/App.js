import React, { Component } from 'react'
import logo from './logo.svg'
import './App.css'
import Iframe from 'react-iframe'

class App extends Component {
  render () {
    return (
      <div className='App'>
        <header className='App-header'>
          <img src={logo} className='App-logo' alt='logo' />
          <h1 className='App-title'>Citi test portal</h1>
        </header>
        <Iframe
          url='http://localhost:3000/'
          // url='http://www.youtube.com/embed/xDMP3i36naA'
          width='450px'
          height='450px'
          id='myId'
          className='myClassname'
          display='initial'
          position='relative'
          allowFullScreen />
      </div>
    )
  }
}

export default App
