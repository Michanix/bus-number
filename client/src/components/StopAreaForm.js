/* eslint-disable linebreak-style */
/* eslint-disable require-jsdoc */
import React from 'react';
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8080/api/v1/bus-stops',
});

function getOptions(arr) {
  const options = arr.map((el) => {
    // eslint-disable-next-line react/jsx-key
    return <option>{el}</option>;
  });
  return options;
}

async function fetchData(url) {
  instance.defaults.url = url;
  let data;
  try {
    data = await instance.get(url);
  } catch (err) {
    console.error(err);
  }
  return data;
}

export default class StopAreaForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      area: '',
      stop: '',
      stops: [],
      busNumbers: [],
      areas: [],
    };

    this.handleAreaChange = this.handleAreaChange.bind(this);
    this.handleAreaSubmit = this.handleAreaSubmit.bind(this);
    this.handleStopChange = this.handleStopChange.bind(this);
    this.handleStopSubmit = this.handleStopSubmit.bind(this);
  }

  handleAreaChange(event) {
    this.setState({area: event.target.value});
  }

  handleAreaSubmit(event) {
    const area = this.state.area;
    const url = '/areas/' + area + '/stops';
    const stops = fetchData(url);
    stops.then((data) => this.setState({stops: data.data}));
    event.preventDefault();
  }

  handleStopChange(event) {
    this.setState({stop: event.target.value});
  }

  handleStopSubmit(event) {
    const busStop = this.state.stop;
    const url = '/' + busStop + '/bus-numbers';
    const busNumbers = fetchData(url);
    busNumbers.then((data) => this.setState({busNumbers: data.data}));
    event.preventDefault();
  }


  render() {
    // eslint-disable-next-line react/prop-types
    const areasList = getOptions(this.props.areas);
    const stopsList = getOptions(this.state.stops);
    let busNumsList;

    if (this.state.busNumbers.length > 0) {
      busNumsList = this.state.busNumbers.map((num) => {
        // eslint-disable-next-line react/jsx-key
        return <button>{num}</button>;
      });
    } else {
      busNumsList = <p>No available buses.</p>;
    }

    return (
      <div>
        <form onSubmit={this.handleAreaSubmit}>
          <label>
                        Pick your area:
            <select value={this.state.area} onChange={this.handleAreaChange}>
              {areasList}
            </select>
          </label>
          <input type='submit' value='Submit' />
        </form>


        <form onSubmit={this.handleStopSubmit}>
          <label>
                        Pick your bus stop:
            <select value={this.state.stop} onChange={this.handleStopChange}>
              {stopsList}
            </select>
          </label>
          <input type='submit' value='Submit' />
        </form>
        {busNumsList}
      </div>

    );
  }
}
