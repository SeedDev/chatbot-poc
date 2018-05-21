import React, { Component } from 'react';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      response: '',
      inputValue: ''
    }
    this.handleInputKeyPress = this.handleInputKeyPress.bind(this)
  }

  handleInputKeyPress (e) {
    if (e.key === 'Enter') {
      const input = e.target.value
      e.target.value = ''
      
      this.callApi(input)
        .then(res => this.setState({ response: res.fulfillmentText }))
        .catch(err => console.log(err));
    }
  }

  componentDidMount () {
  }

  callApi = async (input) => {
    console.log('input: ' + input)

    let data = {
      text: input
    }
    // The parameters we are gonna pass to the fetch function
    let fetchData = { 
        method: 'POST', 
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
    }

    let response
    try {
      response = await fetch('/api/hello', fetchData)
    }
    catch (ex) {
      console.log(ex.message)
    }
    const body = await response.json()
    console.log(body)
    if (response.status !== 200) throw Error(body.message);

    return body;
  };
  
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Cindi</h1>
        </header>
        <label>Input question</label>
        <input type="text" onKeyPress={this.handleInputKeyPress} />
        <p className="App-intro">
        {this.state.response}
        </p>
      </div>
    );
  }
}

export default App;
