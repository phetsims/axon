// Copyright 2020-2021, University of Colorado Boulder

/**
 * Describes the phases that a Property can go through in its value setting and notification lifecycle.
 *
 * UNDEFER - the phase when `Property.setDeferred(false)` is called and Property.value becomes accurate
 * NOTIFY - the phase when notifications are fired for Properties that have had a value change since becoming deferred
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Enumeration from '../../phet-core/js/Enumeration.js';
import axon from './axon.js';

const PropertyStatePhase = Enumeration.byKeys( [ 'UNDEFER', 'NOTIFY' ] );

axon.register( 'PropertyStatePhase', PropertyStatePhase );
export default PropertyStatePhase;