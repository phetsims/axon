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
  const assertMutuallyExclusiveOptions = require( 'PHET_CORE/assertMutuallyExclusiveOptions' );
  const axon = require( 'AXON/axon' );
  const PhetioObject = require( 'TANDEM/PhetioObject' );
  const Tandem = require( 'TANDEM/Tandem' );
  const validate = require( 'AXON/validate' );
  const ValidatorDef = require( 'AXON/ValidatorDef' );

  // constants
  // Simulations have thousands of Emitters, so we re-use objects where possible.
  const EMPTY_ARRAY = [];
  assert && Object.freeze( EMPTY_ARRAY );

  // {Object.<uniqueKey:string, {count:number, phetioType:function(new:ObjectIO)} - uniqueKey is created from outer and
  // parameter types
  const TYPE_IO_CACHE = {};

  // allowed keys to options.parameters
  const PARAMETER_KEYS = [
    'name', // {string} - required for phet-io instrumented Actions
    'phetioType', // {function(new:ObjectIO)} - required for phet-io instrumented Actions
    'phetioDocumentation', // {string} - optional, additional documentation for this specific parameter

    // {boolean=true} - specify this to keep the parameter private to the phet-io api. To support emitting and executing over
    // the phet-io api, phetioPrivate parameters must not ever be before a public one. For example
    // `emit1( public1, private1, public2)` is not allowed. Instead it must be ordered like `emit( public1, public2, private1 )`
    'phetioPrivate'
  ].concat( ValidatorDef.VALIDATOR_KEYS );

  // helper closures
  const paramToPhetioType = param => param.phetioType;
  const paramToTypeName = param => param.phetioType.typeName;

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

        // {function(new:function(new:ObjectIO),...function(new:ObjectIO))} - The non parameterized TypeIO, because
        // passing in parameters. Override this to create a subtype of ActionIO as the phetioType instead of a
        // parameterized ActionIO Type.
        phetioOuterType: ActionIO,
        phetioState: false,
        phetioPlayback: PhetioObject.DEFAULT_OPTIONS.phetioPlayback,
        phetioEventMetadata: PhetioObject.DEFAULT_OPTIONS.phetioEventMetadata,
        phetioDocumentation: 'A function that executes.'
      }, options );

      // TODO: do we need the supplied check here? https://github.com/phetsims/axon/issues/257
      assert && Action.validateParameters( options.tandem.supplied, options.parameters );
      assert && assert( typeof action === 'function', 'action should be a function' );
      assert && assert( options.phetioType === undefined,
        'Action sets its own phetioType. Instead provide parameter phetioTypes through `options.parameters`' );

      // {Object[]} - list of parameters, see options.parameters. Filter out phetioPrivate parameters, all `phetioPrivate`
      // parameters will not have a `phetioType`, see `validateParameters`.
      const phetioPublicParameters = options.parameters.filter( paramToPhetioType );

      options.phetioType = getActionIOFromCache( options.phetioOuterType, phetioPublicParameters );

      // phetioPlayback events need to know the order the arguments occur in order to call EmitterIO.emit()
      // Indicate whether the event is for playback, but leave this "sparse"--only indicate when this happens to be true
      if ( options.phetioPlayback ) {
        options.phetioEventMetadata = options.phetioEventMetadata || {};

        assert && assert( !options.phetioEventMetadata.hasOwnProperty( 'dataKeys' ),
          'dataKeys should be supplied by Action, not elsewhere' );

        options.phetioEventMetadata.dataKeys = options.parameters.map( parmeter => parmeter.name );
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
     * @param {boolean} isPhetioInstrumented
     * @param {object} parameters
     */
    static validateParameters( isPhetioInstrumented, parameters ) {

      // validate the parameters object
      validate( parameters, { valueType: Array } );

      // Action only supports phetioPrivate parameters at the end of the emit call, so once we hit the first phetioPrivate
      // parameter, then assert that the rest of them afterwards are as well.
      let reachedPhetioPrivate = false;
      for ( let i = 0; i < parameters.length; i++ ) {
        const parameter = parameters[ i ]; // metadata about a single parameter

        assert && assert( parameter.validateOptionsOnValidateValue !== true,
          'Action sets its own validateOptionsOnValidateValue for each argument type'
        );
        assert && assert( Object.getPrototypeOf( parameter ) === Object.prototype,
          'Extra prototype on parameter object is a code smell' );

        reachedPhetioPrivate = reachedPhetioPrivate || parameter.phetioPrivate;
        assert && reachedPhetioPrivate && assert( parameter.phetioPrivate,
          'after first phetioPrivate parameter, all subsequenct parameters must be phetioPrivate' );

        var keys = Object.keys( parameter );
        for ( let i = 0; i < keys.length; i++ ) {
          const key = keys[ i ];
          assert && assert( PARAMETER_KEYS.includes( key ), 'unrecognized parameter key: ' + key );
        }

        assert && isPhetioInstrumented && assert( parameter.phetioType || parameter.phetioPrivate,
          'instrumented Emitters must include phetioType for each parameter or be marked as `phetioPrivate`.' );
        assert && parameter.phetioType && assert( parameter.name,
          '`name` is a required parameter for phet-io instrumented parameters.' );
        assert && assertMutuallyExclusiveOptions( parameter, [ 'phetioPrivate' ], [
          'name', 'phetioType', 'phetioDocumentation'
        ] );

        // TODO: get rid of phetioTYpe check once ValidatorDef supports phetioType
        assert && !parameter.phetioType && assert( Object.keys( _.pick( parameter, ValidatorDef.VALIDATOR_KEYS ) ).length > 0,
          'if phetioType is not provided, parameter must be specified' );

        let containsValidatorKeys = false;
        for ( var prop in parameter ) {
          if ( ValidatorDef.VALIDATOR_KEYS.includes( prop ) ) {
            containsValidatorKeys = true;
            break;
          }
        }

        // TODO: is this taking up too much memory? Does this create too much garbage? https://github.com/phetsims/axon/issues/257
        parameters[ i ] = _.extend( {
          validateOptionsOnValidateValue: false,
          containsValidatorKeys: containsValidatorKeys
        }, parameter );

        // validate the options passed in to validate each Action argument
        // TODO: surely this is not the most efficient way to do this, https://github.com/phetsims/axon/issues/257
        containsValidatorKeys && ValidatorDef.validateValidator( parameter );
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
      if ( this._parameters.length > 0 ) {

        // Enumerate named argsObject for the data stream.
        data = {};
        for ( let i = 0; i < this._parameters.length; i++ ) {
          const element = this._parameters[ i ];
          if ( !element.phetioPrivate ) {
            data[ element.name ] = element.phetioType.toStateObject( arguments[ i ] );
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
        var docText = param.phetioDocumentation ? '. ' + param.phetioDocumentation : '';

        return `<li>${param.name}: ${param.phetioType.typeName}${docText}</li>`;
      };

      return currentPhetioDocumentation + ( parameters.length === 0 ? ' No arguments.' : ' The arguments are:<br>' +
             '<ol>' + parameters.map( paramToDocString ).join( '\n' ) + '</ol>' );
    }

    /**
     * @override
     * @public
     */
    dispose() {

      // recompute public parameters instead of storing them on each emitter. This tradeoff assumes that dispose happens
      // relatively infrequently compared to the space needed to store another array on each Action instance.
      removeActionIOFromCache( this._phetioOuterType, this._parameters.filter( paramToPhetioType ) );

      super.dispose();
    }

    /**
     * Invokes the action.
     * @params - expected parameters are based on options.parameters, see constructor
     * @public
     */
    execute() {
      if ( assert ) {
        assert( arguments.length === this._parameters.length,
          `Emitted unexpected number of args. Expected: ${this._parameters.length} and received ${arguments.length}`
        );
        for ( let i = 0; i < this._parameters.length; i++ ) {
          const parameter = this._parameters[ i ];
          if ( parameter.containsValidatorKeys ) {
            validate( arguments[ i ], parameter );
          }

          // valueType overrides the phetioType validator so we don't use that one if there is a valueType
          if ( parameter.phetioType && !this._parameters.valueType ) {
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

  /**
   *
   * @param {function} phetioOuterType - a un parameterized parametric TypeIO
   * @param {Object[]} phetioPublicParameters - see options.parameters, but only the public ones (see phetioPrivate)
   * @returns {string} - unique id to access the cache and get the right TypeIO
   */
  const getUniqueTypeName = ( phetioOuterType, phetioPublicParameters ) => {

    // TODO: the name in built mode will be minified, is that still ok? https://github.com/phetsims/axon/issues/257
    return phetioOuterType.name + '.' + phetioPublicParameters.map( paramToTypeName ).join( ',' );
  };

  /**
   * @param {function} phetioOuterType - a un parameterized parametric TypeIO
   * @param {Object[]} phetioPublicParameters - see options.parameters, but only the public ones (see phetioPrivate)
   * @returns {function(new:ObjectIO)} - phetioType
   */
  const getActionIOFromCache = ( phetioOuterType, phetioPublicParameters ) => {

    // This is not the name passed to the parameter, but instead of function constructor name.
    const uniqueTypeNameKey = getUniqueTypeName( phetioOuterType, phetioPublicParameters );
    if ( TYPE_IO_CACHE[ uniqueTypeNameKey ] ) {
      TYPE_IO_CACHE[ uniqueTypeNameKey ].count += 1;
    }
    else {

      // set a new object on that key
      TYPE_IO_CACHE[ uniqueTypeNameKey ] = {
        count: 1, // This is already the first one
        phetioType: phetioOuterType( phetioPublicParameters.map( paramToPhetioType ) )
      };
    }
    return TYPE_IO_CACHE[ uniqueTypeNameKey ].phetioType;
  };

  /**
   * Remove a phetioType from the cache
   * @param {function} phetioOuterType - a un parameterized parametric TypeIO
   * @param {Object[]} phetioPublicParameters - see options.parameters, but only the public ones (see phetioPrivate)
   */
  const removeActionIOFromCache = ( phetioOuterType, phetioPublicParameters ) => {
    const uniqueTypeNameKey = getUniqueTypeName( phetioOuterType, phetioPublicParameters );
    assert && assert( TYPE_IO_CACHE[ uniqueTypeNameKey ], `type name key is not in cache: ${uniqueTypeNameKey}` );
    TYPE_IO_CACHE[ uniqueTypeNameKey ].count -= 1;
    if ( TYPE_IO_CACHE[ uniqueTypeNameKey ].count === 0 ) {
      delete TYPE_IO_CACHE[ uniqueTypeNameKey ];
    }
  };

  return axon.register( 'Action', Action );
} );