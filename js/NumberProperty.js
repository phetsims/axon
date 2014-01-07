// Copyright 2002-2013, University of Colorado Boulder

/**
 * NumberProperty extends Property<Number> and adds functions specific to numbers, such as <, >.
 * TODO: Let's discuss creating these automatically in PropertySets
 *
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  var axon = require( 'AXON/axon' );
  var DerivedProperty = require( 'AXON/DerivedProperty' );
  var inherit = require( 'PHET_CORE/inherit' );

  //See http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
  function isNumber( n ) {
    return !isNaN( parseFloat( n ) ) && isFinite( n );
  }

  /**
   * @param {number} value
   * @constructor
   */
  axon.NumberProperty = function NumberProperty( value ) {
    assert && assert( isNumber( value ) );
    axon.Property.call( this, value );
  };

  return inherit( axon.Property, axon.NumberProperty, {
    lessThanNumber: function( number ) {
      return new DerivedProperty( [this], function( thisValue ) { return thisValue < number; } );
    },
    greaterThanNumber: function( number ) {
      return new DerivedProperty( [this], function( thisValue ) { return thisValue > number; } );
    }
  } );
} );