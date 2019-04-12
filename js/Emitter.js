// Copyright 2015-2019, University of Colorado Boulder

/**
 * Event & listener abstraction for a single "event" type. The type provides extra functionality beyond just notifying
 * listeners. It adds PhET-iO instrumentation capabilities as well as validation. For the lightest-weight, fastest
 * solution with the smallest memory footprint, see `TinyEmitter`.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const Action = require( 'AXON/Action' );
  const axon = require( 'AXON/axon' );
  const TinyEmitter = require( 'AXON/TinyEmitter' );

  class Emitter extends Action {

    /**
     * @param {Object} [options]
     */
    constructor( options ) {

      // TODO https://github.com/phetsims/axon/issues/222: clean this up
      // options = _.extend( {
      //
      //   // phetioType: EmitterIOWithNoArgs // subtypes can override with EmitterIO([...]), see EmitterIO.js
      // }, options );

      super( null, options );

      const self = this;

      // @private - provide Emitter functionality via composition
      this.tinyEmitter = new TinyEmitter();

      // Set the action in the parent type now that we have self, use function to support arguments
      this.action = function() {
        self.tinyEmitter.tinyEmit.apply( self.tinyEmitter, arguments );
      };
    }

    /**
     * Disposes an Emitter. All listeners are removed.
     * @public
     * @override
     */
    dispose() {
      this.tinyEmitter.dispose();
      super.dispose();
    }

    /**
     * Adds a listener which will be called during emit.
     * @param {function} listener
     * @public
     */
    addListener( listener ) {
      this.tinyEmitter.addListener( listener );
    }

    /**
     * Removes a listener
     * @param {function} listener
     * @public
     */
    removeListener( listener ) {

      this.tinyEmitter.removeListener( listener );
    }

    /**
     * Removes all the listeners
     * @public
     */
    removeAllListeners() {

      this.tinyEmitter.removeAllListeners();
    }

    /**
     * Checks whether a listener is registered with this Emitter
     * @param {function} listener
     * @returns {boolean}
     * @public
     */
    hasListener( listener ) {
      return this.tinyEmitter.hasListener( listener );
    }

    /**
     * Returns true if there are any listeners.
     * @returns {boolean}
     * @public
     */
    hasListeners() {
      return this.tinyEmitter.hasListeners();

    }

    /**
     * Returns the number of listeners.
     * @returns {number}
     * @public
     */
    getListenerCount() {
      return this.tinyEmitter.getListenerCount();
    }
  }

  return axon.register( 'Emitter', Emitter );
} );