// Copyright 2020, University of Colorado Boulder

import Timer from './Timer.js';
import axon from './axon.js';

// Like timer but runs every frame whether the sim is active or not.
const animationFrameTimer = new Timer( { parameters: [ { valueType: 'number' } ] } );

axon.register( 'animationFrameTimer', animationFrameTimer );
export default animationFrameTimer;