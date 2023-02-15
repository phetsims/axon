// Copyright 2023, University of Colorado Boulder

import TReadOnlyProperty from './TReadOnlyProperty.js';
import LinkableElement from '../../tandem/js/LinkableElement.js';

/**
 * This combines TReadOnlyProperty<T> with LinkableElement, so can be used to specify the type information for
 * a Property that can be linked via PhetioObject.addLinkedElement.
 * @see PhetioObject.addLinkedElement
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
type LinkableReadOnlyProperty<T> = TReadOnlyProperty<T> & LinkableElement;
export default LinkableReadOnlyProperty;