// Copyright 2019-2025, University of Colorado Boulder

/**
 * CallbackTimer is a timer that calls a set of registered callbacks.
 * It utilizes AXON/stepTimer, but provides a higher level of abstraction, hiding the details of managing stepTimer.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import axon from './axon.js';
import stepTimer from './stepTimer.js';
import { type TimerListener } from './Timer.js';

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

  private readonly callbacks: CallbackTimerCallback[] = [];

  // initial delay between when start is called and the timer first fires, in ms
  private _delay = 400;

  // fire the timer at this continuous interval, in ms
  private _interval = 100;

  // identifier for timer associated with the initial delay
  private delayID: TimerListener | null = null;

  // identifier for timer associated with the continuous interval
  private intervalID: TimerListener | null = null;

  // has the timer fired since it was started?
  private fired = false;

  public constructor( options?: CallbackTimerOptions ) {

    if ( options?.delay !== undefined ) {
      this.delay = options.delay;
    }
    if ( options?.interval !== undefined ) {
      this.interval = options.interval;
    }
    if ( options?.callback ) {
      this.callbacks.push( options.callback );
    }
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

  public set delay( delay: number ) {
    assert && assert( delay >= 0, `bad value for delay: ${delay}` );

    this._delay = delay;
  }

  public get delay(): number {
    return this._delay;
  }

  public set interval( interval: number ) {
    assert && assert( interval > 0, `bad value for interval: ${interval}` );

    this._interval = interval;
  }

  public get interval(): number {
    return this._interval;
  }

  public dispose(): void {
    this.stop( false );
    this.callbacks.length = 0;
  }
}

axon.register( 'CallbackTimer', CallbackTimer );