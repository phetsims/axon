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
  const EmitterIO = require( 'AXON/EmitterIO' );
  const axon = require( 'AXON/axon' );
  const TinyEmitter = require( 'AXON/TinyEmitter' );

  // constants
  const EmitterIOWithNoArgs = EmitterIO( [] );

  class Emitter extends Action {

    /**
     * @param {Object} [options]
     */
    constructor( options ) {

      // If provided, make sure the phetioType is different from the default to save complexity/memory.
      if ( assert && options && options.phetioType ) {
        assert( options.phetioType.parameterTypes.length > 0, 'do not specify phetioType that is the same as the default' );
      }

      // For the common case of creating an instrumented Emitter with no args, the phetioType is automatically supplied.
      // If validators and/or phetioType are supplied, the parent will check via assertions that supplied options
      // are correct.
      if ( options && !options.validators && !options.phetioType ) {
        options = _.extend( { phetioType: EmitterIOWithNoArgs }, options );
      }

      super( function() {
        assert && assert( self.tinyEmitter instanceof TinyEmitter,
          'Emitter should not emit until after its constructor has completed' );

        self.tinyEmitter.emit.apply( self.tinyEmitter, arguments );
      }, options );

      const self = this;

      // @private - provide Emitter functionality via composition
      this.tinyEmitter = new TinyEmitter();
    }

    /**
     * Emit to notify listeners; implemented by executing the action of the parent class.
     * @public
     * @params {*}
     */
    emit() {
      this.execute.apply( this, arguments );
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