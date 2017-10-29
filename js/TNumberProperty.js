// Copyright 2017, University of Colorado Boulder

/**
 * PhET-iO wrapper type for phet's NumberProperty type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var TProperty = require( 'AXON/TProperty' );

  // phet-io modules
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertions/assertInstanceOf' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var TNumber = require( 'ifphetio!PHET_IO/types/TNumber' );

  // constants
  var VALUE_TYPE = TNumber; // It's a NumberProperty.
  var TPropertyImpl = TProperty( VALUE_TYPE );

  /**
   * NumberProperty wrapper type.
   * @constructor
   */
  function TNumberProperty( property, phetioID ) {
    assertInstanceOf( property, phet.axon.NumberProperty );
    TPropertyImpl.call( this, property, phetioID );
  }

  axon.register( 'TNumberProperty', TNumberProperty );

  phetioInherit( TPropertyImpl, 'TNumberProperty', TNumberProperty, {}, {

    getAPI: function() {
      return {
        valueType: phet.phetIo.phetio.getAPIForType( VALUE_TYPE )
      };
    },

    /**
     * Decodes a state into a NumberProperty.
     * @param {Object} stateObject
     * @returns {Object}
     */
    fromStateObject: function( stateObject ) {
      var fromParentStateObject = TPropertyImpl.fromStateObject( stateObject );
      fromParentStateObject.valueType = stateObject.valueType;
      fromParentStateObject.units = stateObject.units;
      fromParentStateObject.range = stateObject.range;
      return fromParentStateObject;
    },

    /**
     * Encodes a NumberProperty instance to a state.
     * @param {Object} instance
     * @returns {Object} - a state object
     */
    toStateObject: function( instance ) {
      assert && assert( instance, 'instance should be defined' );

      var parentStateObject = TPropertyImpl.toStateObject( instance );
      parentStateObject.valueType = instance.valueType;
      parentStateObject.units = instance.units;
      parentStateObject.range = instance.range;
      return parentStateObject;
    },

    setValue: function( instance, fromStateObject ) {
      TProperty.setValue( instance, fromStateObject );
      instance.units = fromStateObject.units;
      instance.range = fromStateObject.range;
      instance.valueType = fromStateObject.valueType;
    },

    documentation: 'Numeric property model'
  } );

  return TNumberProperty;
} );