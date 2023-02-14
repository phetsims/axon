// Copyright 2022, University of Colorado Boulder

import { LinkableElement } from '../../tandem/js/PhetioObject.js';
import TReadOnlyProperty from './TReadOnlyProperty.js';


type LinkableReadOnlyProperty<T> = TReadOnlyProperty<T> & LinkableElement;
export default LinkableReadOnlyProperty;