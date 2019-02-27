// Copyright 2015-2018, University of Colorado Boulder

/**
 * Lightweight event & listener abstraction for a single event type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );
  const EmitterIO = require( 'AXON/EmitterIO' );
  const PhetioObject = require( 'TANDEM/PhetioObject' );
  const Tandem = require( 'TANDEM/Tandem' );
  const ValidatorDef = require( 'AXON/ValidatorDef' );
  const validate = require( 'AXON/validate' );

  // constants
  const EmitterIOWithNoArgs = EmitterIO( [] );

  // Simulations have thousands of Emitters, so we re-use objects where possible.
  const EMPTY_ARRAY = [];
  assert && Object.freeze( EMPTY_ARRAY );

  /**
   * @param {Object} [options]
   */
  class Emitter extends PhetioObject {
    constructor( options ) {

      const phetioTypeSupplied = options && options.hasOwnProperty( 'phetioType' );
      const validatorsSupplied = options && options.hasOwnProperty( 'validators' );

      options = _.extend( {

        // {Array.<Object>|null} - array of "validators" as defined by ValidatorDef.js
        validators: EMPTY_ARRAY,

        // {boolean} @deprecated, only to support legacy emit1, emit2, emit3 calls.
        validationEnabled: true,

        // {function|null} [first] optional listener which will be added as the first listener.
        // Can be removed via removeListener.
        first: null,

        // {function|null} [last] optional listener which will be added as the last listener.
        // Can be removed via removeListener.
        last: null,

        // phet-io
        tandem: Tandem.optional,
        phetioState: false,
        phetioType: EmitterIOWithNoArgs // subtypes can override with EmitterIO([...]), see EmitterIO.js

      }, options );

      assert && assert( !options.hasOwnProperty( 'listener' ), 'listener option no longer supported, please use first' );
      assert && assert( !options.hasOwnProperty( 'before' ), 'before option no longer supported, please use first' );

      // phetioPlayback events need to know the order the arguments occur in order to call EmitterIO.emit()
      // Indicate whether the event is for playback, but leave this "sparse"--only indicate when this happens to be true
      if ( options.phetioPlayback ) {
        options.phetioEventMetadata = options.phetioEventMetadata || {};
        assert && assert( !options.phetioEventMetadata.hasOwnProperty( 'dataKeys' ), 'dataKeys should be supplied by Emitter, not elsewhere' );
        options.phetioEventMetadata.dataKeys = options.phetioType.elements.map( element => element.name );
      }

      // important to be before super call. OK to supply neither or one or the other, but not both.  That is a NAND.
      assert && assert( !( phetioTypeSupplied && validatorsSupplied ),
        'use either phetioType or validators, not both, see EmitterIO to set validators on an instrumented Emitter'
      );

      // use the phetioType's validators if provided, we know we aren't overwriting here because of the above assertion
      if ( phetioTypeSupplied ) {
        options.validators = options.phetioType.validators;
      }

      super( options );

      validate( options.validators, { valueType: Array } );

      // @private - Note: one test indicates stripping this out via assert && in builds may save around 300kb heap
      this.validators = options.validators;

      // @private - opt out of validation. Can be removed when deprecated emit functions are gone.
      this.validationEnabled = options.validationEnabled;

      if ( assert ) {

        // Iterate through each validator and make sure that it won't validate options on validating value. This is
        // mainly done for performance
        options.validators.forEach( validator => {
          assert && assert(
            validator.validateOptionsOnValidateValue !== true,
            'emitter sets its own validateOptionsOnValidateValue for each argument type'
          );
          validator.validateOptionsOnValidateValue = false;

          // Changing the validator options after construction indicates a logic error, except that many EmitterIOs
          // are shared between instances. Don't assume we "own" the validator if it came from the TypeIO.
          assert && !phetioTypeSupplied && Object.freeze( validator );

          // validate the options passed in to validate each emitter argument
          assert && ValidatorDef.validateValidator( validator );
        } );

        // Changing after construction indicates a logic error, except that many EmitterIOs are shared between instances.
        // Don't assume we "own" the validator if it came from the TypeIO.
        assert && !phetioTypeSupplied && Object.freeze( options.validators );
      }

      // @private {function[]} - the listeners that will be called on emit
      this.listeners = [];

      // @private {function[][]} - during emit() keep track of which listeners should receive events in order to manage
      //                         - removal of listeners during emit()
      this.activeListenersStack = [];

      // @private {function|null} if defined, called as the first listener
      this.first = options.first;
      this.first && this.listeners.push( this.first );

      // @private {function|null} if defined, called as the last listener
      this.last = options.last;
      this.last && this.listeners.push( this.last );
    }

    /**
     * Disposes an Emitter. All listeners are removed.
     * @public
     * @override
     */
    dispose() {
      this.first = null;
      this.last = null;
      this.listeners.length = 0; // See https://github.com/phetsims/axon/issues/124
      super.dispose();
    }

    /**
     * Adds a listener which will be called during emit.
     * @param {function} listener
     * @public
     */
    addListener( listener ) {

      assert && assert( this.listeners.indexOf( listener ) === -1, 'Cannot add the same listener twice' );

      // If a listener is added during an emit(), we must make a copy of the current list of listeners--the newly added
      // listener will be available for the next emit() but not the one in progress.  This is to match behavior with
      // removeListener.
      this.defendListeners();

      const index = this.last ? this.listeners.length - 1 : this.listeners.length;
      this.listeners.splice( index, 0, listener );
    }

    /**
     * Removes a listener
     * @param {function} listener
     * @public
     */
    removeListener( listener ) {

      const index = this.listeners.indexOf( listener );

      // Throw an error when removing a non-listener (except when the Emitter has already been disposed, see
      // https://github.com/phetsims/sun/issues/394#issuecomment-419998231
      if ( assert && !this.isDisposed ) {
        assert && assert( index >= 0, 'tried to removeListener on something that wasn\'t a listener' );
      }

      // If an emit is in progress, make a copy of the current list of listeners--the removed listener will remain in
      // the list and be called for this emit call, see #72
      this.defendListeners();

      this.listeners.splice( index, 1 );

      // Cleanup for special cases of first and last
      if ( this.last === listener ) {
        this.last = null;
      }
      if ( this.first === listener ) {
        this.first = null;
      }
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
     * Gets the data that will be emitted to the PhET-iO data stream, for an instrumented simulation.
     * @returns {*}
     * @private
     */
    getPhetioData() {

      // null if there are no arguments.  dataStream.js omits null values for data
      let data = null;
      if ( this.phetioType.elements.length > 0 ) {

        // Enumerate named argsObject for the data stream.
        data = {};
        for ( let i = 0; i < this.phetioType.elements.length; i++ ) {
          const element = this.phetioType.elements[ i ];
          data[ element.name ] = element.type.toStateObject( arguments[ i ] );
        }
      }
      return data;
    }

    /**
     * Emits a single event.  This method is called many times in a simulation and must be well-optimized.  Listeners
     * are notified in the order they were added via addListener, though it is poor practice to rely on the order
     * of listener notifications.
     * @params - expected parameters are based on options.validators, see constructor
     * @public
     */
    emit() {
      if ( assert && this.validationEnabled ) {
        assert(
          arguments.length === this.validators.length,
          `Emitted unexpected number of args. Expected: ${this.validators.length} and received ${arguments.length}`
        );
        for ( let i = 0; i < this.validators.length; i++ ) {
          validate( arguments[ i ], this.validators[ i ] );
        }
      }

      assert && this.first && assert( this.listeners.indexOf( this.first ) === 0, 'first should be at the beginning' );
      assert && this.last && assert( this.listeners.indexOf( this.last ) === this.listeners.length - 1, 'last should be ' +
                                                                                                        'at the end' );
      // handle phet-io data stream for the emitted event
      this.isPhetioInstrumented() && this.phetioStartEvent( 'emitted', this.getPhetioData.apply( this, arguments ) );

      // Notify wired-up listeners, if any
      if ( this.listeners.length > 0 ) {
        this.activeListenersStack.push( this.listeners );

        // Notify listeners--note the activeListenersStack could change as listeners are called, so we do this by index
        const lastEntry = this.activeListenersStack.length - 1;
        for ( let i = 0; i < this.activeListenersStack[ lastEntry ].length; i++ ) {
          this.activeListenersStack[ lastEntry ][ i ].apply( null, arguments );
        }

        this.activeListenersStack.pop();
      }

      this.isPhetioInstrumented() && this.phetioEndEvent();
    }

    /**
     * Emits a single event with one argument.
     * @param {*} arg0
     * @public
     * @deprecated - please use emit()
     */
    emit1( arg0 ) {
      this.validationEnabled = false; // Disable validation until emit() is used properly
      this.emit( arg0 );
    }

    /**
     * Emits a single event with two arguments.
     * @param {*} arg0
     * @param {*} arg1
     * @public
     * @deprecated - please use emit()
     */
    emit2( arg0, arg1 ) {
      this.validationEnabled = false; // Disable validation until emit() is used properly
      this.emit( arg0, arg1 );
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