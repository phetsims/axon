// Copyright 2016-2017, University of Colorado Boulder

/**
 * Property whose value must be a number.
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

  // valid values for options.units
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

  // valid values for options.valueType
  var VALID_VALUE_TYPES = [ 'FloatingPoint', 'Integer' ];

  /**
   * @param {number} value - initial value
   * @param {Object} [options]
   * @constructor
   */
  function NumberProperty( value, options ) {

    options = _.extend( {
      range: null, // {null|Range|{min:number, max:number}} range of the value
      valueType: 'FloatingPoint', // {string} see VALID_VALUE_TYPES
      units: null, // {string|null} see VALID_UNITS
      tandem: Tandem.tandemOptional()
    }, options );

    assert && assert( !options.phetioValueType, 'phetioValueType cannot be supplied for NumberProperty' );
    options.phetioValueType = TNumberProperty.valueType;

    // @private
    this.numberPropertyTandem = options.tandem;
    options.tandem = this.numberPropertyTandem.createSupertypeTandem();

    assert && assert(
      _.filter( [ options.validValues, options.isValidValue, options.range ], function( value ) { return value; } ).length <= 1,
      'validValues, isValidValue and range are mutually-exclusive options' );

    options.units && assert && assert( _.includes( VALID_UNITS, options.units ), 'invalid units: ' + options.units );
    assert && assert( _.includes( VALID_VALUE_TYPES, options.valueType ), 'invalid type: ' + options.valueType );

    // @public (read-only) - used by PhET-iO in TNumberProperty as metadata passed to the wrapper.
    this.units = options.units;
    this.range = options.range;
    this.valueType = options.valueType;

    if ( options.range ) {

      // Add a validation function that includes the range check.
      options.isValidValue = function( value ) {
        return isNumber( value ) && ( value >= options.range.min ) && ( value <= options.range.max );
      };
    }
    else if ( options.validValues ) {

      // Verify that the values are all numbers.
      assert && assert( _.every( options.validValues, function( value ) { return isNumber( value ); },
        'validValues must contain numbers' ) );
    }
    else if ( options.isValidValue ) {

      // Wrap the provided function so that we can verify that the value is a number.
      // This prevents the client from having to check (or remember to check) that the value is a number.
      var isValidValue = options.isValidValue;
      options.isValidValue = function( value ) {
        return isNumber( value ) && isValidValue( value );
      };
    }
    else {

      // fallback to verifying that the value is a string
      options.isValidValue = isNumber;
    }

    Property.call( this, value, options );

    this.numberPropertyTandem.addInstance( this, TNumberProperty, options );
  }

  axon.register( 'NumberProperty', NumberProperty );

  /**
   * @param {*} value
   * @returns {boolean}
   */
  function isNumber( value ) {
    return ( typeof value === 'number' );
  }

  return inherit( Property, NumberProperty, {

    /**
     * @public
     */
    dispose: function() {
      this.numberPropertyTandem.removeInstance( this );
      Property.prototype.dispose.call( this );
    }
  } );
} );