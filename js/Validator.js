// Copyright 2018, University of Colorado Boulder

/**
 * Throws assertion errors if a value doesn't match the specified criteria.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );

  // constants
  const TYPEOF_STRINGS = [ 'string', 'number', 'boolean', 'function' ];

  // Key names are verbose so this can be mixed into other contexts like AXON/Property. `undefined` and `null` have the
  // same semantics so that we can use this feature without having extend and allocate new objects at every validation.
  const DEFAULT_OPTIONS = {

    // {function|string|null} type of the value.
    // If {function}, the function must be a constructor.
    // If {string}, the string must be one of the primitive types listed in TYPEOF_STRINGS.
    // Unused if null.
    // Examples:
    // valueType: Vector2
    // valueType: 'string'
    // valueType: 'number'
    valueType: null,

    // {*[]|null} valid values for this Property. Unused if null.
    // Example:
    // validValues: [ 'horizontal', 'vertical' ]
    validValues: null,

    // {function|null} function that validates the value. Single argument is the value, returns boolean. Unused if null.
    // Example:
    // isValidValue: function( value ) { return Util.isInteger( value ) && value >= 0; }
    isValidValue: null,

    // By default, always check the provided options.  Can be turned off for cases where the same options are used
    // repeatedly, such as in Property
    validateOptionsOnValidateValue: true
  };

  const DEFAULT_OPTIONS_KEYS = _.keys( DEFAULT_OPTIONS );

  const Validator = {

    /**
     * Throws an assertion error if assertions are enabled and the value is invalid, otherwise returns the value.
     * @param {Object|null} value
     * @param {Object} [options]
     * @returns {Object|null} - returns the value for chaining
     * @public
     */
    validate: ( value, options ) => {

      if ( assert ) {

        // validate options, but allow opting out for improved performance for repeat cases like Property
        options.validateOptionsOnValidateValue && Validator.validateOptions( options );

        // TODO: now that we have Validator, do we still want to overload valueType?  Or split it up into:
        // TODO: {valueTypeOf: 'boolean'} vs {valueInstanceOf: 'Vector2'}
        // See https://github.com/phetsims/axon/issues/201
        if ( options.valueType ) {
          const valueType = options.valueType;
          if ( typeof valueType === 'string' ) { // primitive type
            assert( typeof value === valueType, 'value should have typeof ' + valueType + ', value=' + value );
          }
          else if ( typeof valueType === 'function' ) { // constructor
            assert( value instanceof valueType, 'value should be instanceof ' + valueType.name + ', value=' + value );
          }
        }
        options.validValues && assert( options.validValues.indexOf( value ) >= 0, `value not in validValues: ${value}` );
        options.isValidValue && assert( options.isValidValue( value ), `value failed isValidValue: ${value}` );

        // Passed all tests, so it is a valid value.
        return value;
      }
      else {

        // asserts are not enabled, so any value is valid
        return value;
      }
    },

    /**
     * Throws assertions errors if the options to Validator.validate are themselves invalid.
     * @param {Object} [options]
     * @public
     */
    validateOptions: options => {
      if ( assert ) {
        const valueType = options.valueType;
        assert(
          typeof valueType === 'function' ||
          typeof valueType === 'string' ||
          valueType === null ||
          valueType === undefined,
          'valueType must be {function|string|null}, valueType=' + valueType
        );

        // {string} valueType must be one of the primitives in TYPEOF_STRINGS, for typeof comparison
        if ( typeof valueType === 'string' ) {
          assert( _.includes( TYPEOF_STRINGS, valueType ), 'valueType not a supported primitive types: ' + valueType );
        }

        if ( options.hasOwnProperty( 'isValidValue' ) ) {
          assert(
            options.isValidValue === null ||
            typeof options.isValidValue === 'function' ||
            options.isValidValue === undefined,
            'isValidValue must be a function: ' + options.isValidValue
          );
        }

        if ( options.validValues !== undefined && options.validValues !== null ) {
          assert( Array.isArray( options.validValues ), 'validValues must be an array: ' + options.validValues );

          // Make sure each initial value is valid.
          const remainingOptions = _.omit( options, 'validValues' );
          options.validValues.forEach( v => Validator.validate( v, remainingOptions ) );
        }
      }
      else {
        return true;
      }
    },

    /**
     * Get only the options that are used by Validator
     * @param {Object} [options]
     * @returns {Object}
     * @public
     */
    pickOptions: options => _.pick( options, DEFAULT_OPTIONS_KEYS )
  };

  Validator.DEFAULT_OPTIONS = DEFAULT_OPTIONS;

  return axon.register( 'Validator', Validator );
} );