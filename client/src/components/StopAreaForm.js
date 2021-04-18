import React from 'react';
import axios from 'axios';

export default class StopAreaForm extends React.Component {
    constructor(props) {
        super(props);
        this.baseUrl = "http://localhost:8080/api/v1/stops";
        this.state = {
            area: "",
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({area: event.target.value});
    }

    handleSubmit(event) {
        const area = this.state.area;
        axios
        .post(this.baseUrl + "/areas/", {
            area: area,
        })
        .then(res => console.log(res))
        .catch(err => console.log(err));
    }

    render() {
        const areasList = this.props.areas.map((area) => {
            return <option>{area}</option>
        })

        return (
            <form onSubmit={this.handleSubmit}>
                <label>
                    Pick you area: 
                    <select value={this.state.area} onChange={this.handleChange}>
                        {areasList}
                    </select>
                </label>
                <input type='submit' value='Submit' />
            </form>
        )
    }
}