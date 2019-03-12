// Copyright 2016-2019, University of Colorado Boulder

/**
 * Property whose value must be a string.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( function( require ) {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );
  const Property = require( 'AXON/Property' );
  const PropertyIO = require( 'AXON/PropertyIO' );
  const StringIO = require( 'TANDEM/types/StringIO' );

  // constants
  const StringPropertyIO = PropertyIO( StringIO );

  class StringProperty extends Property {

    /**
     * @param {string} value - initial value
     * @param {Object} [options]
     * @constructor
     */
    constructor( value, options ) {

      // client cannot specify superclass options that are controlled by StringProperty
      if ( options ) {
        assert && assert( !options.hasOwnProperty( 'valueType' ), 'StringProperty sets valueType' );
        assert && assert( !options.hasOwnProperty( 'phetioType' ), 'StringProperty sets phetioType' );
      }

      // Fill in superclass options that are controlled by StringProperty.
      options = _.extend( {
        valueType: 'string',
        phetioType: StringPropertyIO
      }, options );

      super( value, options );
    }
  }

  return axon.register( 'StringProperty', StringProperty );
} );