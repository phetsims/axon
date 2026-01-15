// Copyright 2025-2026, University of Colorado Boulder

/**
 * QUnit Tests for EnumerationDeprecatedProperty
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import EnumerationDeprecated from '../../phet-core/js/EnumerationDeprecated.js';
import EnumerationIO from '../../tandem/js/types/EnumerationIO.js';
import EnumerationDeprecatedProperty from './EnumerationDeprecatedProperty.js';

// Type for Birds enumeration with dynamic keys
type BirdsEnumeration = EnumerationDeprecated & { ROBIN: object; JAY: object; WREN: object };
type Birds4Enumeration = EnumerationDeprecated & { ROBIN: object; JAY: object; WREN: object; OTHER: object };
type Birds4Enumeration2 = EnumerationDeprecated & { ROBIN: object; JAY: object; WREN: object; OTHER1: object };
type Birds4Enumeration3 = EnumerationDeprecated & { ROBIN: object; JAY: object; WREN: object; OTHER2: object };

QUnit.module( 'EnumerationDeprecatedProperty' );
QUnit.test( 'EnumerationDeprecatedProperty', assert => {

  const Birds = EnumerationDeprecated.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] ) as BirdsEnumeration;
  let birdProperty: EnumerationDeprecatedProperty | null = null;

  // constructor value
  assert.ok( () => {
    birdProperty = new EnumerationDeprecatedProperty( Birds, Birds.ROBIN );
  }, 'good constructor value' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationDeprecatedProperty( Birds, true as unknown as object );
  }, 'invalid constructor value' );

  // set value
  assert.ok( () => {
    birdProperty!.set( Birds.JAY );
  }, 'good set value' );
  window.assert && assert.throws( () => {
    birdProperty!.set( 5 as unknown as object );
  }, 'bad set value' );

  // superclass options that are not supported by EnumerationDeprecatedProperty
  window.assert && assert.throws( () => {
    // @ts-expect-error - testing invalid option
    birdProperty = new EnumerationDeprecatedProperty( Birds, Birds.ROBIN, { isValidValue: () => true } );
  }, 'EnumerationDeprecatedProperty does not support isValidValue' );

  // superclass options that are controlled by EnumerationDeprecatedProperty
  window.assert && assert.throws( () => {
    // @ts-expect-error - testing invalid option
    birdProperty = new EnumerationDeprecatedProperty( Birds, Birds.ROBIN, { valueType: Birds } );
  }, 'EnumerationDeprecatedProperty sets valueType' );
  window.assert && assert.throws( () => {
    // @ts-expect-error - testing invalid option
    birdProperty = new EnumerationDeprecatedProperty( Birds, Birds.ROBIN, { phetioType: EnumerationIO } );
  }, 'EnumerationDeprecatedProperty sets phetioType' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationDeprecatedProperty( Birds, { phetioType: EnumerationIO } );
  }, 'Did not include initial value' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationDeprecatedProperty( {} as EnumerationDeprecated, {} );
  }, 'That is not an enumeration' );
} );

QUnit.test( 'EnumerationIO validation', assert => {

    const Birds1 = EnumerationDeprecated.byKeys( [ 'ROBIN', 'JAY', 'WREN', 'OTHER' ] ) as Birds4Enumeration;
    const Birds2 = EnumerationDeprecated.byKeys( [ 'ROBIN', 'JAY', 'WREN', 'OTHER1' ], { phetioDocumentation: 'the second one' } ) as Birds4Enumeration2;
    // @ts-expect-error
    assert.ok( Birds1 !== Birds2, 'different Enumerations' );
    assert.ok( Birds1.ROBIN !== Birds2.ROBIN, 'different Enumerations' );
    let bird1Property = new EnumerationDeprecatedProperty( Birds1, Birds1.ROBIN );
    const bird2Property = new EnumerationDeprecatedProperty( Birds2, Birds2.ROBIN );

    // constructor value
    window.assert && assert.throws( () => {
      bird1Property.set( Birds2.ROBIN );
    }, 'cannot use same string value from other EnumerationDeprecated instance' );

    // new instance of birdProperty since it got messed up in the above assert.
    bird1Property = new EnumerationDeprecatedProperty( Birds1, Birds1.ROBIN );

    bird1Property.set( Birds1.WREN );

    // This should not fail! If it does then EnumerationIO and PropertyIO caching isn't working, see https://github.com/phetsims/phet-core/issues/79
    bird2Property.set( Birds2.WREN );
  }
);

QUnit.test( 'validValues as a subset of EnumerationDeprecated values', assert => {

  const Birds1 = EnumerationDeprecated.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] ) as BirdsEnumeration;
  const Birds2 = EnumerationDeprecated.byKeys( [ 'ROBIN', 'JAY', 'WREN', 'OTHER2' ], { phetioDocumentation: 'the second one' } ) as Birds4Enumeration3;
  assert.ok( Birds1 !== Birds2, 'different Enumerations' );
  assert.ok( Birds1.ROBIN !== Birds2.ROBIN, 'different Enumerations' );


  const enumeration1Property = new EnumerationDeprecatedProperty( Birds1, Birds1.ROBIN, { validValues: [ Birds1.ROBIN, Birds1.JAY ] } );

  enumeration1Property.value = Birds1.JAY;
  assert.ok( enumeration1Property.value === Birds1.JAY, 'basic test for when assertions are not enabled' );
  assert.ok( enumeration1Property.getInitialValue() === Birds1.ROBIN, 'basic test for when assertions are not enabled for initialValue' );

  window.assert && assert.throws( () => {
    enumeration1Property.value = Birds1.WREN;
  }, 'not a valid value' );

  window.assert && assert.throws( () => {
    enumeration1Property.value = Birds2.ROBIN;
  }, 'not a valid value, from a different EnumerationDeprecated' );

} );
