/* eslint-disable linebreak-style */
/* eslint-disable require-jsdoc */
/* eslint-disable react/prop-types */
import React from 'react';
import axios from 'axios';
import Grid from '@material-ui/core/Grid';
import CustomForm from './CustomForm';
import BussesGrid from './BussesGrid';
import ArrivalTimes from './ArrivalTimes';

import LocationCityIcon from '@material-ui/icons/LocationCity';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import ClearAllIcon from '@material-ui/icons/ClearAll';
import {Fab} from '@material-ui/core';

const instance = axios.create({
  baseURL: 'http://localhost:8080/api/v1/bus-stops/areas',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

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

function naturalSort(arr) {
  const collator = new Intl.Collator(
      undefined,
      {numeric: true, sensitivity: 'base'},
  );
  return arr.sort(collator.compare);
}

export default class StopAreaForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      area: '',
      stop: '',
      stops: [],
      busNumbers: [],
      arrivalTimes: [],
      errMsg: '',
    };

    this.handleAreaChange = this.handleAreaChange.bind(this);
    this.handleAreaSubmit = this.handleAreaSubmit.bind(this);
    this.handleStopChange = this.handleStopChange.bind(this);
    this.handleStopSubmit = this.handleStopSubmit.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.clearAll = this.clearAll.bind(this);
  }

  componentDidMount() {
    const {lat, lon} = this.props;
    const data = sendLoc('/closest', lat, lon);
    data.then((res) => {
      console.log(res.data);
      this.setState({
        area: res.data.area,
        stop: res.data.stop,
      });
    });
  }

  clearAll(event) {
    this.setState({
      area: '',
      stop: '',
      busNumbers: [],
      arrivalTimes: [],
    });
    event.preventDefault();
  }

  handleAreaChange(area) {
    this.setState({
      area: area,
      stop: '',
    });
  }

  handleAreaSubmit(event) {
    const area = this.state.area;
    if (!(area === '')) {
      const url = `/${area}`;
      const stops = fetchData(url);
      stops.then((data) => this.setState({
        stop: data.data[0],
        stops: data.data,
      }));
    }

    event.preventDefault();
  }

  handleStopChange(stop) {
    this.setState({
      stop: stop,
      busNumbers: [],
      arrivalTimes: [],
    });
  }

  handleStopSubmit(event) {
    const {area, stop} = this.state;
    if (area === '' || stop === '') {
      this.setState({
        busNumbers: [],
        arrivalTimes: [],
      });
    } else {
      const url = `/${area}/${stop}`;
      const busNumbers = fetchData(url);
      busNumbers.then((data) => {
        const numbers = naturalSort(data.data);
        this.setState({busNumbers: numbers});
      });
    }

    event.preventDefault();
  }

  handleClick(number) {
    const {area, stop} = this.state;
    const url = `/${area}/${stop}/${number}`;
    const arrivals = fetchData(url);
    arrivals.then((data) => {
      console.log(data.data);
      this.setState({arrivalTimes: data.data});
    });
  }

  render() {
    const {
      area,
      stop,
      stops,
      busNumbers,
      arrivalTimes,
      errMsg,
    } = this.state;
    const areas = this.props.areas;

    return (
      <div>
        <Grid container direction="column" justify="center" spacing={4}>
          <Grid item>
            <CustomForm
              label={'Area: '}
              value={area}
              values={areas}
              handleSubmit={this.handleAreaSubmit}
              handleChange={this.handleAreaChange}
              btnIcon={<LocationCityIcon />}/>
            {
              errMsg.length > 0 && <p>{errMsg}</p>
            }
          </Grid>
          <Grid item>
            <CustomForm
              label={'Stop: '}
              value={stop}
              values={stops}
              handleChange={this.handleStopChange}
              handleSubmit={this.handleStopSubmit}
              btnIcon={<LocationOnIcon />}
            />
          </Grid>
          <Grid item>
            <BussesGrid busses={busNumbers} handleClick={this.handleClick}/>
          </Grid>
          <Grid item>
            <ArrivalTimes times={arrivalTimes} />
          </Grid>
          <Grid item>
            <Fab
              color="secondary"
              size="medium"
              variant="extended"
              onClick={this.clearAll}>
              <ClearAllIcon />
                Clear All
            </Fab>
          </Grid>
        </Grid>
      </div>
    );
  }
}
