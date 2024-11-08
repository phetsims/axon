// Copyright 2023-2024, University of Colorado Boulder
// @author Michael Kauzmann (PhET Interactive Simulations)

import Range from '../../dot/js/Range.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import PhetioProperty from './PhetioProperty.js';
import ReadOnlyProperty from './ReadOnlyProperty.js';
import TinyProperty from './TinyProperty.js';
import TReadOnlyProperty from './TReadOnlyProperty.js';

// Minimal types for Properties that support a rangeProperty.
export type TRangedProperty = PhetioProperty<number> & { range: Range; readonly rangeProperty: TReadOnlyProperty<Range> };

export function isTRangedProperty( something: IntentionalAny ): something is TRangedProperty {
  return ( something instanceof ReadOnlyProperty || something instanceof TinyProperty ) && something.isSettable() &&

         // @ts-expect-error we are checking on the pressence, but can't use hasOwnProperty in case it is implemented with es5 getters and setters
         !!something.range && !!something.rangeProperty;
}

export default TRangedProperty;