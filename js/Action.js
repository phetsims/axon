// Copyright 2019, University of Colorado Boulder

/**
 * An action that can be executed and sent to the PhET-iO data stream, and optionally recorded for playback. This type
 * will also validate the argument types passed to the action function.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const ActionIO = require( 'AXON/ActionIO' );
  const axon = require( 'AXON/axon' );
  const PhetioObject = require( 'TANDEM/PhetioObject' );
  const Tandem = require( 'TANDEM/Tandem' );
  const ValidatorDef = require( 'AXON/ValidatorDef' );
  const validate = require( 'AXON/validate' );

  // constants
  // Simulations have thousands of Emitters, so we re-use objects where possible.
  const EMPTY_ARRAY = [];
  assert && Object.freeze( EMPTY_ARRAY );

  // TODO: Map that holds all the ActionIO types created so they can be reused when possible, https://github.com/phetsims/axon/issues/257
  const TYPE_IO_MAP = {};

  // allowed keys to options.parameters
  const PARAMETER_KEYS = [
    'name', // {string}
    'phetioType', // {function(new:ObjectIO)}
    'phetioDocumentation' // {string}
  ].concat( ValidatorDef.VALIDATOR_KEYS );

  class Action extends PhetioObject {

    /**
     * @param {function} action - the function that is called when this Action occurs
     * @param {Object} [options]
     */
    constructor( action, options ) {
      options = _.extend( {

        // {Object[]} - see PARAMETER_KEYS for a list of legal keys, their types, and documentation
        parameters: EMPTY_ARRAY,

        // phet-io - see PhetioObject.js for doc
        tandem: Tandem.optional,

        // {function(new:ObjectIO) - override this to create a subtype of ActionIO as the phetioType instead of ActionIO.
        phetioOuterType: ActionIO,
        phetioState: false,
        phetioPlayback: PhetioObject.DEFAULT_OPTIONS.phetioPlayback,
        phetioEventMetadata: PhetioObject.DEFAULT_OPTIONS.phetioEventMetadata,
        phetioDocumentation: 'A function that executes.'
      }, options );

      assert && assert( options.phetioType === undefined,
        'Action sets its own phetioType. Instead provide parameter phetioTypes through `options.parameters`' );
      assert && assert( typeof action === 'function', 'action should be a function' );
      if ( options.tandem.supplied ) {
        assert && options.parameters.forEach( param => assert( param.phetioType, 'phetioType required for each parameter.' ) );

        // TODO: create a map so that we don't create this for each Emitter, https://github.com/phetsims/axon/issues/257
        // TODO: we should make sure to remove these items to prevent too large of a footprint, https://github.com/phetsims/axon/issues/257
        // TODO: the name in built mode will be minified, is that still ok? https://github.com/phetsims/axon/issues/257
        const uniqueKey = options.phetioOuterType.name + options.parameters.map( param => param.phetioType.typeName ).join( ',' );

        options.phetioType = TYPE_IO_MAP[ uniqueKey ] ? TYPE_IO_MAP[ uniqueKey ] : options.phetioOuterType( options.parameters.map( param => param.phetioType ) );
      }
      assert && Action.validateParameters( options.tandem.supplied, options.parameters );

      // phetioPlayback events need to know the order the arguments occur in order to call EmitterIO.emit()
      // Indicate whether the event is for playback, but leave this "sparse"--only indicate when this happens to be true
      if ( options.phetioPlayback ) {
        options.phetioEventMetadata = options.phetioEventMetadata || {};

        assert && assert( !options.phetioEventMetadata.hasOwnProperty( 'dataKeys' ),
          'dataKeys should be supplied by Action, not elsewhere' );

        options.phetioEventMetadata.dataKeys = options.parameters.map( parmeter => parmeter.name );
      }
      // We only need phetioDocumentation for instrumented instances
      if ( options.tandem.supplied ) {
        options.phetioDocumentation = Action.getPhetioDocumentation( options.phetioDocumentation, options.parameters );
      }
      super( options );

      // @public (only for testing) - Note: one test indicates stripping this out via assert && in builds may save around 300kb heap
      this.parameters = options.parameters;

      // @private {function}
      this._action = action;
    }

    /**
     * @param {boolean} isPhetioInstrumented
     * @param {object} parameters
     */
    static validateParameters( isPhetioInstrumented, parameters ) {

      // validate the parameters object
      validate( parameters, { valueType: Array } );

      for ( let i = 0; i < parameters.length; i++ ) {
        const validator = parameters[ i ];
        assert && assert( validator.validateOptionsOnValidateValue !== true,
          'Action sets its own validateOptionsOnValidateValue for each argument type'
        );

        assert && assert( Object.getPrototypeOf( validator ) === Object.prototype,
          'Extra prototype on validator object is a code smell' );

        var keys = Object.keys( validator );
        for ( let i = 0; i < keys.length; i++ ) {
          const key = keys[ i ];
          assert && assert( PARAMETER_KEYS.indexOf( key ) >= 0, 'unrecognized parameter key: ' + key );
        }

        assert && isPhetioInstrumented && assert( validator.phetioType, 'instrumented Emitters must include phetioType for each parameter' );

        assert && !validator.phetioType && assert( Object.keys( _.pick( validator, ValidatorDef.VALIDATOR_KEYS ) ).length > 0, 'if phetioType is not provided, validator must be specified' );

        let containsValidatorKeys = false;
        for ( var prop in validator ) {
          if ( ValidatorDef.VALIDATOR_KEYS.includes( prop ) ) {
            containsValidatorKeys = true;
            break;
          }
        }

        // TODO: this doesn't work now because of VoidIO workaround, do we want it to? https://github.com/phetsims/axon/issues/257
        // assert && assert( !!validator.phetioType !== !!validator.valueType, 'Specify phetioType OR valueType, not both' );

        // TODO: is this taking up too much memory? Does this create too much garbage? https://github.com/phetsims/axon/issues/257
        parameters[ i ] = _.extend( {
          validateOptionsOnValidateValue: false,
          containsValidatorKeys: containsValidatorKeys
        }, validator );

        // validate the options passed in to validate each Action argument
        // TODO: surely this is not the most efficient way to do this, https://github.com/phetsims/axon/issues/257
        containsValidatorKeys && ValidatorDef.validateValidator( validator );
      }

      // Changing after construction indicates a logic error.
      Object.freeze( parameters );
    }

    /**
     * Gets the data that will be emitted to the PhET-iO data stream, for an instrumented simulation.
     * @returns {Object} - the data, keys dependent on parameter metadata
     * @private
     */
    getPhetioData() {

      // null if there are no arguments. dataStream.js omits null values for data
      let data = null;
      if ( this.parameters.length > 0 ) {

        // Enumerate named argsObject for the data stream.
        data = {};
        for ( let i = 0; i < this.parameters.length; i++ ) {
          const element = this.parameters[ i ];
          data[ element.name ] = element.phetioType.toStateObject( arguments[ i ] );
        }
      }
      return data;
    }

    /**
     * Get the phetioDocumentation compiled from all the parameters
     * @param {boolean} currentPhetioDocumentation
     * @param {Object} parameters - see options.parameters
     * @private
     * @returns {string}
     */
    static getPhetioDocumentation( currentPhetioDocumentation, parameters ) {
      const paramToDocString = param => {
        var docText = param.phetioDocumentation ? '. ' + param.phetioDocumentation : '';

        // TODO: are we gauranteed to have the name? We aren't asserting it right now, https://github.com/phetsims/axon/issues/257
        return '<li>' + param.name + ': ' + param.phetioType.typeName + docText + '</li>';
      };

      return currentPhetioDocumentation + ( parameters.length === 0 ? ' No arguments.' : ' The arguments are:<br>' +
             '<ol>' + parameters.map( paramToDocString ).join( '\n' ) + '</ol>' );
    }

    /**
     * Invokes the action.
     * @params - expected parameters are based on options.parameters, see constructor
     * @public
     */
    execute() {
      if ( assert ) {
        assert( arguments.length === this.parameters.length,
          `Emitted unexpected number of args. Expected: ${this.parameters.length} and received ${arguments.length}`
        );
        for ( let i = 0; i < this.parameters.length; i++ ) {
          const parameter = this.parameters[ i ];
          if ( parameter.containsValidatorKeys ) {
            validate( arguments[ i ], parameter );
          }

          // valueType overrides the phetioType validator so we don't use that one if there is a valueType
          if ( parameter.phetioType && !this.parameters.valueType ) {
            validate( arguments[ i ], parameter.phetioType.validator );
          }
        }
      }

      // handle phet-io data stream for the emitted event
      this.isPhetioInstrumented() && this.phetioStartEvent( 'emitted', this.getPhetioData.apply( this, arguments ) );

      this._action.apply( null, arguments );

      this.isPhetioInstrumented() && this.phetioEndEvent();
    }
  }

  return axon.register( 'Action', Action );
} );