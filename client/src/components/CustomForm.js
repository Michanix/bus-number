/* eslint-disable linebreak-style */
/* eslint-disable react/jsx-key */
/* eslint-disable require-jsdoc */
/* eslint-disable react/prop-types */
import React from 'react';
import {
  TextField,
  InputLabel,
  Button,
  Grid} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';


export default class CustomForm extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(value) {
    this.props.handleChange(value);
  }

  render() {
    const {
      label,
      value,
      values,
      handleSubmit,
      btnIcon} = this.props;

    return (
      <div>
        <Grid container direction="row"
          justify="center" alignItems="center" spacing={6}>
          <Grid item>
            <InputLabel>{label}</InputLabel>
          </Grid>
          <Grid item>
            <Autocomplete
              value={value}
              onChange={(e, v) => this.handleChange(v)}
              options={values}
              style={{width: 300}}
              renderInput={
                (params) =>
                  <TextField {...params}
                    variant="outlined" />}
            />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="secondary"
              startIcon={btnIcon}
              onClick={handleSubmit}>
                Submit
            </Button>
          </Grid>
        </Grid>
      </div>
    );
  }
}
