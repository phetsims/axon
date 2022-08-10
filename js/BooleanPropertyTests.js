// Copyright 2017-2022, University of Colorado Boulder

/**
 * QUnit Tests for BooleanProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import BooleanIO from '../../tandem/js/types/BooleanIO.js';
import BooleanProperty from './BooleanProperty.js';

QUnit.module( 'BooleanProperty' );
QUnit.test( 'BooleanProperty', assert => {

  let p = null;

  window.assert && assert.throws( () => {
    p = new BooleanProperty( 'hello' );
  }, 'invalid initial value' );

  p = new BooleanProperty( true );
  p.set( true );
  p.set( false );
  p.set( true );
  window.assert && assert.throws( () => {
    p.set( 123 );
  }, 'invalid set value' );

  window.assert && assert.throws( () => {
    p = new BooleanProperty( true, { phetioType: BooleanIO } );
  }, 'BooleanProperty' );

  assert.ok( true, 'so we have at least 1 test in this set' );
} );