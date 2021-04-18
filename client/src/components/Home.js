import React from 'react';
import axios from 'axios';

import StopAreaForm from './StopAreaForm';

export default class Home extends React.Component {
    constructor(props) {
        super(props);
        this.baseUrl = "http://localhost:8080/api/v1/stops";
        this.state = {
            areas: []
        }
    }

    componentDidMount() {
        axios
            .get(this.baseUrl + "/areas/")
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
        return (
            <StopAreaForm areas={areas} />
        );
    }
}