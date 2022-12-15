// Copyright 2017-2022, University of Colorado Boulder

/**
 * QUnit tests for DerivedProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Tandem from '../../tandem/js/Tandem.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import DerivedProperty from './DerivedProperty.js';
import Property from './Property.js';
import propertyStateHandlerSingleton from './propertyStateHandlerSingleton.js';

QUnit.module( 'DerivedProperty' );

QUnit.test( 'Test stale values in DerivedProperty', assert => {
  const aProperty = new Property( 1 );
  const bProperty = new Property( 2 );
  const cProperty = new DerivedProperty( [ aProperty, bProperty ], ( ( aProperty, bProperty ) => {return aProperty + bProperty;} ) );
  aProperty.value = 7;
  assert.equal( cProperty.value, 9 );
} );

QUnit.test( 'Test DerivedProperty.unlink', assert => {

  const widthProperty = new Property( 2 );
  const startingWidthListenerCount = widthProperty[ 'getListenerCount' ]();
  const heightProperty = new Property( 3 );
  const startingHeightListenerCount = heightProperty[ 'getListenerCount' ]();
  const areaPropertyDependencies: readonly [ Property<number>, Property<number> ] = [ widthProperty, heightProperty ] as const;
  const areaProperty = new DerivedProperty( areaPropertyDependencies,
    ( ( width, height ) => width * height ) );
  const listener = function( area: number ) { /*console.log( 'area = ' + area );*/ };
  areaProperty.link( listener );

  assert.equal( widthProperty[ 'getListenerCount' ](), 1 + startingWidthListenerCount );
  assert.equal( heightProperty[ 'getListenerCount' ](), 1 + startingHeightListenerCount );
  assert.equal( areaPropertyDependencies.length, 2 );

  // Unlink the listener
  areaProperty.unlink( listener );
  areaProperty.dispose();

  assert.equal( widthProperty[ 'getListenerCount' ](), startingWidthListenerCount );
  assert.equal( heightProperty[ 'getListenerCount' ](), startingHeightListenerCount );

  assert.equal( areaProperty[ 'dependencies' ], null );

  // @ts-expect-error, type of dependencyListeners is implicitly any because DerivedProperty can have up to 16 dependencies of any type
  assert.equal( areaProperty[ 'dependencyListeners' ], null );
  assert.equal( areaProperty[ 'dependencies' ], null );
} );

QUnit.test( 'DerivedProperty.valueEquals', assert => {
  const aProperty = new Property( 'a' );
  const bProperty = new Property( 'b' );
  const cProperty = DerivedProperty[ 'valueEquals' ]( aProperty, bProperty );
  assert.equal( cProperty.value, false );
  aProperty.value = 'b';
  assert.equal( cProperty.value, true );
} );

QUnit.test( 'Test defer', assert => {
  const firstProperty = new Property( 0 );
  const secondProperty = new Property( 2 );
  const derivedProperty = new DerivedProperty( [ firstProperty, secondProperty ], ( a, b ) => a + b );
  assert.ok( derivedProperty.value === 2, 'base case, no defer' );

  // test a dependency being deferred
  firstProperty.setDeferred( true );
  assert.ok( derivedProperty.value === 2, 'same value even after defer' );
  firstProperty.value = 2;
  assert.ok( derivedProperty.value === 2, 'same value even when set to new' );
  const update = firstProperty.setDeferred( false );
  assert.ok( firstProperty.value === 2, 'property has new value now' );
  assert.ok( derivedProperty.value === 2, 'but the derivedProperty doesnt' );
  update && update();
  assert.ok( derivedProperty.value === 4, 'now derivedProperty was updated' );

  // test the DerivedProperty being deferred
  derivedProperty.setDeferred( true );
  assert.ok( derivedProperty.value === 4, 'still 4' );
  firstProperty.value = 4;
  assert.ok( derivedProperty.value === 4, 'still 4 after update' );
  const updateAgain = derivedProperty.setDeferred( false );
  assert.ok( derivedProperty.value === 6, 'now has the correct value' );
  updateAgain && updateAgain();
  assert.ok( derivedProperty.value === 6, 'nothing changed' );
} );

QUnit.test( 'DerivedProperty and/or', assert => {

  const aProperty = new Property( false );
  const bProperty = new Property( false );
  const cProperty = new Property( false );

  // correct usages of 'and' and 'or'
  const andProperty = DerivedProperty.and( [ aProperty, bProperty, cProperty ] );
  const orProperty = DerivedProperty.or( [ aProperty, bProperty, cProperty ] );

  assert.equal( andProperty.value, false );
  assert.equal( orProperty.value, false );

  aProperty.value = true;
  assert.equal( andProperty.value, false );
  assert.equal( orProperty.value, true );

  bProperty.value = true;
  assert.equal( andProperty.value, false );
  assert.equal( orProperty.value, true );

  cProperty.value = true;
  assert.equal( andProperty.value, true );
  assert.equal( orProperty.value, true );

  // @ts-expect-error INTENTIONAL fail: setting a dependency to a non-boolean value
  window.assert && assert.throws( () => { aProperty.value = 0; },
    'DerivedProperty dependency must have boolean value' );
} );

if ( Tandem.PHET_IO_ENABLED ) {
  QUnit.test( 'propertyStateHandlerSingleton tests for DerivedProperty', assert => {

    const parentTandem = Tandem.ROOT_TEST;

    const originalOrderDependencyLength = propertyStateHandlerSingleton.getNumberOfOrderDependencies();
    const getOrderDependencyLength = () => propertyStateHandlerSingleton.getNumberOfOrderDependencies() - originalOrderDependencyLength;

    const firstProperty = new Property( 1, {
      tandem: parentTandem.createTandem( 'firstProperty' ),
      phetioValueType: NumberIO
    } );
    const secondProperty = new Property( 1, {
      tandem: parentTandem.createTandem( 'secondProperty' ),
      phetioValueType: NumberIO
    } );
    const thirdProperty = new Property( 1, {
      tandem: parentTandem.createTandem( 'thirdProperty' ),
      phetioValueType: NumberIO
    } );

    const derivedProperty = new DerivedProperty( [ firstProperty, secondProperty, thirdProperty ], () => 3, {
      tandem: parentTandem.createTandem( 'derivedProperty' ),
      phetioValueType: NumberIO
    } );
    assert.ok( getOrderDependencyLength() === 3, 'derivedProperty adds order dependency for each dependency' );

    firstProperty.dispose();
    assert.ok( getOrderDependencyLength() === 2, 'dependency dispose only removes what it effects' );
    derivedProperty.dispose();
    assert.ok( getOrderDependencyLength() === 0, 'no orderDependencies after derivedProperty dispose' );

    secondProperty.dispose();
    thirdProperty.dispose();
  } );
}