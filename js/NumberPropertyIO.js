// Copyright 2017-2020, University of Colorado Boulder

/**
 * IO Type for NumberProperty.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import RangeIO from '../../dot/js/RangeIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import StringIO from '../../tandem/js/types/StringIO.js';
import axon from './axon.js';
import PropertyIO from './PropertyIO.js';

// constants
const PropertyIOImpl = PropertyIO( NumberIO );

// valid values for options.numberType to convey whether it is continuous or discrete with step size 1
const VALID_NUMBER_TYPES = [ 'FloatingPoint', 'Integer' ];

const NumberPropertyIO = new IOType( 'NumberPropertyIO', {
  supertype: PropertyIOImpl,
  parameterTypes: [ NumberIO ], // TODO: https://github.com/phetsims/tandem/issues/211.  Not inherited?
  documentation: 'Extends PropertyIO to add values for the numeric range ( min, max ) and numberType ( \'' +
                 VALID_NUMBER_TYPES.join( '\' | \'' ) + '\' )',
  isValidValue: v => {
    const NumberProperty = window.phet ? phet.axon.NumberProperty : axon.NumberProperty;
    return v instanceof NumberProperty;
  },
  toStateObject: numberProperty => {

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
  },
  applyState: ( numberProperty, stateObject ) => {

    PropertyIOImpl.applyState( numberProperty, stateObject );
    numberProperty.step = stateObject.step;
    numberProperty.numberType = stateObject.numberType;
  }
} );

// we need this attribute to be defined even if the brand is not phetio, so we cannot rely on phetio inherit
// TODO: https://github.com/phetsims/tandem/issues/211 this looks odd
NumberPropertyIO.VALID_NUMBER_TYPES = VALID_NUMBER_TYPES;

axon.register( 'NumberPropertyIO', NumberPropertyIO );
export default NumberPropertyIO;