// Copyright 2015-2018, University of Colorado Boulder

/**
 * Lightweight event & listener abstraction for a single event type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const assertValueType = require( 'AXON/assertValueType' );
  const axon = require( 'AXON/axon' );
  const EmitterIO = require( 'AXON/EmitterIO' );
  const PhetioObject = require( 'TANDEM/PhetioObject' );
  const Tandem = require( 'TANDEM/Tandem' );

  /**
   * @param {Object} [options]
   */
  class Emitter extends PhetioObject {
    constructor( options ) {

      options = _.extend( {

        // used to validate that you are emitting with the appropriate number/types of args, see https://github.com/phetsims/axon/issues/182
        valueTypes: [],

        // {Array.<boolean>|null} - whether or not a value type can be an optional parameter for the emit function
        areTypesOptional: null,

        tandem: Tandem.optional,
        phetioState: false,
        phetioType: EmitterIO( [] ), // subtypes can override with EmitterIO([...]), see EmitterIO.js
        listener: null // {function} [listener] optional listener to be added during construction.
      }, options );

      super( options );

      // @private
      this.numberOfArgs = options.valueTypes.length;

      if ( options.areTypesOptional !== null ) {
        assert && assert( Array.isArray( options.areTypesOptional ) );
        assert && assert( this.numberOfArgs === options.areTypesOptional.length, 'if types are declared as optional, all args must be' +
                                                                                 'declared.' );
        for ( let i = 0; i < options.areTypesOptional.length; i++ ) {
          assert && assert( typeof options.areTypesOptional[ i ] === 'boolean' );
        }
      }

      //@private
      this.assertEmittingValidValues = assert && function() {
        var args = arguments;
        !options.areTypesOptional && assert( args.length === this.numberOfArgs,
          `Emitted unexpected number of args. Expected: ${this.numberOfArgs} and received ${args.length}` );
        for ( let i = 0; i < options.valueTypes.length; i++ ) {
          let isOptional;
          if ( options.areTypesOptional ) {
            isOptional = options.areTypesOptional[ i ];
          }
          assertValueType( args[ i ], options.valueTypes[ i ], isOptional );
        }
      };

      // TODO: comment this back in once all emitter method consolidation work is complete, https://github.com/phetsims/axon/issues/182
      // if ( this.isPhetioInstrumented() ) {
      //   assert && assert( options.phetioType.parameterTypes.length === this.numberOfArgs,
      //     'phet/phet-io argument types mismatch.' );
      // }

      // @private {function[]} - the listeners that will be called on emit
      this.listeners = [];

      // @private {function[][]} - during emit() keep track of which listeners should receive events in order to manage
      //                         - removal of listeners during emit()
      this.activeListenersStack = [];

      // If an initial listener was specified, add it now
      options.listener && this.addListener( options.listener );
    }

    /**
     * Dispose an Emitter that is no longer used.  Like Property.dispose, this method checks that there are no leaked
     * listeners.
     */
    dispose() {

      // See https://github.com/phetsims/axon/issues/124
      this.listeners.length = 0;

      PhetioObject.prototype.dispose.call( this );
    }

    /**
     * Adds a listener
     * @param {function} listener
     * @public
     */
    addListener( listener ) {

      assert && assert( this.listeners.indexOf( listener ) === -1, 'Cannot add the same listener twice' );

      // If a listener is added during an emit(), we must make a copy of the current list of listeners--the newly added
      // listener will be available for the next emit() but not the one in progress.  This is to match behavior with
      // removeListener.
      this.defendListeners();

      this.listeners.push( listener );
    }

    /**
     * Removes a listener
     * @param {function} listener
     * @public
     */
    removeListener( listener ) {

      const index = this.listeners.indexOf( listener );
      assert && assert( index >= 0, 'tried to removeListener on something that wasn\'t a listener' );

      // If an emit is in progress, make a copy of the current list of listeners--the removed listener will remain in
      // the list and be called for this emit call, see #72
      this.defendListeners();

      this.listeners.splice( index, 1 );
    }

    /**
     * Removes all the listeners
     * @public
     */
    removeAllListeners() {
      while ( this.listeners.length > 0 ) {
        this.removeListener( this.listeners[ 0 ] );
      }
    }

    /**
     * If addListener/removeListener is called while emit() is in progress, we must make a defensive copy of the array
     * of listeners before changing the array, and use it for the rest of the notifications until the emit call has
     * completed.
     * @private
     */
    defendListeners() {

      for ( let i = this.activeListenersStack.length - 1; i >= 0; i-- ) {

        // Once we meet a level that was already defended, we can stop, since all previous levels are also defended
        if ( this.activeListenersStack[ i ].defended ) {
          break;
        }
        else {
          const defendedListeners = this.listeners.slice();

          // Mark copies as 'defended' so that it will use the original listeners when emit started and not the modified
          // list.
          defendedListeners.defended = true;
          this.activeListenersStack[ i ] = defendedListeners;
        }
      }
    }

    /**
     * Emits a single event.
     * This method is called many times in a simulation and must be well-optimized.
     * @params - expected parameters are based on options.valueTypes, see constructor
     * @public
     */
    emit() {

      // validate the args
      this.assertEmittingValidValues && this.assertEmittingValidValues.apply( this, arguments );

      // handle phet-io data stream for the emitted event
      if ( this.isPhetioInstrumented() ) {

        // Enumerate named argsObject for the data stream.
        let argsObject = {};
        for ( let i = 0; i < this.phetioType.elements.length; i++ ) {
          let element = this.phetioType.elements[ i ];
          argsObject[ element.name ] = element.type.toStateObject( arguments[ i ] );
        }
        this.phetioStartEvent( 'emitted', argsObject );
      }

      this.activeListenersStack.push( this.listeners );
      const lastEntry = this.activeListenersStack.length - 1;

      // Notify listeners
      for ( let i = 0; i < this.activeListenersStack[ lastEntry ].length; i++ ) {
        this.activeListenersStack[ lastEntry ][ i ].apply( this, arguments );
      }

      this.activeListenersStack.pop();
      this.isPhetioInstrumented() && this.phetioEndEvent();
    }

    /**
     * Emits a single event with one argument.  This is a copy-paste of emit() for performance reasons.
     * @param {*} arg0
     * @public
     */
    emit1( arg0 ) {

      this.isPhetioInstrumented() && this.phetioStartEvent( 'emitted', {
        args: [ this.phetioType.parameterTypes[ 0 ].toStateObject( arg0 ) ]
      } );
      this.activeListenersStack.push( this.listeners );
      const lastEntry = this.activeListenersStack.length - 1;

      for ( let i = 0; i < this.activeListenersStack[ lastEntry ].length; i++ ) {
        this.activeListenersStack[ lastEntry ][ i ]( arg0 );
      }

      this.activeListenersStack.pop();
      this.isPhetioInstrumented() && this.phetioEndEvent();
    }

    /**
     * Emits a single event with two arguments.  This is a copy-paste of emit() for performance reasons.
     * @param {*} arg0
     * @param {*} arg1
     * @public
     */
    emit2( arg0, arg1 ) {
      this.isPhetioInstrumented() && this.phetioStartEvent( 'emitted', {
        args: [
          this.phetioType.parameterTypes[ 0 ].toStateObject( arg0 ),
          this.phetioType.parameterTypes[ 1 ].toStateObject( arg1 )
        ]
      } );
      this.activeListenersStack.push( this.listeners );
      const lastEntry = this.activeListenersStack.length - 1;

      for ( let i = 0; i < this.activeListenersStack[ lastEntry ].length; i++ ) {
        this.activeListenersStack[ lastEntry ][ i ]( arg0, arg1 );
      }

      this.activeListenersStack.pop();
      this.isPhetioInstrumented() && this.phetioEndEvent();
    }

    /**
     * Emits a single event with three arguments.  This is a copy-paste of emit() for performance reasons.
     * @param {*} arg0
     * @param {*} arg1
     * @param {*} arg2
     * @public
     */
    emit3( arg0, arg1, arg2 ) {
      this.isPhetioInstrumented() && this.phetioStartEvent( 'emitted', {
        args: [
          this.phetioType.parameterTypes[ 0 ].toStateObject( arg0 ),
          this.phetioType.parameterTypes[ 1 ].toStateObject( arg1 ),
          this.phetioType.parameterTypes[ 2 ].toStateObject( arg2 )
        ]
      } );
      this.activeListenersStack.push( this.listeners );
      const lastEntry = this.activeListenersStack.length - 1;

      for ( let i = 0; i < this.activeListenersStack[ lastEntry ].length; i++ ) {
        this.activeListenersStack[ lastEntry ][ i ]( arg0, arg1, arg2 );
      }

      this.activeListenersStack.pop();
      this.isPhetioInstrumented() && this.phetioEndEvent();
    }

    /**
     * Checks whether a listener is registered with this Emitter
     * @param {function} listener
     * @returns {boolean}
     * @public
     */
    hasListener( listener ) {
      assert && assert( arguments.length === 1, 'Emitter.hasListener should be called with 1 argument' );
      return this.listeners.indexOf( listener ) >= 0;
    }

    /**
     * Returns true if there are any listeners.
     * @returns {boolean}
     * @public
     */
    hasListeners() {
      assert && assert( arguments.length === 0, 'Emitter.hasListeners should be called without arguments' );
      return this.listeners.length > 0;
    }

    /**
     * Returns the number of listeners.
     * @returns {number}
     * @public
     */
    getListenerCount() {
      return this.listeners.length;
    }
  }

  return axon.register( 'Emitter', Emitter );
} );