/* eslint-disable linebreak-style */
/* eslint-disable require-jsdoc */
import React from 'react';
import axios from 'axios';
import StopAreaForm from './StopAreaForm';

const instance = axios.create({
  baseURL: 'http://localhost:8080/api/v1/bus-stops',
});

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      areas: [],
      location: null,
      err: null,
    };
  }

  componentDidMount() {
    instance
        .get('/areas')
        .then((res) => {
          this.setState({
            areas: res.data,
          });
        })
        .catch((err) => {
          this.setState({
            err: err,
          });
        });

    axios.get('http://ip-api.com/json/?fields=status,message,lat,lon')
        .then((res) => this.setState({location: res.data}))
        .catch((err) => this.setState({err: err}));
  }

  render() {
    const areas = this.state.areas;
    return (
      <div>
        <StopAreaForm areas={areas} />
        <p>{this.state.location}</p>
      </div>
    );
  }
}
