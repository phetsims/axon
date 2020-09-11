// Copyright 2020, University of Colorado Boulder

import TimerType from './TimerType.js';
import axon from './axon.js';

// Register and return a singleton timer. Only runs when the sim is active, during the step. For a timer that runs even
// when the sim is inactive, see animationFrameTimer
const stepTimer = new TimerType( { parameters: [ { valueType: 'number' } ] } );

axon.register( 'stepTimer', stepTimer );
export default stepTimer;