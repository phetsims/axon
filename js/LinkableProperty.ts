// Copyright 2022-2023, University of Colorado Boulder

import LinkableElement from '../../tandem/js/LinkableElement.js';
import TProperty from './TProperty.js';

/**
 * This combines TProperty<T> with LinkableElement, so can be used to specify the type information for
 * a Property that can be linked via PhetioObject.addLinkedElement.
 * @see PhetioObject.addLinkedElement
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
type LinkableProperty<T> = TProperty<T> & LinkableElement;
export default LinkableProperty;