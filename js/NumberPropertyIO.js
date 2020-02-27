// Copyright 2017-2020, University of Colorado Boulder

/**
 * IO type for NumberProperty.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import RangeIO from '../../dot/js/RangeIO.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import ObjectIO from '../../tandem/js/types/ObjectIO.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import axon from './axon.js';
import PropertyIO from './PropertyIO.js';
import validate from './validate.js';

// constants
const PropertyIOImpl = PropertyIO( NumberIO );

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

    if ( numberProperty.rangeProperty.value ) {
      parentStateObject.range = RangeIO.toStateObject( numberProperty.rangeProperty.value );
      if ( numberProperty.rangeProperty.isPhetioInstrumented() ) {
        parentStateObject.rangePhetioID = StringIO.toStateObject( numberProperty.rangeProperty.tandem.phetioID );
      }
    }
    if ( numberProperty.step ) {
      parentStateObject.step = NumberIO.toStateObject( numberProperty.step );
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

    return fromParentStateObject;
  }

  /**
   * @param {NumberProperty} numberProperty
   * @param {Object} fromStateObject
   * @override
   */
  static setValue( numberProperty, fromStateObject ) {
    validate( numberProperty, this.validator );

    PropertyIOImpl.setValue( numberProperty, fromStateObject );
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

axon.register( 'NumberPropertyIO', NumberPropertyIO );
export default NumberPropertyIO;