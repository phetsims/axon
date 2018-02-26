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
  var StringIO = require( 'ifphetio!PHET_IO/types/StringIO' );

  /**
   * @param {string} value - initial value
   * @param {Object} [options]
   * @constructor
   */
  function StringProperty( value, options ) {

    options = _.extend( {
      phetioType: StringIO
    }, options );

    assert && assert( !options.valueType, 'valueType is set by StringProperty' );
    options.valueType = 'string';

    Property.call( this, value, options );
  }

  axon.register( 'StringProperty', StringProperty );

  return inherit( Property, StringProperty );
} );