// Copyright 2016-2017, University of Colorado Boulder

/**
 * Convenience subtype of Property that constrains values to be a string.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Property = require( 'AXON/Property' );

  // phet-io modules
  var TString = require( 'ifphetio!PHET_IO/types/TString' );

  /**
   * @param {string} value - initial value
   * @param {Object} [options]
   * @constructor
   */
  function StringProperty( value, options ) {

    options = options || {};

    assert && assert( !options.phetioValueType, 'phetioValueType is set by StringProperty' );
    options.phetioValueType = TString;

    if ( options.validValues ) {
      assert && assert( _.every( options.validValues, isString ), 'validValues must be strings' );
    }

    if ( options.isValidValue ) {

      // Wrap the provided function so that we can verify that the value is a string.
      // This prevents the client from having to check (or remember to check) that the value is a string.
      var isValidValue = options.isValidValue;
      options.isValidValue = function( value ) {
        return isString( value ) && isValidValue( value );
      };
    }
    else if ( !options.validValues ) {

      // fallback to verifying that the value is a string
      options.isValidValue = isString;
    }

    Property.call( this, value, options );
  }

  axon.register( 'StringProperty', StringProperty );

  /**
   * @param {*} value
   * @returns {boolean}
   */
  function isString( value ) {
    return ( typeof value === 'string' );
  }

  return inherit( Property, StringProperty );
} );