// Copyright 2016-2018, University of Colorado Boulder

/**
 * Property whose value must be a number.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Property = require( 'AXON/Property' );
  var NumberPropertyIO = require( 'AXON/NumberPropertyIO' );

  // valid values for options.units (or it can be null)
  var VALID_UNITS = [
    'amperes',
    'milliamperes',
    'becquerels',
    'centimeters',
    'centimeters-squared',
    'coulombs',
    'degrees Celsius',
    'farads',
    'kilograms',
    'grams',
    'gray',
    'henrys',
    'henries',
    'hertz',
    'joules',
    'katals',
    'kelvins',
    'liters',
    'liters/second',
    'lumens',
    'lux',
    'meters',
    'meters/second',
    'meters/second/second',
    'moles',
    'moles/liter',
    'nanometers',
    'newtons',
    'newtons/meters',
    'newtons-second/meters',
    'ohms',
    'ohm-centimeters',
    'pascals',
    'percent',
    'radians',
    'radians/second',
    'seconds',
    'siemens',
    'sieverts',
    'steradians',
    'tesla',
    'view-coordinates/second',
    'volts',
    'watts',
    'webers'
  ];

  // valid values for options.numberType to convey whether it is continuous or discrete with step size 1
  var VALID_NUMBER_TYPES = [ 'FloatingPoint', 'Integer' ];

  /**
   * @param {number} value - initial value
   * @param {Object} [options]
   * @constructor
   */
  function NumberProperty( value, options ) {

    var self = this;

    options = _.extend( {
      numberType: 'FloatingPoint', // {string} see VALID_VALUE_TYPES
      range: null, // {Range|{min:number, max:number}|null} range of the value
      phetioType: NumberPropertyIO,
      units: null // {string|null} units for the number, see VALID_UNITS
    }, options );

    assert && assert( _.includes( VALID_NUMBER_TYPES, options.numberType ), 'invalid numberType: ' + options.numberType );
    options.range && assert && assert( isValidRange( options.range ), 'invalid range: ' + options.range );
    options.units && assert && assert( _.includes( VALID_UNITS, options.units ), 'invalid units: ' + options.units );

    // @public (read-only) - used by PhET-iO in NumberPropertyIO as metadata passed to the wrapper.
    this.numberType = options.numberType;
    this.range = options.range;
    this.units = options.units;

    assert && assert( !options.valueType, 'valueType is set by NumberProperty' );
    options.valueType = 'number';

    // @private {function|null} value validation that is specific to NumberProperty, null if assertions are disabled
    this.assertNumberPropertyValidateValue = assert && function( value ) {
      assert( !( options.numberType === 'Integer' && value % 1 !== 0 ),
        'value has incorrect numberType, value=' + value + ', numberType=' + options.numberType );
      options.range && assert( value >= options.range.min && value <= options.range.max,
        'value is out of range, value=' + value + ', range=[' + options.range.min + ',' + options.range.max + ']' );
    };

    // verify that validValues meet other NumberProperty-specific validation criteria
    if ( this.assertNumberPropertyValidateValue && options.validValues ) {
      options.validValues.forEach( function( value ) {
        self.assertNumberPropertyValidateValue( value );
      } );
    }

    Property.call( this, value, options );

    // Perform value validation that is specific to NumberProperty.
    assert && self.link( function( value ) {
      self.assertNumberPropertyValidateValue( value );
    } );
  }

  axon.register( 'NumberProperty', NumberProperty );

  /**
   * Validates a range value.
   * @param {{min:number, max:number}} range
   * @returns {boolean}
   */
  function isValidRange( range ) {
    return ( typeof range === 'object' ) && range.hasOwnProperty( 'min' ) && range.hasOwnProperty( 'max' );
  }

  return inherit( Property, NumberProperty );
} );