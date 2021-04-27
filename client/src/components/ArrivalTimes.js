/* eslint-disable linebreak-style */
/* eslint-disable react/jsx-key */
/* eslint-disable require-jsdoc */
/* eslint-disable react/prop-types */
import React from 'react';

import DepartureBoardIcon from '@material-ui/icons/DepartureBoard';
import {
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon} from '@material-ui/core';

export default class ArrivalTimes extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {times} = this.props;

    return (
      <div>
        {
          times.length == 0 ? <p>Timetable not available.</p> :
          <Grid container direction="column"
            justify="center" alignContent="center">
            <Grid item xs>
              <Typography variant="h6">
            Closest arrival times
              </Typography>
              <List>
                {
                  times.map((val) => {
                    return (
                      <ListItem>
                        <ListItemIcon>
                          <DepartureBoardIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={val.arrival}
                          secondary={val.route}/>
                      </ListItem>
                    );
                  })
                }
              </List>
            </Grid>
          </Grid>
        }
      </div>
    );
  }
}
