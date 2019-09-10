// Copyright 2016-2019, University of Colorado Boulder

/**
 * Property whose value must be a number.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );
  const NumberPropertyIO = require( 'AXON/NumberPropertyIO' );
  const Property = require( 'AXON/Property' );
  const Range = require( 'DOT/Range' );
  const validate = require( 'AXON/validate' );

  // constants
  const VALID_NUMBER_TYPES = NumberPropertyIO.VALID_NUMBER_TYPES;
  const VALID_INTEGER = { valueType: 'number', isValidValue: v => v % 1 === 0 };

  class NumberProperty extends Property {

    /**
     * @param {number} value - initial value
     * @param {Object} [options]
     * @constructor
     */
    constructor( value, options ) {

      options = _.extend( {
        numberType: 'FloatingPoint', // {string} see VALID_NUMBER_TYPES

        // {Range|null} range
        range: null,

        // {number|null} step - used by PhET-iO Studio to control this Property
        step: null
      }, options );

      assert && assert( _.includes( VALID_NUMBER_TYPES, options.numberType ), 'invalid numberType: ' + options.numberType );
      assert && options.range && assert( options.range instanceof Range, 'options.range must be of type Range:' + options.range );
      assert && options.step && assert( typeof options.step === 'number', 'options.step must be of type step:' + options.step );

      // client cannot specify superclass options that are controlled by NumberProperty
      assert && assert( !options.valueType, 'NumberProperty sets valueType' );
      assert && assert( !options.hasOwnProperty( 'phetioType' ), 'NumberProperty sets phetioType' );

      // Fill in superclass options that are controlled by NumberProperty.
      options = _.extend( {
        valueType: 'number',
        phetioType: NumberPropertyIO
      }, options );

      super( value, options );

      // @public (read-only) - used by PhET-iO in NumberPropertyIO as metadata passed to the wrapper.
      this.numberType = options.numberType;

      // @public {Range|null} (read-only) - If defined, provides the range of possible values (inclusive)
      this.range = options.range;

      // @public {number|null} (read-only - If defined, provides a step that the NumberProperty can be
      // incremented/decremented.
      this.step = options.step;

      // @private {function|null} value validation that is specific to NumberProperty, null if assertions are disabled
      this.assertNumberPropertyValidateValue = assert && ( value => {

        // validate for integer
        options.numberType === 'Integer' && validate( value, VALID_INTEGER );

        // validate for range
        options.range && validate( value, { isValidValue: v => options.range.contains( v ) } );
      } );

      // verify that validValues meet other NumberProperty-specific validation criteria
      if ( options.validValues && this.assertNumberPropertyValidateValue ) {
        options.validValues.forEach( this.assertNumberPropertyValidateValue );
      }

      // validate initial value
      this.assertNumberPropertyValidateValue && this.assertNumberPropertyValidateValue( value );
    }

    /**
     * Performs value validation that is specific to NumberProperty.
     * Then sets the value and notifies listeners.
     * @param {*} value
     * @public
     * @override
     */
    set( value ) {

      // TODO: should be handled in the super, see https://github.com/phetsims/axon/issues/253
      this.assertNumberPropertyValidateValue && this.assertNumberPropertyValidateValue( value );
      super.set( value );
    }
  }

  return axon.register( 'NumberProperty', NumberProperty );
} );