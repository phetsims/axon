// Copyright 2016, University of Colorado Boulder

/**
 * Property whose value must be a number, with optional range validation.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Property = require( 'AXON/Property' );
  var axon = require( 'AXON/axon' );

  // constants
  /**
   * @param {*} value
   * @returns {boolean}
   */
  var IS_NUMBER = function( value ) {
    return ( typeof value === 'number' );
  };

  /**
   * @param {number} value - initial value
   * @param {Object} [options]
   * @constructor
   */
  function NumberProperty( value, options ) {

    options = _.extend( {
      range: null // {null|Range|{min:number, max:number}} range of the value
    }, options );

    assert && assert( !options.validValues, 'NumberProperty cannot use validValues' );
    assert && assert( !options.isValidValue, 'NumberProperty implements its own isValidValue' );

    if ( options.range ) {
      options.isValidValue = function( value ) {
        return IS_NUMBER( value ) && ( value >= options.range.min ) && ( value <= options.range.max );
      };
    }
    else {
      options.isValidValue = IS_NUMBER;
    }

    Property.call( this, value, options );
  }

  axon.register( 'NumberProperty', NumberProperty );

  return inherit( Property, NumberProperty );
} );