// Copyright 2017, University of Colorado Boulder

/**
 * QUnit tests for Emitter
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const Emitter = require( 'AXON/Emitter' );

  QUnit.module( 'Emitter' );

  QUnit.test( 'Test emit timing Emitter', assert => {

    const e = new Emitter();
    let x = 0;
    e.addListener( () => {x++;} );
    e.addListener( () => {x++;} );
    e.addListener( () => {x++;} );
    e.addListener( () => {x++;} );
    e.addListener( () => {x++;} );

    e.emit();

    assert.ok( x === 5, 'fired all listeners' );

    const e1 = new Emitter();
    e1.addListener( () => {} );


    let testEmitter = function( e, numberOfLoopings ) {

      let start = Date.now();

      for ( let i = 0; i < numberOfLoopings; i++ ) {
        // e.emit();
        e.emit3( 'blarg', 'fdsa', 344738291043 );
      }
      let end = Date.now();
      let totalTime = end - start;
      console.log( `Time for ${numberOfLoopings}: `, totalTime, totalTime / numberOfLoopings );
    };

    // No assertions here, but it can be nice to test how expensive emit calls are
    testEmitter( e1, 10000000 );
    testEmitter( e, 10000000 );
  } );

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

    var emitter = new Emitter( { valueTypes: [ 'string' ] } ); // eslint-disable-line no-undef

    var a = function( arg ) {
      entries.push( { listener: 'a', arg: arg } );

      if ( arg === 'first' ) {
        emitter.emit( 'second' );
      }
    };
    var b = function( arg ) {
      entries.push( { listener: 'b', arg: arg } );

      if ( arg === 'second' ) {
        emitter.addListener( c );
        emitter.emit( 'third' );
      }
    };
    var c = function( arg ) {
      entries.push( { listener: 'c', arg: arg } );
    };

    emitter.addListener( a );
    emitter.addListener( b );
    emitter.emit( 'first' );

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
      assert.ok( !( entry.listener === 'c' && entry.arg === 'first' ), 'not C,first' );
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
} );