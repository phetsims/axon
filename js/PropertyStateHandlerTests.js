// Copyright 2020, University of Colorado Boulder

/**
 * Tests for PropertyStateHandler.js
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */

import Range from '../../dot/js/Range.js';
import RangeIO from '../../dot/js/RangeIO.js';
import Tandem from '../../tandem/js/Tandem.js';
import BooleanProperty from './BooleanProperty.js';
import NumberProperty from './NumberProperty.js';
import NumberPropertyIO from './NumberPropertyIO.js';
import Property from './Property.js';
import PropertyIO from './PropertyIO.js';
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

    assert.ok( phetioStateEngine, 'to aviod eslint no new as side-effects' );

    const propertyA = new BooleanProperty( false, {
      tandem: Tandem.GENERAL.createTandem( 'aProperty' )
    } );
    const propertyB = new BooleanProperty( true, {
      tandem: Tandem.GENERAL.createTandem( 'bProperty' )
    } );
    const propertyC = new BooleanProperty( false, {
      tandem: Tandem.GENERAL.createTandem( 'cProperty' )
    } );

    propertyStateHandler.registerPhetioOrderDependency( propertyA, PropertyStatePhase.UNDEFER, propertyB, PropertyStatePhase.NOTIFY );
    assert.ok( propertyStateHandler.propertyOrderDependencies.length === 1, 'one expected' );
    const aToBDependency = propertyStateHandler.propertyOrderDependencies[ 0 ];

    propertyStateHandler.registerPhetioOrderDependency( propertyA, PropertyStatePhase.UNDEFER, propertyC, PropertyStatePhase.NOTIFY );
    assert.ok( propertyStateHandler.propertyOrderDependencies.length === 2, 'two expected' );
    assert.ok( propertyStateHandler.propertyOrderDependencies[ 0 ] === aToBDependency, 'push expected instead of unshift1' );
    const aToCDependency = propertyStateHandler.propertyOrderDependencies[ 1 ];

    propertyStateHandler.registerPhetioOrderDependency( propertyB, PropertyStatePhase.UNDEFER, propertyC, PropertyStatePhase.NOTIFY );
    assert.ok( propertyStateHandler.propertyOrderDependencies.length === 3, 'three expected' );
    assert.ok( propertyStateHandler.propertyOrderDependencies[ 0 ] === aToBDependency, 'push expected instead of unshift2' );
    assert.ok( propertyStateHandler.propertyOrderDependencies[ 1 ] === aToCDependency, 'push expected instead of unshift3' );
    const bToCDependency = propertyStateHandler.propertyOrderDependencies[ 2 ];

    propertyStateHandler.unregisterOrderDependenciesForProperty( propertyA );
    assert.ok( propertyStateHandler.propertyOrderDependencies.length === 1, 'a was in two' );
    assert.ok( propertyStateHandler.propertyOrderDependencies[ 0 ] === bToCDependency, 'push expected instead of unshift3' );
    propertyStateHandler.unregisterOrderDependenciesForProperty( propertyB );
    assert.ok( propertyStateHandler.propertyOrderDependencies.length === 0, 'none now' );


    propertyStateHandler.registerPhetioOrderDependency( propertyA, PropertyStatePhase.UNDEFER, propertyC, PropertyStatePhase.NOTIFY );
    propertyStateHandler.registerPhetioOrderDependency( propertyB, PropertyStatePhase.UNDEFER, propertyC, PropertyStatePhase.NOTIFY );
    assert.ok( propertyStateHandler.propertyOrderDependencies.length === 2, 'none now' );

    propertyStateHandler.unregisterOrderDependenciesForProperty( propertyC );
    assert.ok( propertyStateHandler.propertyOrderDependencies.length === 0, 'none now' );

    propertyA.dispose();
    propertyB.dispose();
    propertyC.dispose();
  } );


  QUnit.test( 'Order dependency between NumberProperty and its Range', assert => {
    assert.ok( true, 'always pass' );

    Tandem.launch();
    const rangeProperty = new Property( new Range( 0, 1 ), {
      tandem: Tandem.GENERAL.createTandem( 'rangeProperty' ),
      phetioDynamicElement: true,
      phetioType: PropertyIO( RangeIO )
    } );
    const numberProperty = new NumberProperty( 0, {
      tandem: Tandem.GENERAL.createTandem( 'numberProperty' ),
      phetioDynamicElement: true,
      range: rangeProperty
    } );

    const randomDependencyProperty = new BooleanProperty( false, {
      tandem: Tandem.GENERAL.createTandem( 'randomDependencyProperty' ),
      phetioDynamicElement: true
    } );

    // This extra order dependency means that numberProperty won't be deferred as eagerly as rangeProperty.
    // NumberProperty should still handle this case for state without erroring validation.
    propertyStateHandlerSingleton.registerPhetioOrderDependency(
      randomDependencyProperty, PropertyStatePhase.UNDEFER,
      numberProperty, PropertyStatePhase.UNDEFER
    );

    const serializedValue = NumberPropertyIO.toStateObject( numberProperty );
    serializedValue.range.min = 4;
    serializedValue.range.max = 8;
    serializedValue.value = 7;

    phet.phetio.phetioEngine.phetioStateEngine.setState( {
      'axon.general.numberProperty': serializedValue,
      'axon.general.randomDependencyProperty': { value: true },
      'axon.general.rangeProperty': {
        value: { min: 4, max: 8 }
      }
    } );

    rangeProperty.dispose();
    numberProperty.dispose();
    randomDependencyProperty.dispose();

    Tandem.unlaunch();
  } );
}