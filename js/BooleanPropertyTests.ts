// Copyright 2017-2022, University of Colorado Boulder

/**
 * QUnit Tests for BooleanProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import BooleanIO from '../../tandem/js/types/BooleanIO.js';
import BooleanProperty from './BooleanProperty.js';
import Property from './Property.js';

QUnit.module( 'BooleanProperty' );
QUnit.test( 'BooleanProperty', assert => {

  let fixtureProperty: Property<boolean>;

  window.assert && assert.throws( () => {

    // @ts-expect-error INTENTIONAL, this is purposefully failing typescript checks for testing
    fixtureProperty = new BooleanProperty( 'hello' );
  }, 'invalid initial value' );

  fixtureProperty = new BooleanProperty( true );
  fixtureProperty.set( true );
  fixtureProperty.set( false );
  fixtureProperty.set( true );
  window.assert && assert.throws( () => {

    // @ts-expect-error INTENTIONAL, this is purposefully failing typescript checks for testing
    fixtureProperty.set( 123 );
  }, 'invalid set value' );

  window.assert && assert.throws( () => {

    //@ts-expect-error INTENTIONAL, force set phetioType for testing.
    fixtureProperty = new BooleanProperty( true, { phetioType: BooleanIO } );
  }, 'BooleanProperty' );

  assert.ok( true, 'so we have at least 1 test in this set' );
} );