// Copyright 2024, University of Colorado Boulder

/**
 * QUnit Tests for GatedBooleanProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Tandem from '../../tandem/js/Tandem.js';
import BooleanProperty from './BooleanProperty.js';
import GatedBooleanProperty from './GatedBooleanProperty.js';

QUnit.module( 'GatedBooleanProperty' );

QUnit.test( 'Core functionality', assert => {
  const parentTandem = Tandem.ROOT_TEST;
  const sourceProperty = new BooleanProperty( true );
  const gatedProperty = new GatedBooleanProperty( sourceProperty, parentTandem );

  // Test initial state
  assert.ok( gatedProperty.value, 'initial value should be true' );

  // Test source property control
  sourceProperty.set( false );

  assert.ok( !gatedProperty.value, 'should be false when source is false' );

  // Test gate property control
  gatedProperty.selfBooleanProperty.set( false );
  assert.ok( !gatedProperty.value, 'should be false when gate is false' );

  // Helper function to test combinations
  const testCombination = ( sourceValue: boolean, gateValue: boolean, expected: boolean, message: string ) => {
    sourceProperty.set( sourceValue );
    gatedProperty.selfBooleanProperty.set( gateValue );
    assert.ok( gatedProperty.value === expected, message );
  };

  // Test all combinations of source and gate
  testCombination( true, true, true, 'should be true when both source and gate are true' );
  testCombination( true, false, false, 'should be false when source is true and gate is false' );
  testCombination( false, true, false, 'should be false when source is false and gate is true' );
  testCombination( false, false, false, 'should be false when both source and gate are false' );

  // Test disposal
  gatedProperty.dispose();
  assert.ok( gatedProperty.isDisposed, 'should be disposed after dispose()' );
  assert.ok( gatedProperty.selfBooleanProperty.isDisposed, 'selfBooleanProperty should be disposed' );

  // Clean up
  sourceProperty.dispose();
} );