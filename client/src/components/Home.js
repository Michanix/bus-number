import React from 'react';
const axios = require('axios');

export default class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            areas: []
        }
    }

    componentDidMount() {
        axios
            .get('http://localhost:8080/stopAreas')
            .then(res => {
                this.setState({
                    areas: res.data
                })
            })
            .catch(err => {
                this.setState({
                    err: err
                })
            })
    }

    render() {
        const areas = this.state.areas;
        const listAreas = areas.map(area => {
            return <option>{area}</option>
        });

        if (areas === []) {
            return (<p>No stop areas had been found.</p>);
        } else {
            return (
                <select>
                    {listAreas}
                </select>
            );
        }
    }
}