/* eslint-disable linebreak-style */
/* eslint-disable require-jsdoc */
/* eslint-disable react/prop-types */
import React from 'react';
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8080/api/v1/bus-stops/areas',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

function getOptions(arr) {
  const options = arr.map((el) => {
    // eslint-disable-next-line react/jsx-key
    return <option>{el}</option>;
  });

  return options;
}

function getBusArray(arr, handleClick) {
  let result;
  if (arr.length > 0) {
    result = arr.map((el) => {
      // eslint-disable-next-line react/jsx-key
      return <button value={el} onClick={handleClick}>{el}</button>;
    });
  } else {
    result = <p>No available buses.</p>;
  }

  return result;
}

function getArrivalArr(arr) {
  let result;
  if (arr.length > 0) {
    result = arr.map((el) => {
      // eslint-disable-next-line react/jsx-key
      return <li>{el.arrival} {el.route}</li>;
    });
  }

  return result;
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

async function sendLoc(url, lat, lon) {
  let res;
  try {
    res = await instance
        .post(url, {
          lat: lat,
          lon: lon,
        });
  } catch (error) {
    console.error(error);
  }

  return res;
}

export default class StopAreaForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      area: '',
      stop: '',
      lat: this.props.lat,
      lon: this.props.lon,
      stops: [],
      busNumbers: [],
      areas: [],
      arrivalTimes: [],
    };

    this.handleAreaChange = this.handleAreaChange.bind(this);
    this.handleAreaSubmit = this.handleAreaSubmit.bind(this);
    this.handleStopChange = this.handleStopChange.bind(this);
    this.handleStopSubmit = this.handleStopSubmit.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    const {lat, lon} = this.state;
    const data = sendLoc('/closest', lat, lon);
    data.then((res) => {
      console.log(res.data);
      this.setState({
        area: res.data.area,
        stop: res.data.stop,
      });
    });
  }

  handleAreaChange(event) {
    this.setState({area: event.target.value});
  }

  handleAreaSubmit(event) {
    const area = this.state.area;
    const url = `/${area}`;
    const stops = fetchData(url);
    stops.then((data) => this.setState({stops: data.data}));
    event.preventDefault();
  }

  handleStopChange(event) {
    this.setState({stop: event.target.value});
  }

  handleStopSubmit(event) {
    const {area, stop} = this.state;
    const url = `/${area}/${stop}`;
    const busNumbers = fetchData(url);
    busNumbers.then((data) => {
      this.setState({busNumbers: data.data});
    });
    event.preventDefault();
  }

  handleClick(event, idx) {
    const {area, stop} = this.state;
    const number = event.target.value;
    const url = `/${area}/${stop}/${number}`;
    const arrivals = fetchData(url);
    arrivals.then((data) => {
      console.log(data.data);
      this.setState({arrivalTimes: data.data});
    });
    event.preventDefault();
  }

  render() {
    const {stops, busNumbers, arrivalTimes} = this.state;
    const areasList = getOptions(this.props.areas);
    const stopsList = getOptions(stops);
    const busNumsList = getBusArray(busNumbers,
        this.handleClick);
    const times = getArrivalArr(arrivalTimes);
    /* Add conditional rendering */

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
        {times}
      </div>
    );
  }
}
