// Copyright 2020-2022, University of Colorado Boulder

import axon from './axon.js';
import Timer from './Timer.js';

// Like stepTimer but runs every frame whether the sim is active or not.
const animationFrameTimer = new Timer();

axon.register( 'animationFrameTimer', animationFrameTimer );
export default animationFrameTimer;