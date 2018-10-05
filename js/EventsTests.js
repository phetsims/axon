// Copyright 2013-2016, University of Colorado Boulder

/**
 * QUnit Tests for Events
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var Events = require( 'AXON/Events' );

  QUnit.module( 'Events' );

  QUnit.test( 'Basics', function( assert ) {
    var events = new Events(); // eslint-disable-line no-undef

    events.trigger( 'doesNotExist', 1, 2, 3 ); // shouldn't error on non-existent event name

    var aCount = 0;

    function incrementA() { aCount++; }

    assert.equal( events.hasListener( 'a', incrementA ), false, 'No listener on unused event name' );

    events.on( 'a', incrementA );
    events.trigger( 'a' );
    events.trigger( 'a' );
    assert.equal( aCount, 2, 'on() works' );

    assert.equal( events.hasListener( 'a', incrementA ), true, 'Should have increment listener after on()' );

    events.off( 'a', incrementA );
    events.trigger( 'a' );
    assert.equal( aCount, 2, 'off() works' );

    assert.equal( events.hasListener( 'a', incrementA ), false, 'Should not have increment listener after off()' );

    var person = new Events( { name: 'larry', age: '100' } );
    var count = 0;
    var listener = function( person ) {
      count = count + 1;
    };
    person.on( 'reset-all', listener );

    person.trigger( 'reset-all' );
    person.trigger( 'reset-all' );
    person.trigger( 'reset-all' );

    assert.equal( count, 3, 'Trigger calls on' );

    //Unregister the listener
    person.off( 'reset-all', listener );

    //Triggering more events shouldn't call back because we have removed the listener
    person.trigger( 'reset-all' );
    person.trigger( 'reset-all' );
    person.trigger( 'reset-all' );

    assert.equal( count, 3, 'Triggering more events should not call back because we have removed the listener' );

    var planetName = '?';
    var planetRadius = '?';
    person.on( 'planet-discovered', function( name, radius ) {
      planetName = name;
      planetRadius = radius;
    } );

    person.trigger( 'planet-discovered', 'pluto', 12345 );

    assert.equal( planetName, 'pluto', 'argument should pass through event' );
    assert.equal( planetRadius, 12345, 'argument should pass through event' );
  } );

  QUnit.test( 'Static Basics', function( assert ) {
    var events = new Events(); // eslint-disable-line no-undef

    events.trigger( 'doesNotExist', 1, 2, 3 ); // shouldn't error on non-existent event name

    var aCount = 0;

    function incrementA() { aCount++; }

    assert.equal( events.hasStaticListener( 'a', incrementA ), false, 'No listener on unused event name' );

    events.onStatic( 'a', incrementA );
    events.trigger( 'a' );
    events.trigger( 'a' );
    assert.equal( aCount, 2, 'onStatic() works' );

    assert.equal( events.hasStaticListener( 'a', incrementA ), true, 'Should have increment listener after onStatic()' );

    events.offStatic( 'a', incrementA );
    events.trigger( 'a' );
    assert.equal( aCount, 2, 'offStatic() works' );

    assert.equal( events.hasStaticListener( 'a', incrementA ), false, 'Should not have increment listener after offStatic()' );

  } );
} );