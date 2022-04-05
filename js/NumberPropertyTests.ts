// Copyright 2017-2022, University of Colorado Boulder

/**
 * QUnit tests for NumberProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Range from '../../dot/js/Range.js';
import Tandem from '../../tandem/js/Tandem.js';
import NumberProperty from './NumberProperty.js';
import Property from './Property.js';
import stepTimer from './stepTimer.js';

QUnit.module( 'NumberProperty' );

QUnit.test( 'Test NumberProperty', assert => {
  assert.ok( true, 'one test needed when running without assertions' );

  let p = new NumberProperty( 42 ); // highly random, do not change

  // valueType
  window.assert && assert.throws( () => {

    // @ts-ignore
    p = new NumberProperty( 'foo' );
  }, 'initial value has invalid valueType' );
  p = new NumberProperty( 0 );
  p.value = 1;
  window.assert && assert.throws( () => {

    // @ts-ignore
    p.value = 'foo';
  }, 'set value has invalid valueType' );

  // numberType
  window.assert && assert.throws( () => {

    // @ts-ignore
    p = new NumberProperty( 0, { numberType: 0 } );
  }, 'bad numberType' );
  p = new NumberProperty( 0, { numberType: 'FloatingPoint' } );
  p.value = 1;
  p.value = 1.2;
  window.assert && assert.throws( () => {
    p = new NumberProperty( 1.2, { numberType: 'Integer' } );
  }, 'initial value has invalid numberType' );
  window.assert && assert.throws( () => {
    p = new NumberProperty( 0, {
      numberType: 'Integer',
      validValues: [ 0, 1, 1.2, 2 ]
    } );
  }, 'member of validValues has invalid numberType' );
  p = new NumberProperty( 0, { numberType: 'Integer' } );
  p.value = 1;
  window.assert && assert.throws( () => {
    p.value = 1.2;
  }, 'set value has invalid numberType' );

  // range
  window.assert && assert.throws( () => {

    // @ts-ignore
    p = new NumberProperty( 0, { range: [ 0, 10 ] } );
  }, 'bad range' );
  window.assert && assert.throws( () => {
    p = new NumberProperty( 11, { range: new Range( 0, 10 ) } );
  }, 'initial value is greater than range.max' );
  window.assert && assert.throws( () => {
    p = new NumberProperty( -1, { range: new Range( 0, 10 ) } );
  }, 'initial value is less than range.min' );
  window.assert && assert.throws( () => {
    p = new NumberProperty( 0, {
      range: new Range( 0, 10 ),
      validValues: [ 0, 1, 2, 11 ]
    } );
  }, 'member of validValues is greater than range.max' );
  window.assert && assert.throws( () => {
    p = new NumberProperty( 0, {
      range: new Range( 0, 10 ),
      validValues: [ -1, 0, 1, 2 ]
    } );
  }, 'member of validValues is less than range.min' );
  p = new NumberProperty( 0, { range: new Range( 0, 10 ) } );
  p.value = 5;
  window.assert && assert.throws( () => {

    // @ts-ignore
    p.value = 11;
  }, 'set value is greater than range.max' );
  window.assert && assert.throws( () => {

    // @ts-ignore
    p.value = -1;
  }, 'set value is less than range.min' );

  // units
  window.assert && assert.throws( () => {
    p = new NumberProperty( 0, { units: 'elephants' } );
  }, 'bad units' );

  ///////////////////////////////
  p = new NumberProperty( 0, { range: new Range( 0, 10 ) } );
  p.rangeProperty.value = new Range( 0, 100 );
  p.value = 99;
  p.rangeProperty.value = new Range( 90, 100 );

  // This should not fail, but will until we support nested deferral for PhET-iO support, see https://github.com/phetsims/axon/issues/282
  // p.reset();
} );


QUnit.test( 'Test NumberProperty range option as Property', assert => {

  let rangeProperty = new Property( new Range( 0, 1 ) );
  let p = new NumberProperty( 4 );

  // valueType
  window.assert && assert.throws( () => {

    // @ts-ignore
    p = new NumberProperty( 0, { range: 'hi' } );
  }, 'incorrect range type' );

  // @ts-ignore
  p = new NumberProperty( 0, { range: rangeProperty } );
  assert.ok( p.rangeProperty === rangeProperty, 'rangeProperty should be set' );
  assert.ok( p.range === rangeProperty.value, 'rangeProperty value should be set NumberProperty.set on construction' );
  p.value = 1;
  p.value = 0;
  p.value = 0.5;
  window.assert && assert.throws( () => {
    p.value = 2;
  }, 'larger than range' );
  window.assert && assert.throws( () => {
    p.value = -2;
  }, 'smaller than range' );
  window.assert && assert.throws( () => {
    rangeProperty.value = new Range( 5, 10 );
  }, 'current value outside of range' );

  // reset from previous test setting to [5,10]
  p.dispose();
  rangeProperty.dispose();
  rangeProperty = new Property( new Range( 0, 1 ) );

  // @ts-ignore
  p = new NumberProperty( 0, { range: rangeProperty } );
  rangeProperty.value = new Range( 0, 10 );
  p.value = 2;

  p.setValueAndRange( 100, new Range( 99, 101 ) );

  const myRange = new Range( 5, 10 );
  p.setValueAndRange( 6, myRange );

  assert.ok( myRange === p.rangeProperty.value, 'reference should be kept' );

  p = new NumberProperty( 0, { range: new Range( 0, 1 ) } );
  assert.ok( p.rangeProperty instanceof Property, 'created a rangeProperty from a range' );

  // deferring ordering dependencies
  ///////////////////////////////////////////////////////
  let pCalled = 0;
  let pRangeCalled = 0;
  p.lazyLink( () => pCalled++ );
  p.rangeProperty.lazyLink( () => pRangeCalled++ );
  p.setDeferred( true );
  p.rangeProperty.setDeferred( true );
  p.set( 3 );
  assert.ok( pCalled === 0, 'p is still deferred, should not call listeners' );
  p.rangeProperty.set( new Range( 2, 3 ) );
  assert.ok( pRangeCalled === 0, 'p.rangeProperty is still deferred, should not call listeners' );
  const notifyPListeners = p.setDeferred( false );


  if ( window.assert ) {
    assert.throws( () => {
      notifyPListeners && notifyPListeners();
    }, 'rangeProperty is not yet undeferred and so has the wrong value' );

    // @ts-ignore
    p.notifying = false; // since the above threw an error, reset
  }
  const notifyRangeListeners = p.rangeProperty.setDeferred( false );
  notifyPListeners && notifyPListeners();
  assert.ok( pCalled === 1, 'p listeners should have been called' );
  notifyRangeListeners && notifyRangeListeners();
  assert.ok( pRangeCalled === 1, 'p.rangeProperty is still deferred, should not call listeners' );

  p.setValueAndRange( -100, new Range( -101, -99 ) );
  assert.ok( pCalled === 2, 'p listeners should have been called again' );
  assert.ok( pRangeCalled === 2, 'p.rangeProperty is still deferred, should not call listeners again' );

  p = new NumberProperty( 0 );
  p.value = 4;
  assert.ok( p.rangeProperty.value === null, 'rangeProperty should have been created' );
  p.rangeProperty.value = new Range( 0, 4 );
  window.assert && assert.throws( () => {
    p.value = 5;
  }, 'current value outside of range' );
} );
QUnit.test( 'Test NumberProperty phet-io options', assert => {

  const tandem = Tandem.ROOT_TEST;
  let p = new NumberProperty( 0, {
    range: new Range( 0, 20 ),
    tandem: tandem.createTandem( 'numberProperty' ),
    rangePropertyOptions: { tandem: tandem.createTandem( 'rangeProperty' ) }
  } );

  assert.ok( p.rangeProperty.isPhetioInstrumented(), 'rangeProperty instrumented' );
  assert.ok( p.rangeProperty.tandem.name === 'rangeProperty', 'rangeProperty instrumented' );
  window.assert && assert.throws( () => {
    p = new NumberProperty( 0, {
      range: new Range( 0, 20 ),
      tandem: tandem.createTandem( 'numberProperty2' ),
      rangePropertyOptions: { tandem: tandem.createTandem( 'rangePropertyfdsa' ) }
    } );
  }, 'cannot instrument default rangeProperty with tandem other than "rangeProperty"' );
  p.dispose();

  if ( Tandem.PHET_IO_ENABLED ) {
    const uninstrumentedRangeProperty = new Property<Range | null>( new Range( 0, 1 ) );
    window.assert && assert.throws( () => {
      return new NumberProperty( 0, {
        range: uninstrumentedRangeProperty,
        tandem: tandem.createTandem( 'thisWillNotBeDisposedSoCreateALongNameThatWillNotBeReproducedProperty' )
      } );
    }, 'uninstrumented range cannot be passed to instrumented number property' );
  }
} );

QUnit.test( 'Test NumberProperty.validateOnNextFrame', assert => {
  assert.ok( true, 'all other tests require window.assert' );

  let rangeProperty = new Property<Range | null>( new Range( 0, 10 ) );
  let numberProperty = new NumberProperty( 0, { range: rangeProperty } );

  window.assert && assert.throws( () => {
    return new NumberProperty( 11, { range: rangeProperty } );
  } );

  numberProperty.setValueAndRange( 11, new Range( 0, 11 ) );

  window.assert && assert.throws( () => {
    numberProperty.value = 12;
  } );
  numberProperty = new NumberProperty( 10, { range: rangeProperty } );

  rangeProperty.value = new Range( 0, 100 );

  window.assert && assert.throws( () => {
    rangeProperty.value = new Range( 20, 100 );
  } );
  rangeProperty = new Property<Range | null>( new Range( 0, 10 ) );


  numberProperty = new NumberProperty( 0, { range: rangeProperty, validateOnNextFrame: true } );
  stepTimer.emit( 10 );
  assert.ok( numberProperty.validationTimeout === null, 'cleared out after emit' );

  numberProperty.value = 100;
  window.assert && assert.ok( numberProperty.validationTimeout !== null, 'new number value means new validationTimeout' );
  rangeProperty.value = new Range( 0, 100 );
  stepTimer.emit( 10 );
  window.assert && assert.ok( numberProperty.validationTimeout === null, 'cleared out after emit' );

  numberProperty.value = 101;
  rangeProperty.value = new Range( 0, 10 );
  if ( window.assert ) {
    assert.throws( () => {
      stepTimer.emit( 10 );
    } );
  }
  else {
    stepTimer.emit( 10 );
  }

  // It doesn't matter what the intermediate states are, just that by the time the next frame happens, the range and
  // number are correct
  numberProperty.value = 11;
  numberProperty.value = 101;
  rangeProperty.value = new Range( -1, 0 );
  numberProperty.value = -100;
  rangeProperty.value = new Range( -100, 0 );
  stepTimer.emit( 10 );

  assert.ok( numberProperty.value === -100 );
  assert.ok( rangeProperty.value.min === -100 );
  assert.ok( rangeProperty.value.max === 0 );
  assert.ok( numberProperty.validationTimeout === null );

  // Should not error out after numberProperty has been disposed
  numberProperty.value = 100;
  numberProperty.dispose();
  stepTimer.emit( 10 );

} );


QUnit.test( 'Test NumberProperty.validateOnNextFrame with no rangeProperty', assert => {
  assert.ok( true, 'all other tests require window.assert' );
  let numberProperty = new NumberProperty( 0, { range: new Range( 0, 10 ), validateOnNextFrame: true } );
  stepTimer.emit( 10 );

  numberProperty.value = 100; // intermediate value is allowed
  numberProperty.value = 10;
  stepTimer.emit( 10 );

  assert.ok( numberProperty.validationTimeout === null, 'should be null1' );

  assert.ok( numberProperty.value === 10, 'value' );
  assert.ok( numberProperty.range !== null, 'should not be null' );
  assert.ok( numberProperty.range!.min === 0, 'min' );
  assert.ok( numberProperty.range!.max === 10, 'max' );

  numberProperty.value = 101;
  if ( window.assert ) {
    const validationTimeout = numberProperty.validationTimeout;
    assert.throws( () => {
      stepTimer.emit( 10 );
    } );
    assert.ok( validationTimeout, 'should not be null' );
    stepTimer.removeListener( validationTimeout! ); // workaround since the above throws breaks stepTimer a bit.
  }
  else {
    stepTimer.emit( 10 );
  }
  numberProperty.dispose();
  assert.ok( numberProperty.validationTimeout === null, 'should be null2' );

  // No range provided, should still work
  numberProperty = new NumberProperty( 0, { validateOnNextFrame: true } );
  stepTimer.emit( 10 );

  numberProperty.value = 100; // intermediate value is allowed
  stepTimer.emit( 10 );
  numberProperty.value = 10;
  stepTimer.emit( 10 );

  numberProperty.value = 1000000; // intermediate value is allowed
  numberProperty.value = -10;
  stepTimer.emit( 10 );

  assert.ok( numberProperty.validationTimeout === null );
} );


QUnit.test( 'NumberProperty assertion signatures', assert => {
  assert.ok( true, 'all other tests are written to ensure typescript type checking' );
  const numberProperty = new NumberProperty( 0, { step: 2 } ).asStepped();

  if ( numberProperty.step === null ) {
    assert.ok( false, 'should never happen' );
  }

  assert.ok( numberProperty.step === 2, 'steppable' );

  // as number
  assert.ok( numberProperty.step === 2, 'steppable' );

  const numberProperty2 = new NumberProperty( 0 );
  assert.ok( numberProperty2.step === null, 'not steppable' );

  window.assert && assert.throws( () => {
    new NumberProperty( 0 ).asStepped();
  } );
} );