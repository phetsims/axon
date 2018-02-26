// Copyright 2016-2018, University of Colorado Boulder

/**
 * Convenience subtype of Property that constrains values to be true or false.
 * Truthy/falsy values are considered invalid.
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
  var PropertyIO = require( 'AXON/PropertyIO' );

  // phet-io modules
  var BooleanIO = require( 'ifphetio!PHET_IO/types/BooleanIO' );

  /**
   * @param {boolean} value - initial value
   * @param {Object} [options]
   * @constructor
   */
  function BooleanProperty( value, options ) {

    options = _.extend( {
      phetioType: PropertyIO( BooleanIO )
    }, options );

    // configure value validation options
    assert && assert( !options.valueType, 'valueType is set by BooleanProperty' );
    options.valueType = 'boolean';
    assert && assert( !options.isValidValue, 'isValidValue is not supported by BooleanProperty' );
    assert && assert( !options.validValues, 'validValues is not supported by BooleanProperty' );

    Property.call( this, value, options );
  }

  axon.register( 'BooleanProperty', BooleanProperty );

  return inherit( Property, BooleanProperty );
} );