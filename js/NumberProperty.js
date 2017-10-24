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
  var Tandem = require( 'TANDEM/Tandem' );
  var TNumberProperty = require( 'AXON/TNumberProperty' );

  // phet-io modules
  var TNumber = require( 'ifphetio!PHET_IO/types/TNumber' );

  // constants
  /**
   * @param {*} value
   * @returns {boolean}
   */
  var IS_NUMBER = function( value ) {
    return (typeof value === 'number');
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
      valueType: 'FloatingPoint', // {string} 'FloatingPoint' | 'Integer'
      units: null, // {string} units from above
      tandem: Tandem.tandemOptional()
    }, options );
    var numberPropertyTandem = options.tandem;
    options.tandem = numberPropertyTandem.createSupertypeTandem();

    assert && assert( !(options.validValues && options.range), 'validValues and range are mutually exclusive' );
    assert && assert( !options.isValidValue, 'NumberProperty implements its own isValidValue' );

    options.units && assert && assert( _.includes( VALID_UNITS, options.units ), 'Invalid units: ' + options.units );
    assert && assert( _.includes( VALID_TYPE_VALUES, options.valueType ), 'invalid type: ' + options.valueType );

    // @public (read-only) - used by PhET-iO in TNumberProperty as metadata passed to the wrapper.
    this.units = options.units;
    this.range = options.range; // {Range|{min,max}}
    this.valueType = options.valueType;

    if ( options.range ) {
      options.isValidValue = function( value ) {
        return IS_NUMBER( value ) && (value >= options.range.min) && (value <= options.range.max);
      };
    }
    else if ( options.validValues ) {

      // pass through to Property
    }
    else {
      options.isValidValue = IS_NUMBER;
    }

    Property.call( this, value, options );
    numberPropertyTandem.addInstance( this, TNumberProperty, options );
  }

  axon.register( 'NumberProperty', NumberProperty );

  return inherit( Property, NumberProperty );
} );