// Copyright 2020-2022, University of Colorado Boulder

/**
 * Describes the phases that a Property can go through in its value setting and notification lifecycle.
 *
 * UNDEFER - the phase when `Property.setDeferred(false)` is called and Property.value becomes accurate
 * NOTIFY - the phase when notifications are fired for Properties that have had a value change since becoming deferred
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Enumeration from '../../phet-core/js/Enumeration.js';
import EnumerationValue from '../../phet-core/js/EnumerationValue.js';
import axon from './axon.js';

class PropertyStatePhase extends EnumerationValue {
  public static readonly UNDEFER = new PropertyStatePhase();
  public static readonly NOTIFY = new PropertyStatePhase();

  public static readonly enumeration = new Enumeration( PropertyStatePhase );
}

axon.register( 'PropertyStatePhase', PropertyStatePhase );
export default PropertyStatePhase;