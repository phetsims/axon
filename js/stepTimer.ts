// Copyright 2020-2022, University of Colorado Boulder

import axon from './axon.js';
import Timer from './Timer.js';

/**
 * Register and return a singleton timer, which can be used to schedule events. This ticks under the following circumstances:
 * 1) When a JOIST/Sim is active, during the step event
 * 2) In various accessibility tests that require timing
 * 3) In SCENERY/Display's animation loop, which is run by various test and example HTML files
 *
 * In order to run an event when a simulation is inactive and not stepping, see animationFrameTimer.
 *
 * Listeners added with addListener are called with a {number} dt argument (in seconds) via timer.emit in
 * Sim.stepSimulation. Listeners added with setTimeout/setInterval are called with no arguments. This is not specific
 * to the running screen, it is global across all screens.
 */
const stepTimer = new Timer();

axon.register( 'stepTimer', stepTimer );
export default stepTimer;