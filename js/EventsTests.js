// Copyright 2013-2016, University of Colorado Boulder

/**
 * Lightweight event & listener abstraction.
 *
 * @deprecated - use Emitter.js instead
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var Emitter = require( 'AXON/Emitter' );
  var Events = require( 'AXON/Events' );

  var EventsTests = {
    runTests: function() {
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

      // TODO: move to EmitterTests.js
      QUnit.test( 'Emitter Basics', function( assert ) {
        var stack = [];
        var emitter = new Emitter(); // eslint-disable-line no-undef
        var a = function() {
          stack.push( 'a' );
          emitter.removeListener( b );
        };
        var b = function() {
          stack.push( 'b' );
        };
        emitter.addListener( a );
        emitter.addListener( b );
        emitter.emit();

        assert.equal( stack.length, 2, 'Should have received 2 callbacks' );
        assert.equal( stack[ 0 ], 'a', 'true' );
        assert.equal( stack[ 1 ], 'b', 'true' );

        assert.equal( emitter.hasListener( b ), false, 'b should have been removed' );
      } );

      QUnit.test( 'Emitter Tricks', function( assert ) {
        var entries = [];

        var emitter = new Emitter(); // eslint-disable-line no-undef

        var a = function( arg ) {
          entries.push( { listener: 'a', arg: arg } );

          if ( arg === 'first' ) {
            emitter.emit1( 'second' );
          }
        };
        var b = function( arg ) {
          entries.push( { listener: 'b', arg: arg } );

          if ( arg === 'second' ) {
            emitter.addListener( c );
            emitter.emit1( 'third' );
          }
        };
        var c = function( arg ) {
          entries.push( { listener: 'c', arg: arg } );
        };

        emitter.addListener( a );
        emitter.addListener( b );
        emitter.emit1( 'first' );

        /*
         * Expected order:
         *   a first
         *     a second
         *     b second
         *       a third
         *       b third
         *       c third
         *   b first
         *
         * It looks like "c first" is (currently?) being triggered since defendCallbacks only defends the top of the stack.
         * If the stack is [ undefended, undefended ], changing listeners copies only the top, leaving
         * [ undefended, defended ], and our first event triggers a listener that wasn't listening when it was called.
         */
        _.each( entries, function( entry ) {
          assert.ok( !(entry.listener === 'c' && entry.arg === 'first'), 'not C,first' );
        } );

        assert.equal( entries.length, 7, 'Should have 7 callbacks' );

        assert.equal( entries[ 0 ].listener, 'a' );
        assert.equal( entries[ 0 ].arg, 'first' );

        assert.equal( entries[ 1 ].listener, 'a' );
        assert.equal( entries[ 1 ].arg, 'second' );

        assert.equal( entries[ 2 ].listener, 'b' );
        assert.equal( entries[ 2 ].arg, 'second' );

        assert.equal( entries[ 3 ].listener, 'a' );
        assert.equal( entries[ 3 ].arg, 'third' );

        assert.equal( entries[ 4 ].listener, 'b' );
        assert.equal( entries[ 4 ].arg, 'third' );

        assert.equal( entries[ 5 ].listener, 'c' );
        assert.equal( entries[ 5 ].arg, 'third' );

        assert.equal( entries[ 6 ].listener, 'b' );
        assert.equal( entries[ 6 ].arg, 'first' );
      } );
    }
  };

  axon.register( 'EventsTests', EventsTests );

  return EventsTests;
} );