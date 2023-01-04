// Copyright 2022-2023, University of Colorado Boulder

/**
 * QUnit Tests for EnumerationProperty
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Enumeration from '../../phet-core/js/Enumeration.js';
import EnumerationValue from '../../phet-core/js/EnumerationValue.js';
import EnumerationIO from '../../tandem/js/types/EnumerationIO.js';
import EnumerationProperty from './EnumerationProperty.js';

QUnit.module( 'EnumerationProperty' );
QUnit.test( 'EnumerationProperty', assert => {

  class Bird extends EnumerationValue {
    public static readonly ROBIN = new Bird();
    public static readonly JAY = new Bird();
    public static readonly WREN = new Bird();

    public static readonly enumeration = new Enumeration( Bird );
  }

  let birdProperty: EnumerationProperty<Bird>;

  // constructor value
  assert.ok( () => {
    birdProperty = new EnumerationProperty( Bird.ROBIN );
  }, 'good constructor value' );
  window.assert && assert.throws( () => {

    // @ts-expect-error INTENTIONAL testing behavior of passing in the wrong value
    birdProperty = new EnumerationProperty( true );
  }, 'invalid constructor value' );

  // set value
  assert.ok( () => {
    birdProperty.set( Bird.JAY );
  }, 'good set value' );
  window.assert && assert.throws( () => {

    // @ts-expect-error INTENTIONAL testing behavior of passing in the wrong value
    birdProperty.set( 5 );
  }, 'bad set value' );


  window.assert && assert.throws( () => {

    // @ts-expect-error INTENTIONAL testing set of phetioType
    birdProperty = new EnumerationProperty( Bird.ROBIN, { phetioType: EnumerationIO } );
  }, 'EnumerationProperty sets phetioType' );
  window.assert && assert.throws( () => {

    // @ts-expect-error INTENTIONAL testing behavior of passing in the wrong value
    birdProperty = new EnumerationProperty( Bird, { phetioType: EnumerationIO } );
  }, 'Not the Enumeration, but a value as first arg' );
  window.assert && assert.throws( () => {

    // @ts-expect-error INTENTIONAL testing behavior of passing in the wrong value
    birdProperty = new EnumerationProperty( {} );
  }, 'That is not an enumeration' );
} );

QUnit.test( 'EnumerationIO validation', assert => {

    class Bird1 extends EnumerationValue {
      public static readonly ROBIN = new Bird1();
      public static readonly JAY = new Bird1();
      public static readonly WREN = new Bird1();
      public static readonly GOAT = new Bird1();
      public static readonly enumeration = new Enumeration( Bird1 );
    }

    class Bird2 extends EnumerationValue {
      public static readonly ROBIN = new Bird2();
      public static readonly JAY = new Bird2();
      public static readonly WREN = new Bird2();
      public static readonly OTHER_WREN = new Bird2();
      public static readonly enumeration = new Enumeration( Bird2, { phetioDocumentation: 'the second one' } );
    }

    // @ts-expect-error INTENTIONAL checking these are indeed different enumerations
    assert.ok( Bird1 !== Bird2, 'different Enumerations' );
    assert.ok( Bird1.ROBIN !== Bird2.ROBIN, 'different Enumerations' );
    let birdProperty = new EnumerationProperty( Bird1.ROBIN );
    const bird2Property = new EnumerationProperty( Bird2.ROBIN );

    // constructor value
    window.assert && assert.throws( () => {
      birdProperty.set( Bird2.ROBIN );
    }, 'cannot use same string value from other EnumerationDeprecated instance' );

    // new instance of birdProperty since it got messed up in the above assert.
    birdProperty = new EnumerationProperty( Bird1.ROBIN );

    birdProperty.set( Bird1.WREN );

    // This should not fail! If it does then EnumerationIO and PropertyIO caching isn't working, see https://github.com/phetsims/phet-core/issues/79
    bird2Property.set( Bird2.WREN );
  }
);

QUnit.test( 'validValues as a subset of Enumeration values', assert => {


  class Bird1 extends EnumerationValue {
    public static readonly ROBIN = new Bird1();
    public static readonly JAY = new Bird1();
    public static readonly WREN = new Bird1();
    public static readonly WREN_2 = new Bird1();
    public static readonly enumeration = new Enumeration( Bird1 );
  }

  class Bird2 extends EnumerationValue {
    public static readonly ROBIN = new Bird2();
    public static readonly JAY = new Bird2();
    public static readonly WREN = new Bird2();
    public static readonly WREN_3 = new Bird2();
    public static readonly enumeration = new Enumeration( Bird2, { phetioDocumentation: 'the second one' } );
  }

  // @ts-expect-error INTENTIONAL testing these are indeed different enumerations
  assert.ok( Bird1 !== Bird2, 'different Enumerations' );
  assert.ok( Bird1.ROBIN !== Bird2.ROBIN, 'different Enumerations' );


  const enumeration1Property = new EnumerationProperty( Bird1.ROBIN, { validValues: [ Bird1.ROBIN, Bird1.JAY ] } );

  enumeration1Property.value = Bird1.JAY;
  assert.ok( enumeration1Property.value === Bird1.JAY, 'basic test for when assertions are not enabled' );
  assert.ok( enumeration1Property.getInitialValue() === Bird1.ROBIN, 'basic test for when assertions are not enabled for initialValue' );

  window.assert && assert.throws( () => {
    enumeration1Property.value = Bird1.WREN;
  }, 'not a valid value' );

  window.assert && assert.throws( () => {
    enumeration1Property.value = Bird2.ROBIN;
  }, 'not a valid value, from a different Enumeration' );
} );


QUnit.test( 'Subtyping EnumerationValues', assert => {

  class Raptor extends EnumerationValue {
    public static readonly HAWK = new Raptor();
    public static readonly EAGLE = new Raptor();
    public static readonly enumeration = new Enumeration( Raptor, { phetioDocumentation: 'the second one' } );
  }

  class Bird extends Raptor {
    public static readonly ROBIN = new Bird();
    public static readonly JAY = new Bird();
    public static readonly WREN = new Bird();
    public static override readonly enumeration = new Enumeration( Bird, {
      instanceType: Raptor
    } );
  }

  let enumerationProperty = new EnumerationProperty( Raptor.HAWK );

  assert.ok( true, 'when assertions are not enabled' );

  // This is unfortunate, but the enumeration is by default gathered by the initial value of EnumerationProperty
  window.assert && assert.throws( () => {
    enumerationProperty.value = Bird.ROBIN;
  } );

  enumerationProperty = new EnumerationProperty( Raptor.HAWK, {
    enumeration: Bird.enumeration
  } );

  enumerationProperty.value = Bird.ROBIN;
  enumerationProperty.value = Bird.HAWK;
  enumerationProperty.value = Raptor.EAGLE;
  enumerationProperty.value = Bird.WREN;
  enumerationProperty.value = Bird.EAGLE;
} );