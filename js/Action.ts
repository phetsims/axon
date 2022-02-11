// Copyright 2019-2021, University of Colorado Boulder

/**
 * An action that can be executed and sent to the PhET-iO data stream, and optionally recorded for playback. This type
 * will also validate the argument types passed to the action function.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import assertMutuallyExclusiveOptions from '../../phet-core/js/assertMutuallyExclusiveOptions.js';
import merge from '../../phet-core/js/merge.js';
import PhetioObject from '../../tandem/js/PhetioObject.js';
import Tandem from '../../tandem/js/Tandem.js';
import IOType from '../../tandem/js/types/IOType.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import axon from './axon.js';
import validate from './validate.js';
import ValidatorDef from './ValidatorDef.js';

// constants
const VALIDATE_OPTIONS_FALSE = { validateValidator: false };

// Simulations have thousands of Emitters, so we re-use objects where possible.
const EMPTY_ARRAY = [];
assert && Object.freeze( EMPTY_ARRAY );

// allowed keys to options.parameters
const PARAMETER_KEYS = [
  'name', // {string} - required for phet-io instrumented Actions
  'phetioType', // {IOType} - required for phet-io instrumented Actions
  'phetioDocumentation', // {string} - optional, additional documentation for this specific parameter

  // {boolean=true} - specify this to keep the parameter private to the PhET-iO API. To support emitting and executing over
  // the PhET-iO API, phetioPrivate parameters must not ever be before a public one. For example
  // `emit1( public1, private1, public2)` is not allowed. Instead it must be ordered like `emit( public1, public2, private1 )`
  'phetioPrivate'
].concat( ValidatorDef.VALIDATOR_KEYS );

const PHET_IO_STATE_DEFAULT = false;

// helper closures
const paramToPhetioType = param => param.phetioType;
const paramToName = param => param.name;

class Action extends PhetioObject {

  /**
   * @param {function} action - the function that is called when this Action occurs
   * @param {Object} [options]
   */
  constructor( action, options ) {
    options = merge( {

      // {Object[]} - see PARAMETER_KEYS for a list of legal keys, their types, and documentation
      parameters: EMPTY_ARRAY,

      // phet-io - see PhetioObject.js for doc
      tandem: Tandem.OPTIONAL,

      // {function(IOType[]):IOType} - The non parameterized IOType. Override this to create a subtype of ActionIO as
      // the phetioType instead of a parameterized ActionIO Type.
      phetioOuterType: Action.ActionIO,
      phetioState: PHET_IO_STATE_DEFAULT,
      phetioPlayback: PhetioObject.DEFAULT_OPTIONS.phetioPlayback,
      phetioEventMetadata: PhetioObject.DEFAULT_OPTIONS.phetioEventMetadata,
      phetioDocumentation: 'A function that executes.'
    }, options );

    assert && Action.validateParameters( options.parameters, options.tandem.supplied );
    assert && assert( typeof action === 'function', 'action should be a function' );
    assert && assert( options.phetioType === undefined,
      'Action sets its own phetioType. Instead provide parameter phetioTypes through `options.parameters`' );

    // {Object[]} - list of parameters, see options.parameters. Filter out phetioPrivate parameters, all `phetioPrivate`
    // parameters will not have a `phetioType`, see `validateParameters`.
    const phetioPublicParameters = options.parameters.filter( paramToPhetioType );

    options.phetioType = options.phetioOuterType( phetioPublicParameters.map( paramToPhetioType ) );

    // phetioPlayback events need to know the order the arguments occur in order to call EmitterIO.emit()
    // Indicate whether the event is for playback, but leave this "sparse"--only indicate when this happens to be true
    if ( options.phetioPlayback ) {
      options.phetioEventMetadata = options.phetioEventMetadata || {};

      assert && assert( !options.phetioEventMetadata.hasOwnProperty( 'dataKeys' ),
        'dataKeys should be supplied by Action, not elsewhere' );

      options.phetioEventMetadata.dataKeys = options.parameters.map( paramToName );
    }
    options.phetioDocumentation = Action.getPhetioDocumentation( options.phetioDocumentation, phetioPublicParameters );

    super( options );

    // @public (only for testing) - Note: one test indicates stripping this out via assert && in builds may save around 300kb heap
    this._parameters = options.parameters;

    // @private {function}
    this._action = action;

    // @private - only needed for dispose, see options for doc
    this._phetioOuterType = options.phetioOuterType;
  }

  /**
   * @param {object} parameters
   * @param {boolean} tandemSupplied - proxy for whether the PhetioObject is instrumented.  We cannot call
   *                                 - PhetioObject.isPhetioInstrumented() until after the supercall, so we use this beforehand.
   * @private
   */
  static validateParameters( parameters, tandemSupplied ) {

    // validate the parameters object
    validate( parameters, { valueType: Array } );

    // Action only supports phetioPrivate parameters at the end of the emit call, so once we hit the first phetioPrivate
    // parameter, then assert that the rest of them afterwards are as well.
    let reachedPhetioPrivate = false;

    // we must iterate from the first parameter to the last parameter to support phetioPrivate
    for ( let i = 0; i < parameters.length; i++ ) {
      const parameter = parameters[ i ]; // metadata about a single parameter

      assert && assert( Object.getPrototypeOf( parameter ) === Object.prototype,
        'Extra prototype on parameter object is a code smell' );

      reachedPhetioPrivate = reachedPhetioPrivate || parameter.phetioPrivate;
      assert && reachedPhetioPrivate && assert( parameter.phetioPrivate,
        'after first phetioPrivate parameter, all subsequent parameters must be phetioPrivate' );

      assert && tandemSupplied && Tandem.VALIDATION && assert( parameter.phetioType || parameter.phetioPrivate,
        'instrumented Emitters must include phetioType for each parameter or be marked as `phetioPrivate`.' );
      assert && parameter.phetioType && assert( parameter.name,
        '`name` is a required parameter for phet-io instrumented parameters.' );
      assert && assertMutuallyExclusiveOptions( parameter, [ 'phetioPrivate' ], [
        'name', 'phetioType', 'phetioDocumentation'
      ] );

      assert && assert( _.intersection( Object.keys( parameter ), ValidatorDef.VALIDATOR_KEYS ).length > 0,
        `validator must be specified for parameter ${i}` );

      for ( const key in parameter ) {
        assert && assert( PARAMETER_KEYS.includes( key ), `unrecognized parameter key: ${key}` );
      }

      // Changing after construction indicates a logic error.
      assert && Object.freeze( parameters[ i ] );

      // validate the options passed in to validate each Action argument
      ValidatorDef.validateValidator( parameter );
    }

    // Changing after construction indicates a logic error.
    assert && Object.freeze( parameters );
  }

  /**
   * Gets the data that will be emitted to the PhET-iO data stream, for an instrumented simulation.
   * @returns {Object} - the data, keys dependent on parameter metadata
   * @private
   */
  getPhetioData( ...args ) {

    assert && assert( Tandem.PHET_IO_ENABLED, 'should only get phet-io data in phet-io brand' );

    // null if there are no arguments. dataStream.js omits null values for data
    let data = null;
    if ( this._parameters.length > 0 ) {

      // Enumerate named argsObject for the data stream.
      data = {};
      for ( let i = 0; i < this._parameters.length; i++ ) {
        const element = this._parameters[ i ];
        if ( !element.phetioPrivate ) {
          data[ element.name ] = element.phetioType.toStateObject( args[ i ] );
        }
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

      const docText = param.phetioDocumentation ? ` - ${param.phetioDocumentation}` : '';

      return `<li>${param.name}: ${param.phetioType.typeName}${docText}</li>`;
    };

    return currentPhetioDocumentation + ( parameters.length === 0 ? '<br>No parameters.' : `${'<br>The parameters are:<br/>' +
           '<ol>'}${parameters.map( paramToDocString ).join( '<br/>' )}</ol>` );
  }

  /**
   * Invokes the action.
   * @params - expected parameters are based on options.parameters, see constructor
   * @public
   */
  execute( ...args ) {
    if ( assert ) {
      assert( args.length === this._parameters.length,
        `Emitted unexpected number of args. Expected: ${this._parameters.length} and received ${args.length}`
      );
      for ( let i = 0; i < this._parameters.length; i++ ) {
        const parameter = this._parameters[ i ];
        validate( args[ i ], parameter, 'argument does not match provided parameter validator', VALIDATE_OPTIONS_FALSE );

        // valueType overrides the phetioType validator so we don't use that one if there is a valueType
        if ( parameter.phetioType && !this._parameters.valueType ) {
          validate( args[ i ], parameter.phetioType.validator, 'argument does not match parameter\'s phetioType validator', VALIDATE_OPTIONS_FALSE );
        }
      }
    }

    // handle phet-io data stream for the emitted event
    this.phetioStartEvent( 'emitted', {
      getData: () => this.getPhetioData( ...args ) // put this in a closure so that it is only called in phet-io brand
    } );

    this._action.apply( null, args );

    this.phetioEndEvent();
  }
}

const paramToTypeName = param => param.typeName;

// {Map.<string, IOType>} - Cache each parameterized IOType so that
// it is only created once.
const cache = new Map();

Action.ActionIO = parameterTypes => {
  const key = parameterTypes.map( paramToTypeName ).join( ',' );
  if ( !cache.has( key ) ) {
    cache.set( key, new IOType( `ActionIO<${parameterTypes.map( paramToTypeName ).join( ', ' )}>`, {
      valueType: Action,
      documentation: 'Executes when an event occurs',
      events: [ 'emitted' ],
      parameterTypes: parameterTypes,
      metadataDefaults: {
        phetioState: PHET_IO_STATE_DEFAULT
      },
      methods: {
        execute: {
          returnType: VoidIO,
          parameterTypes: parameterTypes,

          // Match `Action.execute`'s dynamic number of arguments
          implementation: function( ...args ) {
            this.execute( ...args );
          },
          documentation: 'Executes the function the Action is wrapping.',
          invocableForReadOnlyElements: false
        }
      }
    } ) );
  }
  return cache.get( key );
};

axon.register( 'Action', Action );
export default Action;