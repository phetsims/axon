// Copyright 2016-2019, University of Colorado Boulder

/**
 * Property whose value must be true or false. Truthy/falsy values are invalid.
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

      if ( options ) {

        // client cannot specify superclass options that are not supported by BooleanProperty
        assert && assert( !options.hasOwnProperty( 'isValidValue' ), 'BooleanProperty does not support isValidValue' );
        assert && assert( !options.hasOwnProperty( 'validValues' ), 'BooleanProperty does not support validValues' );

        // client cannot specify superclass options that are controlled by BooleanProperty
        assert && assert( !options.hasOwnProperty( 'valueType' ), 'BooleanProperty sets valueType' );
        assert && assert( !options.hasOwnProperty( 'phetioType' ), 'BooleanProperty sets phetioType' );
      }

      // Fill in superclass options that are controlled by BooleanProperty.
      options = _.extend( {
        valueType: 'boolean',
        phetioType: BooleanPropertyIO
      }, options );

      super( value, options );
    }
  }

  return axon.register( 'BooleanProperty', BooleanProperty );
} );