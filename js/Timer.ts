// Copyright 2019-2023, University of Colorado Boulder

/**
 * Timer so that other modules can run timing related code through the simulation's requestAnimationFrame. Use its
 * Emitter interface for adding/removing listeners.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import axon from './axon.js';
import TinyEmitter from './TinyEmitter.js';

export type TimerListener = ( dt: number ) => void;

export default class Timer extends TinyEmitter<[ number ]> {

  /**
   * Adds a listener to be called back once after the specified time in milliseconds
   * @param listener - called with no arguments
   * @param timeout in milliseconds
   * @returns an internally-wrapped listener which can be removed with clearTimeout
   */
  public setTimeout( listener: () => void, timeout: number ): TimerListener { // eslint-disable-line bad-sim-text
    let elapsed = 0;
    const callback = ( dt: number ) => {
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
   */
  public clearTimeout( listener: TimerListener ): void {
    if ( this.hasListener( listener ) ) {
      this.removeListener( listener );
    }
  }

  /**
   * Adds a listener to be called at specified intervals (in milliseconds)
   * @param listener - called with no arguments
   * @param interval - in milliseconds
   * @returns an internally-wrapped listener which can be removed with clearInterval
   */
  public setInterval( listener: () => void, interval: number ): TimerListener { // eslint-disable-line bad-sim-text
    let elapsed = 0;
    const callback = ( dt: number ) => {
      elapsed += dt;

      // Convert seconds to ms and see if item has timed out
      while ( elapsed * 1000 >= interval && this.hasListener( callback ) ) {
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
   */
  public clearInterval( listener: TimerListener ): void {
    if ( this.hasListener( listener ) ) {
      this.removeListener( listener );
    }
  }

  /**
   * Run a callback on the next frame. This method is largely for clarity.
   */
  public runOnNextTick( listener: () => void ): void {
    this.setTimeout( listener, 0 );
  }
}

axon.register( 'Timer', Timer );
