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
  var axon = require( 'AXON/axon' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Property = require( 'AXON/Property' );
  var PropertyIO = require( 'AXON/PropertyIO' );
  var StringIO = require( 'TANDEM/types/StringIO' );

  // constants
  var StringPropertyIO = PropertyIO( StringIO );

  /**
   * @param {string} value - initial value
   * @param {Object} [options]
   * @constructor
   */
  function StringProperty( value, options ) {

    options = options || {};

    assert && assert( !options.valueType, 'valueType is set by StringProperty' );
    options.valueType = 'string';

    assert && assert( !options.hasOwnProperty( 'phetioType' ), 'phetioType is set by StringProperty' );
    options.phetioType = StringPropertyIO;

    Property.call( this, value, options );
  }

  axon.register( 'StringProperty', StringProperty );

  return inherit( Property, StringProperty );
} );