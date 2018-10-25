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
  var NumberPropertyIO = require( 'AXON/NumberPropertyIO' );
  var Property = require( 'AXON/Property' );
  var Range = require( 'DOT/Range' );

  // constants
  var VALID_NUMBER_TYPES = NumberPropertyIO.VALID_NUMBER_TYPES;

  /**
   * @param {number} value - initial value
   * @param {Object} [options]
   * @constructor
   */
  function NumberProperty( value, options ) {

    options = _.extend( {
      numberType: 'FloatingPoint', // {string} see VALID_VALUE_TYPES

      // {Range|null} range
      range: null,
      phetioType: NumberPropertyIO
    }, options );

    assert && assert( _.includes( VALID_NUMBER_TYPES, options.numberType ), 'invalid numberType: ' + options.numberType );
    options.range && assert && assert( options.range instanceof Range, 'options.range must be of type Range:' + options.range );

    // @public (read-only) - used by PhET-iO in NumberPropertyIO as metadata passed to the wrapper.
    this.numberType = options.numberType;
    this.range = options.range;

    assert && assert( !options.valueType, 'valueType is set by NumberProperty' );
    options.valueType = 'number';

    // @private {function|null} value validation that is specific to NumberProperty, null if assertions are disabled
    this.assertNumberPropertyValidateValue = assert && function( value ) {
      if ( options.numberType === 'Integer' ) {
        assert( value % 1 === 0, 'numberType was Integer but value was ' + value );
      }
      options.range && assert( value >= options.range.min && value <= options.range.max,
        'value is out of range, value=' + value + ', range=[' + options.range.min + ',' + options.range.max + ']' );
    };

    // verify that validValues meet other NumberProperty-specific validation criteria
    if ( options.validValues && this.assertNumberPropertyValidateValue ) {
      options.validValues.forEach( this.assertNumberPropertyValidateValue );
    }

    // validate initial value
    this.assertNumberPropertyValidateValue && this.assertNumberPropertyValidateValue( value );

    Property.call( this, value, options );
  }

  axon.register( 'NumberProperty', NumberProperty );

  return inherit( Property, NumberProperty, {

    /**
     * Performs value validation that is specific to NumberProperty.
     * Then sets the value and notifies listeners.
     * @param {*} value
     * @public
     * @override
     */
    set: function( value ) {
      this.assertNumberPropertyValidateValue && this.assertNumberPropertyValidateValue( value );
      Property.prototype.set.call( this, value );
    }
  } );
} );