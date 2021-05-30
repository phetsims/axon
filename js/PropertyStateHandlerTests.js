// Copyright 2020-2021, University of Colorado Boulder

/**
 * Tests for PropertyStateHandler.js
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */

import Range from '../../dot/js/Range.js';
import Tandem from '../../tandem/js/Tandem.js';
import BooleanProperty from './BooleanProperty.js';
import NumberProperty from './NumberProperty.js';
import Property from './Property.js';
import PropertyStateHandler from './PropertyStateHandler.js';
import propertyStateHandlerSingleton from './propertyStateHandlerSingleton.js';
import PropertyStatePhase from './PropertyStatePhase.js';

QUnit.module( 'PropertyStateHandler' );

// These tests run only in brand=phet-io
if ( Tandem.PHET_IO_ENABLED ) {

  QUnit.test( 'Register and unregister order dependency within state engine', assert => {
    window.assert && window.assert( _.hasIn( window, 'phet.phetio.PhetioStateEngine' ), 'state engine expected for this test' );

    const propertyStateHandler = new PropertyStateHandler();
    assert.ok( !propertyStateHandler.initialized, 'started not initialized' );
    const phetioStateEngine = new phet.phetio.PhetioStateEngine( phet.phetio.phetioEngine, {
      propertyStateHandler: propertyStateHandler
    } );

    assert.ok( propertyStateHandler.initialized, 'should be initialized by phetioStateEngine' );

    assert.ok( phetioStateEngine, 'to avoid eslint no new as side-effects' );

    const propertyA = new BooleanProperty( false, {
      tandem: Tandem.ROOT_TEST.createTandem( 'aProperty' )
    } );
    const propertyB = new BooleanProperty( true, {
      tandem: Tandem.ROOT_TEST.createTandem( 'bProperty' )
    } );
    const propertyC = new BooleanProperty( false, {
      tandem: Tandem.ROOT_TEST.createTandem( 'cProperty' )
    } );

    const originalOrderDependencyLength = propertyStateHandler.getNumberOfOrderDependencies();
    const getOrderDependencyLength = () => propertyStateHandler.getNumberOfOrderDependencies() - originalOrderDependencyLength;

    propertyStateHandler.registerPhetioOrderDependency( propertyA, PropertyStatePhase.UNDEFER, propertyB, PropertyStatePhase.NOTIFY );
    assert.ok( getOrderDependencyLength() === 1, 'one expected' );

    propertyStateHandler.registerPhetioOrderDependency( propertyA, PropertyStatePhase.UNDEFER, propertyC, PropertyStatePhase.NOTIFY );
    assert.ok( getOrderDependencyLength() === 2, 'two expected' );

    propertyStateHandler.registerPhetioOrderDependency( propertyB, PropertyStatePhase.UNDEFER, propertyC, PropertyStatePhase.NOTIFY );
    assert.ok( getOrderDependencyLength() === 3, 'three expected' );

    propertyStateHandler.unregisterOrderDependenciesForProperty( propertyA );
    assert.ok( getOrderDependencyLength() === 1, 'a was in two' );
    propertyStateHandler.unregisterOrderDependenciesForProperty( propertyB );
    assert.ok( getOrderDependencyLength() === 0, 'none now' );

    propertyStateHandler.registerPhetioOrderDependency( propertyA, PropertyStatePhase.UNDEFER, propertyC, PropertyStatePhase.NOTIFY );
    propertyStateHandler.registerPhetioOrderDependency( propertyB, PropertyStatePhase.UNDEFER, propertyC, PropertyStatePhase.NOTIFY );
    assert.ok( getOrderDependencyLength() === 2, 'none now' );

    propertyStateHandler.unregisterOrderDependenciesForProperty( propertyC );
    assert.ok( getOrderDependencyLength() === 0, 'none now' );

    propertyA.dispose();
    propertyB.dispose();
    propertyC.dispose();

    if ( window.assert ) {
      const uninstrumentedProperty = new Property( 2 );
      const instrumentedProperty = new BooleanProperty( false, {
        tandem: Tandem.ROOT_TEST.createTandem( 'instrumentedProperty' )
      } );
      assert.throws( () => {
        propertyStateHandler.registerPhetioOrderDependency( uninstrumentedProperty, PropertyStatePhase.UNDEFER, instrumentedProperty, PropertyStatePhase.UNDEFER );
      }, 'cannot register with an uninstrumented Property' );

      assert.throws( () => {
        propertyStateHandler.registerPhetioOrderDependency( instrumentedProperty, PropertyStatePhase.UNDEFER, instrumentedProperty, PropertyStatePhase.UNDEFER );
      }, 'same Property same phase. . . . no no.' );
    }
  } );

  QUnit.test( 'Order dependency between NumberProperty and its Range', assert => {
    assert.ok( true, 'always pass' );
    const rangeProperty = new Property( new Range( 0, 1 ), {
      tandem: Tandem.ROOT_TEST.createTandem( 'rangeProperty' ),
      phetioDynamicElement: true,
      phetioType: Property.PropertyIO( Range.RangeIO )
    } );
    const numberProperty = new NumberProperty( 0, {
      tandem: Tandem.ROOT_TEST.createTandem( 'numberProperty' ),
      phetioDynamicElement: true,
      range: rangeProperty
    } );

    const randomDependencyProperty = new BooleanProperty( false, {
      tandem: Tandem.ROOT_TEST.createTandem( 'randomDependencyProperty' ),
      phetioDynamicElement: true
    } );

    // This extra order dependency means that numberProperty won't be deferred as eagerly as rangeProperty.
    // NumberProperty should still handle this case for state without erroring validation.
    propertyStateHandlerSingleton.registerPhetioOrderDependency(
      randomDependencyProperty, PropertyStatePhase.UNDEFER,
      numberProperty, PropertyStatePhase.UNDEFER
    );

    const serializedValue = NumberProperty.NumberPropertyIO.toStateObject( numberProperty );
    serializedValue.range.min = 4;
    serializedValue.range.max = 8;
    serializedValue.value = 7;

    phet.phetio.phetioEngine.phetioStateEngine.setState( {
      'axon.test.numberProperty': serializedValue,
      'axon.test.randomDependencyProperty': { value: true, validValues: null, units: null },
      'axon.test.rangeProperty': {
        value: {
          min: 4, max: 8
        },
        validValues: null,
        units: null
      }
    }, Tandem.ROOT_TEST );

    rangeProperty.dispose();
    numberProperty.dispose();
    randomDependencyProperty.dispose();
  } );

  QUnit.test( 'unregistering clears out the array', assert => {
    assert.ok( true, 'always pass' );

    const propertyStateHandler = new PropertyStateHandler();
    assert.ok( !propertyStateHandler.initialized, 'started not initialized' );
    const phetioStateEngine = new phet.phetio.PhetioStateEngine( phet.phetio.phetioEngine, {
      propertyStateHandler: propertyStateHandler
    } );
    assert.ok( phetioStateEngine, 'to avoid eslint no new as side-effects' );

    const propertyA = new BooleanProperty( false, {
      tandem: Tandem.ROOT_TEST.createTandem( 'aProperty' )
    } );
    const propertyB = new BooleanProperty( true, {
      tandem: Tandem.ROOT_TEST.createTandem( 'bProperty' )
    } );
    const propertyC = new BooleanProperty( false, {
      tandem: Tandem.ROOT_TEST.createTandem( 'cProperty' )
    } );

    propertyStateHandler.registerPhetioOrderDependency( propertyA, PropertyStatePhase.UNDEFER, propertyB, PropertyStatePhase.NOTIFY );
    propertyStateHandler.unregisterOrderDependenciesForProperty( propertyB );
    assert.ok( propertyStateHandler.undeferBeforeNotifyMapPair.beforeMap.size === 0, 'empty entries should be cleared' );

    propertyStateHandler.registerPhetioOrderDependency( propertyA, PropertyStatePhase.UNDEFER, propertyB, PropertyStatePhase.NOTIFY );
    propertyStateHandler.registerPhetioOrderDependency( propertyA, PropertyStatePhase.UNDEFER, propertyC, PropertyStatePhase.NOTIFY );
    propertyStateHandler.unregisterOrderDependenciesForProperty( propertyA );
    assert.ok( propertyStateHandler.undeferBeforeNotifyMapPair.beforeMap.size === 0, 'empty entries should be cleared' );

    propertyStateHandler.registerPhetioOrderDependency( propertyA, PropertyStatePhase.UNDEFER, propertyB, PropertyStatePhase.NOTIFY );
    propertyStateHandler.registerPhetioOrderDependency( propertyA, PropertyStatePhase.UNDEFER, propertyC, PropertyStatePhase.NOTIFY );
    propertyStateHandler.unregisterOrderDependenciesForProperty( propertyB );
    propertyStateHandler.unregisterOrderDependenciesForProperty( propertyC );
    assert.ok( propertyStateHandler.undeferBeforeNotifyMapPair.beforeMap.size === 0, 'empty entries should be cleared' );

    propertyA.dispose();
    propertyB.dispose();
    propertyC.dispose();
  } );
}