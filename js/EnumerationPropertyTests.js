// Copyright 2022, University of Colorado Boulder

/**
 * QUnit Tests for EnumerationProperty
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import EnumerationValue from '../../phet-core/js/EnumerationValue.js';
import Enumeration from '../../phet-core/js/Enumeration.js';
import EnumerationIO from '../../tandem/js/types/EnumerationIO.js';
import EnumerationProperty from './EnumerationProperty.js';

QUnit.module( 'EnumerationProperty' );
QUnit.test( 'EnumerationProperty', assert => {

  class Bird extends EnumerationValue {
    static ROBIN = new Bird();
    static JAY = new Bird();
    static WREN = new Bird();

    static enumeration = new Enumeration( Bird );
  }

  let birdProperty = null;

  // constructor value
  assert.ok( () => {
    birdProperty = new EnumerationProperty( Bird.ROBIN );
  }, 'good constructor value' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationProperty( true );
  }, 'invalid constructor value' );

  // set value
  assert.ok( () => {
    birdProperty.set( Bird.JAY );
  }, 'good set value' );
  window.assert && assert.throws( () => {
    birdProperty.set( 5 );
  }, 'bad set value' );


  window.assert && assert.throws( () => {
    birdProperty = new EnumerationProperty( Bird.ROBIN, { phetioType: EnumerationIO } );
  }, 'EnumerationProperty sets phetioType' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationProperty( Bird, { phetioType: EnumerationIO } );
  }, 'Not the Enumeration, but a value as first arg' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationProperty( {} );
  }, 'That is not an enumeration' );
} );

QUnit.test( 'EnumerationIO validation', assert => {

    class Bird1 extends EnumerationValue {
      static ROBIN = new Bird1();
      static JAY = new Bird1();
      static WREN = new Bird1();
      static enumeration = new Enumeration( Bird1 );
    }

    class Bird2 extends EnumerationValue {
      static ROBIN = new Bird2();
      static JAY = new Bird2();
      static WREN = new Bird2();
      static enumeration = new Enumeration( Bird2, { phetioDocumentation: 'the second one' } );
    }

    assert.ok( Bird1 !== Bird2, 'different Enumerations' );
    assert.ok( Bird1.ROBIN !== Bird2.ROBIN, 'different Enumerations' );
    let birdProperty = new EnumerationProperty( Bird1.ROBIN );
    const birdProperty2 = new EnumerationProperty( Bird2.ROBIN );

    // constructor value
    window.assert && assert.throws( () => {
      birdProperty.set( Bird2.ROBIN );
    }, 'cannot use same string value from other EnumerationDeprecated instance' );

    // new instance of birdProperty since it got messed up in the above assert.
    birdProperty = new EnumerationProperty( Bird1.ROBIN );

    birdProperty.set( Bird1.WREN );

    // This should not fail! If it does then EnumerationIO and PropertyIO caching isn't working, see https://github.com/phetsims/phet-core/issues/79
    birdProperty2.set( Bird2.WREN );
  }
);

QUnit.test( 'validValues as a subset of Enumeration values', assert => {


  class Bird1 extends EnumerationValue {
    static ROBIN = new Bird1();
    static JAY = new Bird1();
    static WREN = new Bird1();
    static enumeration = new Enumeration( Bird1 );
  }

  class Bird2 extends EnumerationValue {
    static ROBIN = new Bird2();
    static JAY = new Bird2();
    static WREN = new Bird2();
    static enumeration = new Enumeration( Bird2, { phetioDocumentation: 'the second one' } );
  }

  assert.ok( Bird1 !== Bird2, 'different Enumerations' );
  assert.ok( Bird1.ROBIN !== Bird2.ROBIN, 'different Enumerations' );


  const enumerationProperty1 = new EnumerationProperty( Bird1.ROBIN, { validValues: [ Bird1.ROBIN, Bird1.JAY ] } );

  enumerationProperty1.value = Bird1.JAY;
  assert.ok( enumerationProperty1.value === Bird1.JAY, 'basic test for when assertions are not enabled' );
  assert.ok( enumerationProperty1.getInitialValue() === Bird1.ROBIN, 'basic test for when assertions are not enabled for initialValue' );

  window.assert && assert.throws( () => {
    enumerationProperty1.value = Bird1.WREN;
  }, 'not a valid value' );

  window.assert && assert.throws( () => {
    enumerationProperty1.value = Bird2.ROBIN;
  }, 'not a valid value, from a different Enumeration' );
} );


QUnit.test( 'Subtyping EnumerationValues', assert => {

  class Raptor extends EnumerationValue {
    static HAWK = new Raptor();
    static EAGLE = new Raptor();
    static enumeration = new Enumeration( Raptor, { phetioDocumentation: 'the second one' } );
  }

  class Bird extends Raptor {
    static ROBIN = new Bird();
    static JAY = new Bird();
    static WREN = new Bird();
    static enumeration = new Enumeration( Bird, {
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