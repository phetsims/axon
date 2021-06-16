// Copyright 2013-2021, University of Colorado Boulder

/**
 * Module that includes all axon dependencies, so that requiring this module will return an object
 * that consists of the entire exported 'axon' namespace API.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import './Action.js';
import './animationFrameTimer.js';
import axon from './axon.js';
import './BooleanProperty.js';
import './CallbackTimer.js';
import './DerivedProperty.js';
import './DynamicProperty.js';
import './Emitter.js';
import './EnumerationProperty.js';
import './Multilink.js';
import './NumberProperty.js';
import './createObservableArray.js';
import './Property.js';
import './PropertyStateHandler.js';
import './propertyStateHandlerSingleton.js';
import './PropertyStatePhase.js';
import './stepTimer.js';
import './StringProperty.js';
import './Timer.js';
import './TinyEmitter.js';
import './TinyForwardingProperty.js';
import './TinyProperty.js';
import './TinyStaticProperty.js';
import './units.js';
import './validate.js';
import './ValidatorDef.js';

export default axon;