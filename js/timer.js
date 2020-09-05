// Copyright 2019-2020, University of Colorado Boulder

import TimerType from './TimerType.js';
import axon from './axon.js';

// Register and return a singleton.  Pauses when the sim is inactive.
const timer = new TimerType( { parameters: [ { valueType: 'number' } ] } );

axon.register( 'timer', timer );
export default timer;