// Copyright 2020-2026, University of Colorado Boulder
// @author Sam Reid (PhET Interactive Simulations)

import Timer from './Timer.js';

// Like stepTimer but runs every frame whether the sim is active or not.
const animationFrameTimer = new Timer();

export default animationFrameTimer;
