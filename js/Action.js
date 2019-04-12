// Copyright 2019, University of Colorado Boulder

/**
 * An action that can be sent to the data stream, and optionally recorded for playback.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
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
  const ActionIOWithNoArgs = EmitterIO( [] ); // TODO https://github.com/phetsims/axon/issues/222 factor out ActionIO

  // Simulations have thousands of Emitters, so we re-use objects where possible.
  const EMPTY_ARRAY = [];
  assert && Object.freeze( EMPTY_ARRAY );

  class Action extends PhetioObject {

    /**
     * @param {function|null} action - the function that is called when this Action occurs
     * @param {Object} [options]
     */
    constructor( action, options ) {

      const phetioTypeSupplied = options && options.hasOwnProperty( 'phetioType' );
      const validatorsSupplied = options && options.hasOwnProperty( 'validators' );

      if ( assert && phetioTypeSupplied ) {
        assert( options.phetioType.parameterTypes.length > 0, 'do not specify phetioType that is the same as the default' );
      }

      options = _.extend( {

        // {Array.<Object>|null} - array of "validators" as defined by ValidatorDef.js
        validators: EMPTY_ARRAY,

        // {boolean} @deprecated, only to support legacy emit1, emit2, emit3 calls.
        validationEnabled: true,

        // phet-io
        tandem: Tandem.optional,
        phetioState: false,
        phetioType: ActionIOWithNoArgs // subtypes can override with EmitterIO([...]), see EmitterIO.js
      }, options );

      // phetioPlayback events need to know the order the arguments occur in order to call EmitterIO.emit()
      // Indicate whether the event is for playback, but leave this "sparse"--only indicate when this happens to be true
      if ( options.phetioPlayback ) {
        options.phetioEventMetadata = options.phetioEventMetadata || {};
        assert && assert( !options.phetioEventMetadata.hasOwnProperty( 'dataKeys' ), 'dataKeys should be supplied by Emitter, not elsewhere' );
        options.phetioEventMetadata.dataKeys = options.phetioType.elements.map( element => element.name );
      }

      // important to be before super call. OK to supply neither or one or the other, but not both.  That is a NAND.
      assert && assert( !( phetioTypeSupplied && validatorsSupplied ),
        'use either phetioType or validators, not both, see EmitterIO to set validators on an instrumented Action'
      );

      // use the phetioType's validators if provided, we know we aren't overwriting here because of the above assertion
      if ( phetioTypeSupplied ) {
        options.validators = options.phetioType.validators;
      }

      super( options );

      validate( options.validators, { valueType: Array } );

      // @public (only for testing) - Note: one test indicates stripping this out via assert && in builds may save around 300kb heap
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

      // @protected - can be supplied by subclasses after superconstructor call completes
      this.action = action;
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
      assert && assert( typeof this.action === 'function', 'action should exist when emit is called' );
      if ( assert && this.validationEnabled ) {
        assert( arguments.length === this.validators.length,
          `Emitted unexpected number of args. Expected: ${this.validators.length} and received ${arguments.length}`
        );
        for ( let i = 0; i < this.validators.length; i++ ) {
          validate( arguments[ i ], this.validators[ i ] );
        }
      }

      // handle phet-io data stream for the emitted event
      this.isPhetioInstrumented() && this.phetioStartEvent( 'emitted', this.getPhetioData.apply( this, arguments ) );

      this.action.apply( null, arguments );

      this.isPhetioInstrumented() && this.phetioEndEvent();
    }
  }

  return axon.register( 'Action', Action );
} );