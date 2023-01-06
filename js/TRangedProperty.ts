// Copyright 2023, University of Colorado Boulder

import LinkableProperty from './LinkableProperty.js';
import TReadOnlyProperty from './TReadOnlyProperty.js';
import Range from '../../dot/js/Range.js';
import IntentionalAny from '../../phet-core/js/types/IntentionalAny.js';
import ReadOnlyProperty from './ReadOnlyProperty.js';
import TinyProperty from './TinyProperty.js';

// Minimal types for Properties that support a rangeProperty.
export type TRangedProperty = LinkableProperty<number> & { range: Range; readonly rangeProperty: TReadOnlyProperty<Range> };

export function isTRangedProperty( something: IntentionalAny ): something is TRangedProperty {
  return ( something instanceof ReadOnlyProperty || something instanceof TinyProperty ) && something.isSettable() &&

         // @ts-expect-error we are checking on the pressence, but can't use hasOwnProperty in case it is implemented wil es5 getters and setters
         !!something.range && !!something.rangeProperty;
}

export default TRangedProperty;