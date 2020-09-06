// Copyright 2020, University of Colorado Boulder

import TimerType from './TimerType.js';
import axon from './axon.js';

// Register and return a singleton timer. Only runs when the sim is active.  For a timer that runs even when the sim
// is inactive], see animationFrameTimer
const timer = new TimerType( { parameters: [ { valueType: 'number' } ] } );

axon.register( 'timer', timer );
export default timer;