// Copyright 2016-2018, University of Colorado Boulder

/**
 * Convenience subtype of Property that constrains values to be a string.
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

      options = options || {};

      assert && assert( !options.valueType, 'valueType is set by StringProperty' );
      options.valueType = 'string';

      assert && assert( !options.hasOwnProperty( 'phetioType' ), 'phetioType is set by StringProperty' );
      options.phetioType = StringPropertyIO;

      super( value, options );
    }
  }

  return axon.register( 'StringProperty', StringProperty );
} );