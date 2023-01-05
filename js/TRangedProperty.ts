// Copyright 2022, University of Colorado Boulder

import LinkableProperty from './LinkableProperty.js';
import TReadOnlyProperty from './TReadOnlyProperty.js';
import Range from '../../dot/js/Range.js';

// Minimal types for Properties that support a rangeProperty.
export type TRangedProperty = LinkableProperty<number> & { range: Range; readonly rangeProperty: TReadOnlyProperty<Range> };

export default TRangedProperty;