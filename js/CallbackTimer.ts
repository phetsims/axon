// Copyright 2019-2022, University of Colorado Boulder

/**
 * CallbackTimer is a timer that calls a set of registered callbacks.
 * It utilizes AXON/stepTimer, but provides a higher level of abstraction, hiding the details of managing stepTimer.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import optionize from '../../phet-core/js/optionize.js';
import StrictOmit from '../../phet-core/js/types/StrictOmit.js';
import axon from './axon.js';
import stepTimer from './stepTimer.js';
import { TimerListener } from './Timer.js';

export type CallbackTimerCallback = () => void;

type SelfOptions = {

  // convenience for adding 1 callback
  callback?: CallbackTimerCallback;

  // start to fire continuously after pressing for this long, in ms
  delay?: number;

  // fire continuously at this interval, in ms
  interval?: number;
};

export type CallbackTimerOptions = SelfOptions;

export default class CallbackTimer {

  private readonly callbacks: CallbackTimerCallback[];

  // initial delay between when start is called and the timer first fires, in ms
  private readonly delay: number;

  // fire the timer at this continuous interval, in ms
  private readonly interval: number;

  // identifier for timer associated with the initial delay
  private delayID: TimerListener | null;

  // identifier for timer associated with the continuous interval
  private intervalID: TimerListener | null;

  // has the timer fired since it was started?
  private fired: boolean;

  public constructor( providedOptions?: CallbackTimerOptions ) {

    const options = optionize<CallbackTimerOptions, StrictOmit<SelfOptions, 'callback'>>()( {
      delay: 400,
      interval: 100
    }, providedOptions );

    // validate options
    assert && assert( options.delay >= 0, `bad value for delay: ${options.delay}` );
    assert && assert( options.interval > 0, `bad value for interval: ${options.interval}` );

    this.delay = options.delay;
    this.interval = options.interval;

    this.callbacks = [];
    if ( options.callback ) { this.callbacks.push( options.callback ); }

    this.delayID = null;
    this.intervalID = null;
    this.fired = false;
  }

  public isRunning(): boolean {
    return ( this.delayID !== null || this.intervalID !== null );
  }

  public start(): void {
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
   * @param fire - should we fire if we haven't fired already?
   */
  public stop( fire: boolean ): void {
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

  public addCallback( callback: CallbackTimerCallback ): void {
    if ( !this.callbacks.includes( callback ) ) {
      this.callbacks.push( callback );
    }
  }

  public removeCallback( callback: CallbackTimerCallback ): void {
    const index = this.callbacks.indexOf( callback );
    if ( index !== -1 ) {
      this.callbacks.splice( index, 1 );
    }
  }

  /**
   * Calls all callbacks. Clients are free to call this when the timer is not running.
   */
  public fire(): void {
    const callbacksCopy = this.callbacks.slice( 0 );
    for ( let i = 0; i < callbacksCopy.length; i++ ) {
      callbacksCopy[ i ]();
    }
    this.fired = true;
  }

  public dispose(): void {
    this.stop( false );
    this.callbacks.length = 0;
  }
}

axon.register( 'CallbackTimer', CallbackTimer );