// Copyright 2017-2020, University of Colorado Boulder

/**
 * IO type for NumberProperty.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );
  const NullableIO = require( 'TANDEM/types/NullableIO' );
  const NumberIO = require( 'TANDEM/types/NumberIO' );
  const ObjectIO = require( 'TANDEM/types/ObjectIO' );
  const PropertyIO = require( 'AXON/PropertyIO' );
  const RangeIO = require( 'DOT/RangeIO' );
  const validate = require( 'AXON/validate' );

  // constants
  const PropertyIOImpl = PropertyIO( NumberIO );
  const NullableIORangeIO = NullableIO( RangeIO );

  // valid values for options.numberType to convey whether it is continuous or discrete with step size 1
  const VALID_NUMBER_TYPES = [ 'FloatingPoint', 'Integer' ];

  class NumberPropertyIO extends PropertyIOImpl {

    /**
     * Encodes a NumberProperty instance to a state.
     * @param {Object} numberProperty
     * @returns {Object} - a state object
     * @override
     */
    static toStateObject( numberProperty ) {
      validate( numberProperty, this.validator );

      const parentStateObject = PropertyIOImpl.toStateObject( numberProperty );

      // conditionals to avoid keys with value "null" in state objects
      if ( numberProperty.numberType ) {
        parentStateObject.numberType = numberProperty.numberType;
      }

      // always have a range, even if it is null. This is to support setting a range to null from something else, or vice versa
      parentStateObject.range = NullableIORangeIO.toStateObject( numberProperty.range );

      if ( numberProperty.step ) {
        parentStateObject.step = numberProperty.step;
      }
      return parentStateObject;
    }

    /**
     * Decodes a state into a NumberProperty.
     * @param {Object} stateObject
     * @returns {Object}
     * @override
     */
    static fromStateObject( stateObject ) {
      const fromParentStateObject = PropertyIOImpl.fromStateObject( stateObject );
      fromParentStateObject.numberType = stateObject.numberType;
      fromParentStateObject.step = stateObject.step;

      // Create Range instance if defined, otherwise preserve value of null or undefined.
      fromParentStateObject.range = NullableIORangeIO.fromStateObject( stateObject.range );

      return fromParentStateObject;
    }

    /**
     * @param {NumberProperty} numberProperty
     * @param {Object} fromStateObject
     * @override
     */
    static setValue( numberProperty, fromStateObject ) {
      validate( numberProperty, this.validator );

      // If range is a Property
      if ( numberProperty.rangeProperty ) {
        numberProperty.setValueAndRange( fromStateObject.value, fromStateObject.range );
      }
      else {
        PropertyIOImpl.setValue( numberProperty, fromStateObject );
        numberProperty.range = fromStateObject.range;
      }
      numberProperty.step = fromStateObject.step;
      numberProperty.numberType = fromStateObject.numberType;
    }
  }

  NumberPropertyIO.validator = {
    isValidValue: v => {
      const NumberProperty = window.phet ? phet.axon.NumberProperty : axon.NumberProperty;
      return v instanceof NumberProperty;
    }
  };

  NumberPropertyIO.typeName = 'NumberPropertyIO';
  NumberPropertyIO.documentation = 'Extends PropertyIO to add values for the numeric range ( min, max ) and numberType ( \'' +
                                   VALID_NUMBER_TYPES.join( '\' | \'' ) + '\' )';

  // we need this attribute to be defined even if the brand is not phetio, so we cannot rely on phetio inherit
  NumberPropertyIO.VALID_NUMBER_TYPES = VALID_NUMBER_TYPES;
  ObjectIO.validateSubtype( NumberPropertyIO );

  return axon.register( 'NumberPropertyIO', NumberPropertyIO );
} );