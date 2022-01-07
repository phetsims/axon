// Copyright 2020-2022, University of Colorado Boulder

/**
 * Describes the phases that a Property can go through in its value setting and notification lifecycle.
 *
 * UNDEFER - the phase when `Property.setDeferred(false)` is called and Property.value becomes accurate
 * NOTIFY - the phase when notifications are fired for Properties that have had a value change since becoming deferred
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import EnumerationDeprecated from '../../phet-core/js/EnumerationDeprecated.js';
import axon from './axon.js';

const PropertyStatePhase = EnumerationDeprecated.byKeys( [ 'UNDEFER', 'NOTIFY' ] );

axon.register( 'PropertyStatePhase', PropertyStatePhase );
export default PropertyStatePhase;