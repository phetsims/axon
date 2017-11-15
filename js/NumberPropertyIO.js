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
  var PropertyIO = require( 'AXON/PropertyIO' );

  // phet-io modules
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertInstanceOf' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var NumberIO = require( 'ifphetio!PHET_IO/types/NumberIO' );

  // constants
  var VALUE_TYPE = NumberIO; // It's a NumberProperty.
  var TPropertyImpl = PropertyIO( VALUE_TYPE );

  /**
   * NumberProperty wrapper type.
   * @constructor
   */
  function NumberPropertyIO( property, phetioID ) {
    assert && assertInstanceOf( property, phet.axon.NumberProperty );
    TPropertyImpl.call( this, property, phetioID );
  }

  axon.register( 'NumberPropertyIO', NumberPropertyIO );

  phetioInherit( TPropertyImpl, 'NumberPropertyIO', NumberPropertyIO, {}, {

    // Export the value type from the parent so clients can read it from this type
    elementType: NumberIO,

    getAPI: function() {
      return {
        elementType: phet.phetIo.phetio.getAPIForType( VALUE_TYPE )
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
      TPropertyImpl.setValue( instance, fromStateObject );
      instance.units = fromStateObject.units;
      instance.range = fromStateObject.range;
      instance.valueType = fromStateObject.valueType;
    },

    documentation: 'Numeric property model'
  } );

  return NumberPropertyIO;
} );