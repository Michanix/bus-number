import React from 'react';
import axios from 'axios';

export default class StopAreaForm extends React.Component {
    constructor(props) {
        super(props);
        this.baseUrl = "http://localhost:8080/api/v1/bus-stops";
        this.state = {
            area: "",
            stop: "",
            stops: [],
            busNumbers: [],
        }

        this.handleAreaChange = this.handleAreaChange.bind(this);
        this.handleAreaSubmit = this.handleAreaSubmit.bind(this);
        this.handleStopChange = this.handleStopChange.bind(this);
        this.handleStopSubmit = this.handleStopSubmit.bind(this);
    }

    handleAreaChange(event) {
        this.setState({ area: event.target.value });
    }

    handleAreaSubmit(event) {
        const area = this.state.area;
        const url = this.baseUrl + "/areas/" + area + "/stops"
        axios
            .get(url)
            .then(res => this.setState({ stops: res.data }))
            .catch(err => console.log(err));
        event.preventDefault();
    }

    handleStopChange(event) {
        this.setState({ stop: event.target.value })
    }

    handleStopSubmit(event) {
        const busStop = this.state.stop;
        const url = this.baseUrl + "/" + busStop + "/bus-numbers";
        axios
            .get(url)
            .then(res => this.setState({ busNumbers: res.data }))
            .catch(err => console.log(err))
        event.preventDefault();
    }


    render() {
        const areasList = this.props.areas.map((area) => {
            return <option>{area}</option>
        })
        const stopsList = this.state.stops.map(stop => {
            return <option>{stop}</option>
        })
        let busNumsList;

        if (this.state.busNumbers.length > 0) {
            busNumsList = this.state.busNumbers.map(num => {
                return <button>{num}</button>
            })
        } else {
            busNumsList = <p>No available buses.</p>
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

        )
    }
}