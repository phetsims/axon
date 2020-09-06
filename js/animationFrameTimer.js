// Copyright 2020, University of Colorado Boulder

import TimerType from './TimerType.js';
import axon from './axon.js';

// Like timer but runs every frame whether the sim is active or not.
const animationFrameTimer = new TimerType( { parameters: [ { valueType: 'number' } ] } );

axon.register( 'animationFrameTimer', animationFrameTimer );
export default animationFrameTimer;