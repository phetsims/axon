// Copyright 2016-2017, University of Colorado Boulder

/**
 * Convenience subtype of Property that constrains values to be true or false.
 * Truthy/falsy values are considered invalid.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Property = require( 'AXON/Property' );

  // phet-io modules
  var TBoolean = require( 'ifphetio!PHET_IO/types/TBoolean' );

  /**
   * @param {boolean} value - initial value
   * @param {Object} [options]
   * @constructor
   */
  function BooleanProperty( value, options ) {

    options = options || {};

    assert && assert( !options.phetioValueType, 'phetioValueType is provided by BooleanProperty' );
    options.phetioValueType = TBoolean;

    assert && assert( !options.isValidValue, 'isValidValue is provided by BooleanProperty' );
    options.isValidValue = isBoolean;

    assert && assert( !options.validValues, 'validValues is not supported by BooleanProperty' );

    Property.call( this, value, options );
  }

  axon.register( 'BooleanProperty', BooleanProperty );

  /**
   * @param {*} value
   * @returns {boolean}
   */
  function isBoolean( value ) {
    return ( typeof value === 'boolean' );
  }

  return inherit( Property, BooleanProperty );
} );