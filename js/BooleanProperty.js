// Copyright 2016-2018, University of Colorado Boulder

/**
 * Convenience subtype of Property that constrains values to be true or false.
 * Truthy/falsy values are considered invalid.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );
  const BooleanIO = require( 'TANDEM/types/BooleanIO' );
  const Property = require( 'AXON/Property' );
  const PropertyIO = require( 'AXON/PropertyIO' );

  // constants
  const BooleanPropertyIO = PropertyIO( BooleanIO );

  class BooleanProperty extends Property {

    /**
     * @param {boolean} value - initial value
     * @param {Object} [options]
     * @constructor
     */
    constructor( value, options ) {

      assert && assert( !options || !options.hasOwnProperty( 'isValidValue' ), 'isValidValue is not supported by BooleanProperty' );
      assert && assert( !options || !options.hasOwnProperty( 'validValues' ), 'validValues is not supported by BooleanProperty' );
      assert && assert( !options || !options.hasOwnProperty( 'valueType' ), 'valueType is set by BooleanProperty' );
      assert && assert( !options || !options.hasOwnProperty( 'phetioType' ), 'phetioType is set by BooleanProperty' );

      super( value, _.extend( {
        valueType: 'boolean', // BooleanProperty requires values to be primitive booleans
        phetioType: BooleanPropertyIO
      } ) );
    }
  }

  return axon.register( 'BooleanProperty', BooleanProperty );
} );