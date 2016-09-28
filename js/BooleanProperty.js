// Copyright 2016, University of Colorado Boulder

/**
 * Convenience subclass of Property that constrains values to be true or false.
 * (note: truthy/falsy values are not accepted).
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Property = require( 'AXON/Property' );
  var axon = require( 'AXON/axon' );

  // constants
  /**
   * @param value
   * @returns {boolean}
   */
  var IS_BOOLEAN = function( value ) {
    return typeof value === 'boolean';
  };

  /**
   * Convenience constructor that constrains values to be true/false.
   * @param {boolean} value - initial value
   * @param {Object} [options]
   * @constructor
   */
  function BooleanProperty( value, options ) {

    options = options || {};
    assert && assert( !options.validValues, 'BooleanProperty cannot use validValues' );
    assert && assert( !options.isValidValue, 'BooleanProperty implements its own isValidValue' );
    options.isValidValue = IS_BOOLEAN;

    Property.call( this, value, options );
  }

  axon.register( 'BooleanProperty', BooleanProperty );

  return inherit( Property, BooleanProperty );
} );