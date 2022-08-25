// Copyright 2022, University of Colorado Boulder

import TProperty from './TProperty.js';
import { LinkableElement } from '../../tandem/js/PhetioObject.js';

type LinkableProperty<T> = TProperty<T> & LinkableElement;
export default LinkableProperty;