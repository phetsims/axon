// Copyright 2017-2018, University of Colorado Boulder

/**
 * IO type for NumberProperty.
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
  var NumberIO = require( 'ifphetio!PHET_IO/types/NumberIO' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );

  // constants
  var VALUE_TYPE = NumberIO; // It's a NumberProperty.
  var PropertyIOImpl = PropertyIO( VALUE_TYPE );

  /**
   * @param {NumberProperty} numberProperty
   * @param {string} phetioID
   * @constructor
   */
  function NumberPropertyIO( numberProperty, phetioID ) {
    assert && assertInstanceOf( numberProperty, phet.axon.NumberProperty );
    PropertyIOImpl.call( this, numberProperty, phetioID );
  }

  axon.register( 'NumberPropertyIO', NumberPropertyIO );

  phetioInherit( PropertyIOImpl, 'NumberPropertyIO', NumberPropertyIO, {}, {

    // Export the value type from the parent so clients can read it from this type
    elementType: NumberIO,

    getAPI: function() {
      return {
        elementType: phet.phetIo.phetio.getAPIForType( VALUE_TYPE )
      };
    },

    /**
     * Encodes a NumberProperty instance to a state.
     * @param {Object} numberProperty
     * @returns {Object} - a state object
     */
    toStateObject: function( numberProperty ) {
      assert && assertInstanceOf( numberProperty, phet.axon.NumberProperty );

      var parentStateObject = PropertyIOImpl.toStateObject( numberProperty );

      // conditionals to avoid keys with value "null" in state objects
      if(numberProperty.numberType){
        parentStateObject.numberType = numberProperty.numberType;
      }

      if ( numberProperty.range ) {
        parentStateObject.range = numberProperty.range;
      }
      return parentStateObject;
    },

    /**
     * Decodes a state into a NumberProperty.
     * @param {Object} stateObject
     * @returns {Object}
     */
    fromStateObject: function( stateObject ) {
      var fromParentStateObject = PropertyIOImpl.fromStateObject( stateObject );
      fromParentStateObject.numberType = stateObject.numberType;
      fromParentStateObject.range = stateObject.range;
      return fromParentStateObject;
    },

    /**
     * @param {NumberProperty} numberProperty
     * @param {Object} fromStateObject
     */
    setValue: function( numberProperty, fromStateObject ) {
      assert && assertInstanceOf( numberProperty, phet.axon.NumberProperty );

      PropertyIOImpl.setValue( numberProperty, fromStateObject );
      numberProperty.range = fromStateObject.range;
      numberProperty.numberType = fromStateObject.numberType;
    },

    documentation: 'Includes number-specific attributes in the state.'
  } );

  return NumberPropertyIO;
} );