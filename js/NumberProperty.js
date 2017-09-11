// Copyright 2016, University of Colorado Boulder

/**
 * Property whose value must be a number, with optional range validation.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Property = require( 'AXON/Property' );
  var TNumber = require( 'ifphetio!PHET_IO/types/TNumber' );

  // constants
  /**
   * @param {*} value
   * @returns {boolean}
   */
  var IS_NUMBER = function( value ) {
    return ( typeof value === 'number' );
  };

  // valid values for options.units // TODO: Should this be an enum?  @zepumph says probably
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

  // values for options.type
  var VALID_TYPE_VALUES = [ 'FloatingPoint', 'Integer' ];

  /**
   * @param {number} value - initial value
   * @param {Object} [options]
   * @constructor
   */
  function NumberProperty( value, options ) {

    options = _.extend( {
      range: null, // {null|Range|{min:number, max:number}} range of the value
      phetioValueType: TNumber,
      valueType: 'FloatingPoint', // 'FloatingPoint' | 'Integer'
      units: null
    }, options );

    assert && assert( !options.validValues, 'NumberProperty cannot use validValues' );
    assert && assert( !options.isValidValue, 'NumberProperty implements its own isValidValue' );

    options.units && assert && assert( _.includes( VALID_UNITS, options.units ), 'Invalid units: ' + options.units );
    assert && assert( _.includes( VALID_TYPE_VALUES, options.valueType ), 'invalid type: ' + options.valueType );

    // @public (read-only) {string} units from above
    this.units = options.units;

    if ( options.range ) {
      options.isValidValue = function( value ) {
        return IS_NUMBER( value ) && ( value >= options.range.min ) && ( value <= options.range.max );
      };
    }
    else {
      options.isValidValue = IS_NUMBER;
    }

    // TODO: this seems like duplication--can it be avoided or standardized?
    // TODO: Do not use this, we are trying to replace it with something better soon.
    this.phetioInstanceMetadata = {
      range: options.range,
      units: this.units,
      valueType: options.valueType
    };

    Property.call( this, value, options );
  }

  axon.register( 'NumberProperty', NumberProperty );

  return inherit( Property, NumberProperty );
} );