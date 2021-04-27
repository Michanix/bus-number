/* eslint-disable linebreak-style */
/* eslint-disable react/jsx-key */
/* eslint-disable require-jsdoc */
/* eslint-disable react/prop-types */
import {Button, ButtonGroup} from '@material-ui/core';
import React from 'react';

function chunk(arr, chunkSize) {
  const result = [];
  for (let i=0, len=arr.length; i<len; i+=chunkSize) {
    result.push(arr.slice(i, i+chunkSize));
  }
  return result;
}

export default class BussesGrid extends React.Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    this.props.handleClick(e.currentTarget.value);
    e.preventDefault();
  }

  render() {
    const {busses} = this.props;
    const busChunks = chunk(busses, 3);

    const renderBusGroups =
      busChunks.map((chunk) => {
        return (
          <ButtonGroup
            orientation="vertical"
            color="secondary"
            variant="contained"
            style={{margin: 5}}>
            {
              chunk.map((el) => {
                return (
                  <Button value={el} onClick={(e) => this.handleClick(e)}>
                    {el}
                  </Button>);
              })
            }
          </ButtonGroup>
        );
      });

    return (
      <div>
        {busChunks.length === 0 ? <p>No buses available.</p> :
        renderBusGroups
        }
      </div>
    );
  }
}
