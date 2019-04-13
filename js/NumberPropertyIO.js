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
  var NumberIO = require( 'TANDEM/types/NumberIO' );
  var phetioInherit = require( 'TANDEM/phetioInherit' );
  var PropertyIO = require( 'AXON/PropertyIO' );
  var RangeIO = require( 'DOT/RangeIO' );
  var validate = require( 'AXON/validate' );

  // constants
  var VALUE_TYPE = NumberIO; // It's a NumberProperty.
  var PropertyIOImpl = PropertyIO( VALUE_TYPE );

  // valid values for options.numberType to convey whether it is continuous or discrete with step size 1
  var VALID_NUMBER_TYPES = [ 'FloatingPoint', 'Integer' ];

  /**
   * @param {NumberProperty} numberProperty
   * @param {string} phetioID
   * @constructor
   */
  function NumberPropertyIO( numberProperty, phetioID ) {
    PropertyIOImpl.call( this, numberProperty, phetioID );
  }

  axon.register( 'NumberPropertyIO', NumberPropertyIO );

  phetioInherit( PropertyIOImpl, 'NumberPropertyIO', NumberPropertyIO, {}, {

    validator: {
      isValidValue: v => {
        var NumberProperty = window.phet ? phet.axon.NumberProperty : axon.NumberProperty;
        return v instanceof NumberProperty;
      }
    },

    // Export the value type from the parent so clients can read it from this type
    elementType: NumberIO,

    /**
     * Encodes a NumberProperty instance to a state.
     * @param {Object} numberProperty
     * @returns {Object} - a state object
     * @override
     */
    toStateObject: function( numberProperty ) {
      validate( numberProperty, this.validator );

      var parentStateObject = PropertyIOImpl.toStateObject( numberProperty );

      // conditionals to avoid keys with value "null" in state objects
      if ( numberProperty.numberType ) {
        parentStateObject.numberType = numberProperty.numberType;
      }

      if ( numberProperty.range ) {
        parentStateObject.range = RangeIO.toStateObject( numberProperty.range );
      }
      return parentStateObject;
    },

    /**
     * Decodes a state into a NumberProperty.
     * @param {Object} stateObject
     * @returns {Object}
     * @override
     */
    fromStateObject: function( stateObject ) {
      var fromParentStateObject = PropertyIOImpl.fromStateObject( stateObject );
      fromParentStateObject.numberType = stateObject.numberType;

      // Create Range instance if defined, otherwise preserve value of null or undefined.
      fromParentStateObject.range = stateObject.range ? RangeIO.fromStateObject( stateObject.range ) : stateObject.range;
      return fromParentStateObject;
    },

    /**
     * @param {NumberProperty} numberProperty
     * @param {Object} fromStateObject
     * @override
     */
    setValue: function( numberProperty, fromStateObject ) {
      validate( numberProperty, this.validator );

      PropertyIOImpl.setValue( numberProperty, fromStateObject );
      numberProperty.range = fromStateObject.range;
      numberProperty.numberType = fromStateObject.numberType;
    },

    documentation: 'Extends PropertyIO to add values for the numeric range ( min, max ) and numberType ( \'' +
                   VALID_NUMBER_TYPES.join( '\' | \'' ) + '\' )'
  } );

  // we need this attribute to be defined even if the brand is not phetio, so we cannot rely on phetio inherit
  NumberPropertyIO.VALID_NUMBER_TYPES = VALID_NUMBER_TYPES;

  return NumberPropertyIO;
} );