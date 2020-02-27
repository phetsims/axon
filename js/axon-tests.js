// Copyright 2017-2020, University of Colorado Boulder

/**
 * Unit tests for axon. Please run once in phet brand and once in brand=phet-io to cover all functionality.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import './BooleanPropertyTests.js';
import './DerivedPropertyTests.js';
import './DynamicPropertyTests.js';
import './EmitterIOTests.js';
import './EmitterTests.js';
import './EnumerationPropertyTests.js';
import './EventsTests.js';
import './NumberPropertyTests.js';
import './ObservableArrayTests.js';
import './PropertyTests.js';
import './StringPropertyTests.js';
import './TinyEmitterTests.js';
import './ValidatorDefTests.js';

// Since our tests are loaded asynchronously, we must direct QUnit to begin the tests
QUnit.start();