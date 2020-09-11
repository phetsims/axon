// Copyright 2020, University of Colorado Boulder

import Timer from './Timer.js';
import axon from './axon.js';

// Register and return a singleton timer. Only runs when the sim is active, during the step. For a timer that runs even
// when the sim is inactive, see animationFrameTimer
const stepTimer = new Timer( { parameters: [ { valueType: 'number' } ] } );

axon.register( 'stepTimer', stepTimer );
export default stepTimer;