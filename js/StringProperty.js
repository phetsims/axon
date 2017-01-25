// Copyright 2016, University of Colorado Boulder

/**
 * Convenience subclass of Property that constrains values to be a string.
 * Truthy/falsy values are considered invalid.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Property = require( 'AXON/Property' );
  var axon = require( 'AXON/axon' );

  // phet-io modules
  var TString = require( 'ifphetio!PHET_IO/types/TString' );

  // constants
  /**
   * @param value
   * @returns {boolean}
   */
  var IS_STRING = function( value ) {
    return typeof value === 'string';
  };

  /**
   * Convenience constructor that constrains values to be a string.
   * @param {string} value - initial value
   * @param {Object} [options]
   * @constructor
   */
  function StringProperty( value, options ) {
    assert && assert( !options || !options.phetioValueType, 'phetioValueType is provided by StringProperty' );
    options = _.extend( {
      phetioValueType: TString,
      isValidValue: IS_STRING // Default to using a type test, but allow it to be overriden with a more specific test
    }, options );
    assert && assert( !options.validValues, 'StringProperty cannot use validValues' );

    Property.call( this, value, options );
  }

  axon.register( 'StringProperty', StringProperty );

  return inherit( Property, StringProperty );
} );