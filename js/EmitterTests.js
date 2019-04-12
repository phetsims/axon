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

  QUnit.test( 'Emitter Constructing and options', assert => {

    assert.ok( true, 'Token test in case assertions are disabled, because each test must have at least one assert.' );
    const e1 = new Emitter( {
      validators: [ { valueType: 'number' } ]
    } );

    e1.emit( 1 );

    if ( window.assert ) {
      assert.throws( () => { e1.emit( 2, 2 ); }, 'Wrong number of emitting parameters' );
      assert.throws( () => { e1.emit( true ); }, 'Wrong parameter type bool' );
      assert.throws( () => { e1.emit( '2, 2' ); }, 'Wrong parameter type string' );
      assert.throws( () => { e1.emit( undefined ); }, 'Wrong parameter type undefined' );
      assert.throws( () => { e1.emit( null ); }, 'Wrong parameter type null' );
    }

    // emitting with an object as parameter
    const e2 = new Emitter( {
      validators: [ { valueType: Emitter }, { valueType: Object }, { valueType: 'function' } ]
    } );

    e2.emit( new Emitter(), {}, () => {} );

    if ( window.assert ) {
      assert.throws( () => { e2.emit( 2, 2 ); }, 'Wrong number of emitting parameters, for e2' );
      assert.throws( () => { e2.emit( true ); }, 'Wrong parameter type bool, for e2' );
      assert.throws( () => { e2.emit( '2, 2' ); }, 'Wrong parameter type string, for e2' );
      assert.throws( () => { e2.emit( undefined ); }, 'Wrong parameter type undefined, for e2' );
      assert.throws( () => { e2.emit( null ); }, 'Wrong parameter type null, for e2' );
      assert.throws( () => { e2.emit( new Emitter(), 7, () => {} ); }, 'Should catch second argument as wrong type' );
      assert.throws( () => { e2.emit( new Emitter() ); }, 'Should catch not enough arguments' );
    }

    const e3 = new Emitter( {
      validators: [ { valueType: 'number' }, { isValidValue: v => v === null || typeof v === 'string' } ]
    } );

    e3.emit( 1, 'hi' );
    e3.emit( 1, null );

    if ( window.assert ) {
      assert.throws( () => { e3.emit( 1 ); }, 'Wrong parameter type undefined' );
      assert.throws( () => { e3.emit( 1, undefined ); }, 'Wrong parameter type undefined' );
      assert.throws( () => { e3.emit( 1, 0 ); }, 'Wrong parameter type 0' );
      assert.throws( () => { e3.emit( 1, { hello: 'hi' } ); }, 'Wrong parameter type object' );
    }
  } );

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

    const testEmitter = ( emitter, numberOfLoopings ) => {

      const start = Date.now();

      for ( let i = 0; i < numberOfLoopings; i++ ) {
        emitter.emit();
      }
      const end = Date.now();
      const totalTime = end - start;
      console.log( `Time for ${numberOfLoopings}: `, totalTime, totalTime / numberOfLoopings );
    };

    // No assertions here, but it can be nice to test how expensive emit calls are
    testEmitter( e1, 10000000 );
    testEmitter( e, 10000000 );
  } );

  QUnit.test( 'Emitter Basics', assert => {
    const stack = [];
    const emitter = new Emitter(); // eslint-disable-line no-undef
    const a = () => {
      stack.push( 'a' );
      emitter.removeListener( b );
    };
    const b = () => {
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

  QUnit.test( 'Emitter Tricks', assert => {
    const entries = [];

    const emitter = new Emitter( {
      validators: [ { valueType: 'string' } ]
    } );

    const a = arg => {
      entries.push( { listener: 'a', arg: arg } );

      if ( arg === 'first' ) {
        emitter.emit( 'second' );
      }
    };
    const b = arg => {
      entries.push( { listener: 'b', arg: arg } );

      if ( arg === 'second' ) {
        emitter.addListener( c );
        emitter.emit( 'third' );
      }
    };
    const c = arg => {
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
    _.each( entries, entry => {
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