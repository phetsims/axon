// Copyright 2016, University of Colorado Boulder

(function() {
  'use strict';

  module( 'Axon: Events' );

  test( 'Basics', function() {
    var events = new axon.Events(); // eslint-disable-line no-undef

    events.trigger( 'doesNotExist', 1, 2, 3 ); // shouldn't error on non-existent event name

    var aCount = 0;

    function incrementA() { aCount++; }

    function addIncrementAOnce() { events.once( 'a', incrementA ); }

    equal( events.hasListener( 'a', incrementA ), false, 'No listener on unused event name' );

    events.on( 'a', incrementA );
    events.trigger( 'a' );
    events.trigger( 'a' );
    equal( aCount, 2, 'on() works' );

    equal( events.hasListener( 'a', incrementA ), true, 'Should have increment listener after on()' );

    events.off( 'a', incrementA );
    events.trigger( 'a' );
    equal( aCount, 2, 'off() works' );

    equal( events.hasListener( 'a', incrementA ), false, 'Should not have increment listener after off()' );

    /*---------------------------------------------------------------------------*
     * Concurrent modification for non-static
     *----------------------------------------------------------------------------*/

    // will add a listener for 'a' increment when 'a' is fired
    events.on( 'a', addIncrementAOnce );
    events.trigger( 'a' );
    events.off( 'a', addIncrementAOnce );
    equal( aCount, 2, 'Increment should not fire, it was added while other callback was fired' );

    events.trigger( 'a' );
    equal( aCount, 3, 'Now increment should fire, but will remove itself' );

    events.trigger( 'a' );
    equal( aCount, 3, 'Since increment was once(), it should not increment more' );
  } );

  test( 'Static Basics', function() {
    var events = new axon.Events(); // eslint-disable-line no-undef

    events.trigger( 'doesNotExist', 1, 2, 3 ); // shouldn't error on non-existent event name

    var aCount = 0;

    function incrementA() { aCount++; }

    equal( events.hasStaticListener( 'a', incrementA ), false, 'No listener on unused event name' );

    events.onStatic( 'a', incrementA );
    events.trigger( 'a' );
    events.trigger( 'a' );
    equal( aCount, 2, 'onStatic() works' );

    equal( events.hasStaticListener( 'a', incrementA ), true, 'Should have increment listener after onStatic()' );

    events.offStatic( 'a', incrementA );
    events.trigger( 'a' );
    equal( aCount, 2, 'offStatic() works' );

    equal( events.hasStaticListener( 'a', incrementA ), false, 'Should not have increment listener after offStatic()' );

  } );

  test( 'Emitter Basics', function() {
    var stack = [];
    var emitter = new axon.Emitter(); // eslint-disable-line no-undef
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

    equal( stack.length, 2, 'Should have received 2 callbacks' );
    equal( stack[ 0 ], 'a', 'true' );
    equal( stack[ 1 ], 'b', 'true' );

    equal( emitter.hasListener( b ), false, 'b should have been removed' );
  } );

  test( 'Emitter Tricks', function() {
    var entries = [];

    var emitter = new axon.Emitter(); // eslint-disable-line no-undef

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
      ok( !( entry.listener === 'c' && entry.arg === 'first' ), 'not C,first' );
    } );

    equal( entries.length, 7, 'Should have 7 callbacks' );

    equal( entries[ 0 ].listener, 'a' );
    equal( entries[ 0 ].arg, 'first' );

    equal( entries[ 1 ].listener, 'a' );
    equal( entries[ 1 ].arg, 'second' );

    equal( entries[ 2 ].listener, 'b' );
    equal( entries[ 2 ].arg, 'second' );

    equal( entries[ 3 ].listener, 'a' );
    equal( entries[ 3 ].arg, 'third' );

    equal( entries[ 4 ].listener, 'b' );
    equal( entries[ 4 ].arg, 'third' );

    equal( entries[ 5 ].listener, 'c' );
    equal( entries[ 5 ].arg, 'third' );

    equal( entries[ 6 ].listener, 'b' );
    equal( entries[ 6 ].arg, 'first' );
  } );

})();
