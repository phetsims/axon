// Copyright 2019-2021, University of Colorado Boulder

/**
 * timer that calls a set of registered callbacks.
 * Utilizes AXON/timer, but provides a higher level of abstraction, hiding the details of managing the timer.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import merge from '../../phet-core/js/merge.js';
import axon from './axon.js';
import stepTimer from './stepTimer.js';

class CallbackTimer {

  /**
   * @param {Object} [options]
   * @constructor
   */
  constructor( options ) {

    options = merge( {
      callback: null, // {function} convenience for adding 1 callback
      delay: 400, // {number} start to fire continuously after pressing for this long (milliseconds)
      interval: 100 // {number} fire continuously at this interval (milliseconds)
    }, options );

    // validate options
    assert && assert( options.delay >= 0, `bad value for delay: ${options.delay}` );
    assert && assert( options.interval > 0, `bad value for interval: ${options.interval}` );

    this.delay = options.delay; // @private
    this.interval = options.interval; // @private

    this.callbacks = []; // @private
    if ( options.callback ) { this.callbacks.push( options.callback ); }

    this.delayID = null; // @private identifier for timer associated with the initial delay
    this.intervalID = null; // @private identifier for timer associates with the continuous interval
    this.fired = false;  // @private has the timer fired since it was started?
  }

  // @public Is the timer running?
  isRunning() {
    return ( this.delayID !== null || this.intervalID !== null );
  }

  // @public Starts the timer.
  start() {
    if ( !this.isRunning() ) {
      this.fired = false;
      this.delayID = stepTimer.setTimeout( () => {
        this.delayID = null;
        this.intervalID = stepTimer.setInterval( () => this.fire(), this.interval );

        // fire after scheduling the intervalID, so that isRunning will be true for callbacks, see sun#216
        this.fire();
      }, this.delay );
    }
  }

  /**
   * Stops the timer.
   * @param {boolean} fire - should we fire if we haven't fired already?
   * @public
   */
  stop( fire ) {
    if ( this.isRunning() ) {
      if ( this.delayID ) {
        stepTimer.clearTimeout( this.delayID );
        this.delayID = null;
      }
      if ( this.intervalID ) {
        stepTimer.clearInterval( this.intervalID );
        this.intervalID = null;
      }
      if ( fire && !this.fired ) {
        this.fire();
      }
    }
  }

  // @public Adds a {function} callback.
  addCallback( callback ) {
    if ( this.callbacks.indexOf( callback ) === -1 ) {
      this.callbacks.push( callback );
    }
  }

  // @public Removes a {function} callback.
  removeCallback( callback ) {
    const index = this.callbacks.indexOf( callback );
    if ( index !== -1 ) {
      this.callbacks.splice( index, 1 );
    }
  }

  /**
   * Calls all callbacks.
   * Clients are free to call this when the timer is not running.
   * @public
   */
  fire() {
    const callbacksCopy = this.callbacks.slice( 0 );
    for ( let i = 0; i < callbacksCopy.length; i++ ) {
      callbacksCopy[ i ]();
    }
    this.fired = true;
  }

  /**
   * @public
   */
  dispose() {
    this.stop( false );
    this.callbacks.length = 0;
  }
}

axon.register( 'CallbackTimer', CallbackTimer );

export default CallbackTimer;