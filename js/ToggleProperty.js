//  Copyright 2002-2014, University of Colorado Boulder

/**
 * The ToggleProperty represents a Property<Boolean> mapped from another Property<Object> that can take one of two values.  If another value is specified, an error will be thrown.
 * This property provides two way binding between the source Property<Object> and the Property<Boolean>,
 * setting the value on the ToggleProperty propagates the cange back to the source Property, and vice versa.
 * It is used in RectangularStickyToggleButton, for example.
 *
 * TODO: Can/Should this be rewritten using Property.map or Property.invertibleMap or related functions?
 *
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  var axon = require( 'AXON/axon' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Property = require( 'AXON/Property' );

  /**
   * Main constructor for ToggleButton
   *
   * @param valueA {Object} the "off" or "false" value
   * @param valueB {Object} the "on" on "true" value
   * @param property the source Property that can take values valueA and valueB
   * @constructor
   */
  axon.ToggleProperty = function ToggleProperty( valueA, valueB, property ) {

    Property.call( this, property.value === valueB );
    var toggleProperty = this;

    property.link( function( value ) {
      if ( value !== valueA && value !== valueB ) {
        throw new Error( 'ToggleProperty had invalid value: ' + value );
      }
      toggleProperty.value = value === valueB;
    } );
    this.link( function( pressed ) {
      property.value = pressed ? valueB : valueA;
    } );
  };

  return inherit( axon.Property, axon.ToggleProperty );
} );