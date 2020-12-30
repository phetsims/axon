// Copyright 2020, University of Colorado Boulder

import axon from './axon.js';
import Timer from './Timer.js';

// Like stepTimer but runs every frame whether the sim is active or not.
const animationFrameTimer = new Timer( { parameters: [ { valueType: 'number' } ] } );

axon.register( 'animationFrameTimer', animationFrameTimer );
export default animationFrameTimer;