// Copyright 2019-2020, University of Colorado Boulder

/**
 * TimerType so that other modules can run timing related code through the simulation's requestAnimationFrame. Use its
 * Emitter interface for adding/removing listeners.
 *
 * Listeners added with addListener are called with a {number} dt argument (in seconds)
 * via timer.emit1 in Sim.stepSimulation.
 * Listeners added with setTimeout/setInterval are called with no arguments.
 *
 * Note: this is not specific to the running screen, it is global across all screens.
 * Moved from PHET_CORE on Feb 4, 2019
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import axon from './axon.js';
import TinyEmitter from './TinyEmitter.js';

class TimerType extends TinyEmitter {

  /**
   * Adds a listener to be called back once after the specified time in milliseconds
   * @param {function} listener - called with no arguments
   * @param {number} timeout in milliseconds
   * @returns {function} an internally-wrapped listener which can be removed with clearTimeout
   * @public
   */
  setTimeout( listener, timeout ) { // eslint-disable-line bad-sim-text
    let elapsed = 0;
    const callback = dt => {
      elapsed += dt;

      // Convert seconds to ms and see if item has timed out
      if ( elapsed * 1000 >= timeout ) {

        // make sure that this callback hasn't already been removed by another listener while emit() is in progress
        if ( this.hasListener( callback ) ) {
          listener();
          this.removeListener( callback );
        }
      }
    };
    this.addListener( callback );

    // Return the callback so it can be removed with removeStepListener
    return callback;
  }

  /**
   * Clear a scheduled timeout. If there was no timeout, nothing is done.
   * @param {function} listener
   * @public
   */
  clearTimeout( listener ) {
    if ( this.hasListener( listener ) ) {
      this.removeListener( listener );
    }
  }

  /**
   * Adds a listener to be called at specified intervals (in milliseconds)
   * @param {function} listener - called with no arguments
   * @param {number} interval - in milliseconds
   * @returns {function} an internally-wrapped listener which can be removed with clearInterval
   * @public
   */
  setInterval( listener, interval ) { // eslint-disable-line bad-sim-text
    let elapsed = 0;
    const callback = dt => {
      elapsed += dt;

      // Convert seconds to ms and see if item has timed out
      while ( elapsed * 1000 >= interval && this.hasListener( callback ) !== -1 ) {
        listener();
        elapsed = elapsed - interval / 1000.0; // Save the leftover time so it won't accumulate
      }
    };
    this.addListener( callback );

    // Return the callback so it can be removed with removeListener
    return callback;
  }

  /**
   * Clear a scheduled interval. If there was no interval, nothing is done.
   * @param {function} listener
   * @public
   */
  clearInterval( listener ) {
    if ( this.hasListener( listener ) ) {
      this.removeListener( listener );
    }
  }

  /**
   * Run a callback on the next frame. This method is largely for clarity.
   * @public
   * @param {function()} listener
   */
  runOnNextFrame( listener ) {
    this.setTimeout( listener, 0 );
  }
}

// Register and return a singleton
const timer = new TimerType( { parameters: [ { valueType: 'number' } ] } );

// This timer always runs even if the sim is paused or not active
// timer.animationFrameTimer = new TimerType( { parameters: [ { valueType: 'number' } ] } );

axon.register( 'timer', timer );
export default timer;