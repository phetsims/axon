// Copyright 2018-2025, University of Colorado Boulder

/**
 * QUnit tests for Emitter
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */

import type TEmitter from './TEmitter.js';
import TinyEmitter, { type ReentrantNotificationStrategy } from './TinyEmitter.js';

QUnit.module( 'TinyEmitter' );

QUnit.test( 'TinyEmitter can emit anything', assert => {

  assert.ok( true, 'Token test, because each test must have at least one assert.' );

  const e1: TEmitter<[ arg1: unknown, arg2?: unknown ]> = new TinyEmitter();
  e1.emit( 1 );
  e1.emit( 2, 2 );
  e1.emit( true );
  e1.emit( '2, 2' );
  e1.emit( undefined );
  e1.emit( null );

  const e2: TEmitter<[ arg1: unknown, arg2?: unknown, arg3?: unknown ]> = new TinyEmitter();
  e2.emit( new TinyEmitter(), {}, _.noop() );
  e2.emit( 2, 2 );
  e2.emit( true );
  e2.emit( '2, 2' );
  e2.emit( undefined );
  e2.emit( null );
  e2.emit( new TinyEmitter(), 7, _.noop() );
  e2.emit( new TinyEmitter() );
} );

QUnit.test( 'Test emit timing TinyEmitter', assert => {

  const e = new TinyEmitter();
  let x = 0;
  e.addListener( () => {x++;} );
  e.addListener( () => {x++;} );
  e.addListener( () => {x++;} );
  e.addListener( () => {x++;} );
  e.addListener( () => {x++;} );

  e.emit();

  assert.ok( x === 5, 'fired all listeners' );

  const e1 = new TinyEmitter();
  e1.addListener( () => { _.noop(); } );

  // const testEmitter = ( emitter, numberOfLoopings ) => {
  //
  //   const start = Date.now();
  //
  //   for ( let i = 0; i < numberOfLoopings; i++ ) {
  //     emitter.emit();
  //   }
  //   const end = Date.now();
  //   const totalTime = end - start;
  //   console.log( `Time for ${numberOfLoopings}: `, totalTime, totalTime / numberOfLoopings );
  // };
  //
  // // No assertions here, but it can be nice to test how expensive emit calls are
  // testEmitter( e1, 10000000 );
  // testEmitter( e, 10000000 );
} );

QUnit.test( 'TinyEmitter Basics', assert => {
  const stack: Array<string> = [];
  const emitter = new TinyEmitter();
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

  emitter.dispose();
  window.assert && assert.throws( () => emitter.addListener( () => { _.noop(); } ), 'should throw error when adding a listener to disposed' );
} );

QUnit.test( 'TinyEmitter Tricks', assert => {

  const create = ( reentrantNotificationStrategy: ReentrantNotificationStrategy ): Array<{ listener: string; arg: string }> => {
    const entries: Array<{ listener: string; arg: string }> = [];

    const emitter: TEmitter<[ string ]> = new TinyEmitter( null, null, reentrantNotificationStrategy );

    const a = ( arg: string ) => {
      entries.push( { listener: 'a', arg: arg } );

      if ( arg === 'first' ) {
        emitter.emit( 'second' );
      }
    };
    const b = ( arg: string ) => {
      entries.push( { listener: 'b', arg: arg } );

      if ( arg === 'second' ) {
        emitter.addListener( c );
        emitter.emit( 'third' );
      }
    };
    const c = ( arg: string ) => {
      entries.push( { listener: 'c', arg: arg } );
    };

    emitter.addListener( a );
    emitter.addListener( b );
    emitter.emit( 'first' );
    return entries;
  };

  const stackEntries = create( 'stack' );

  /**
   * Stack notify strategy
   *
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
  _.each( stackEntries, entry => {
    assert.ok( !( entry.listener === 'c' && entry.arg === 'first' ), 'not C,first' );
  } );

  assert.equal( stackEntries.length, 7, 'Should have 7 callbacks' );

  assert.equal( stackEntries[ 0 ].listener, 'a' );
  assert.equal( stackEntries[ 0 ].arg, 'first' );

  assert.equal( stackEntries[ 1 ].listener, 'a' );
  assert.equal( stackEntries[ 1 ].arg, 'second' );

  assert.equal( stackEntries[ 2 ].listener, 'b' );
  assert.equal( stackEntries[ 2 ].arg, 'second' );

  assert.equal( stackEntries[ 3 ].listener, 'a' );
  assert.equal( stackEntries[ 3 ].arg, 'third' );

  assert.equal( stackEntries[ 4 ].listener, 'b' );
  assert.equal( stackEntries[ 4 ].arg, 'third' );

  assert.equal( stackEntries[ 5 ].listener, 'c' );
  assert.equal( stackEntries[ 5 ].arg, 'third' );

  assert.equal( stackEntries[ 6 ].listener, 'b' );
  assert.equal( stackEntries[ 6 ].arg, 'first' );

  /////////////////////////////////////////
  // Queue notify strategy
  const queueEntries = create( 'queue' );

  _.each( stackEntries, entry => {
    assert.ok( !( entry.listener === 'c' && entry.arg === 'first' ), 'not C,first' );
  } );
  const testCorrect = ( index: number, listenerName: string, emitCall: string ) => {
    assert.equal( queueEntries[ index ].listener, listenerName, `${index} correctness` );
    assert.equal( queueEntries[ index ].arg, emitCall, `${index} correctness` );
  };
  testCorrect( 0, 'a', 'first' );
  testCorrect( 1, 'b', 'first' );
  testCorrect( 2, 'a', 'second' );
  testCorrect( 3, 'b', 'second' );
  testCorrect( 4, 'a', 'third' );
  testCorrect( 5, 'b', 'third' );
  testCorrect( 6, 'c', 'third' );
} );


QUnit.test( 'TinyEmitter onBeforeNotify', assert => {

  const state = { happiness: 0 };

  const callForHappinessEmitter = new TinyEmitter( () => {
    state.happiness++;
  } );

  let countCalled = 0;
  callForHappinessEmitter.addListener( () => {

    assert.ok( ++countCalled === state.happiness, `happiness should change as emitted: ${countCalled}` );

  } );

  callForHappinessEmitter.emit();
  callForHappinessEmitter.emit();
  callForHappinessEmitter.emit();
  callForHappinessEmitter.emit();
  callForHappinessEmitter.emit();
  assert.ok( state.happiness === 5, 'end count' );
} );

QUnit.test( 'TinyEmitter reverse and random', assert => {

  assert.ok( true, 'first test' );

  const emitter = new TinyEmitter();
  const values: string[] = [];
  emitter.addListener( () => values.push( 'a' ) );
  emitter.addListener( () => values.push( 'b' ) );
  emitter.addListener( () => values.push( 'c' ) );
  emitter.addListener( () => values.push( 'd' ) );

  emitter.emit();
  assert.ok( values.join( '' ) === 'abcd', 'normal order' );

  // Check these values when running with ?listenerOrder=reverse or ?listenerOrder=random or ?listenerOrder=random(123)
  console.log( values.join( '' ) );
} );

QUnit.test( 'TinyEmitter listener order should match emit order (reentrantNotify:queue)', assert => {
  const emitter = new TinyEmitter<[ number ]>( null, null, 'queue' );
  let count = 1;
  emitter.addListener( number => {
    if ( number < 10 ) {
      emitter.emit( number + 1 );
      console.log( number );
    }
  } );
  emitter.addListener( number => {
    assert.ok( number === count++, `should go in order of emitting: ${number}` );
  } );
  emitter.emit( count );
} );


QUnit.test( 'TinyEmitter listener order should match emit order (reentrantNotify:stack)', assert => {
  const emitter = new TinyEmitter<[ number ]>( null, null, 'stack' );
  let finalCount = 10;
  emitter.addListener( number => {
    if ( number < 10 ) {
      emitter.emit( number + 1 );
      console.log( number );
    }
  } );
  emitter.addListener( number => {
    assert.ok( number === finalCount--, `should go in order of emitting: ${number}` );
  } );
  emitter.emit( 1 );
} );

QUnit.test( 'TinyEmitter reentrant listener order should not call newly added listener (reentrant:queue)', assert => {
  const emitter = new TinyEmitter<[ number ]>( null, null, 'queue' );
  let count = 1;
  const neverCall = ( addedNumber: number ) => {
    return ( number: number ) => {
      assert.ok( number > addedNumber, `this should never be called for ${addedNumber} or earlier since it was added after that number's emit call` );
    };
  };
  emitter.addListener( number => {
    if ( number < 10 ) {
      emitter.addListener( neverCall( number ) );
      emitter.emit( number + 1 );
    }
  } );
  emitter.addListener( number => {
    assert.ok( number === count++, `should go in order of emitting: ${number}` );
  } );
  emitter.emit( count );
} );

QUnit.test( 'TinyEmitter reentrant listener order should not call newly added listener (reentrant:stack)', assert => {
  const emitter = new TinyEmitter<[ number ]>( null, null, 'stack' );
  const finalNumber = 10;
  let countDown = finalNumber;
  const neverCall = ( addedNumber: number ) => {
    return ( number: number ) => {
      assert.ok( number > addedNumber, `this should never be called for ${addedNumber} or earlier since it was added after that number's emit call` );
    };
  };
  emitter.addListener( number => {
    if ( number < finalNumber ) {
      emitter.addListener( neverCall( number ) );
      emitter.emit( number + 1 );
    }
  } );
  emitter.addListener( number => {
    console.log( number );
    assert.ok( number === countDown--, `should go in order of emitting: ${number}` );
  } );
  emitter.emit( 1 );
} );

QUnit.test( 'TinyEmitter reentrant emit and addListener (reentrantNotify:queue)', assert => {
  const emitter = new TinyEmitter<[ number ]>( null, null, 'queue' );
  assert.ok( 'hi' );

  // don't change this number without consulting startNumber below
  let count = 1;
  const beforeNestedEmitListenerCalls: number[] = [];
  const afterNestedEmitListenerCalls: number[] = [];
  emitter.addListener( number => {
    if ( number < 10 ) {

      // This listener should be called update the next emit, even though it is recursive
      emitter.addListener( nestedNumber => {
        assert.ok( nestedNumber !== number, 'nope' );
        if ( nestedNumber === number + 1 ) {
          beforeNestedEmitListenerCalls.push( nestedNumber );
        }
      } );
      emitter.emit( number + 1 );

      // This listener won't be called until n+2 since it was added after then n+1 emit
      emitter.addListener( nestedNumber => {
        assert.ok( nestedNumber !== number, 'nope' );
        assert.ok( nestedNumber !== number + 1, 'nope' );
        if ( nestedNumber === number + 2 ) {
          afterNestedEmitListenerCalls.push( nestedNumber );
        }
      } );
    }
  } );

  emitter.addListener( number => {
    assert.ok( number === count++, `should go in order of emitting: ${number}` );
  } );
  emitter.emit( count );

  [
    beforeNestedEmitListenerCalls,
    afterNestedEmitListenerCalls
  ].forEach( ( collection, index ) => {

    const startNumber = index + 2;
    collection.forEach( ( number, index ) => {
      assert.ok( number === startNumber + index, `called correctly when emitting ${number}` );
    } );
  } );
} );

QUnit.test( 'Test multiple reentrant emitters (notify:queue)', assert => {
  const lotsInMiddleEmitter = new TinyEmitter<[ number ]>( null, null, 'queue' );
  const firstLastEmitter = new TinyEmitter<[ number ]>( null, null, 'queue' );
  lotsInMiddleEmitter.addListener( number => {
    if ( number === 1 || number === 10 ) {
      firstLastEmitter.emit( number );
    }
    if ( number < 10 ) {
      lotsInMiddleEmitter.emit( number + 1 );
    }
  } );
  firstLastEmitter.addListener( number => {
    if ( number < 20 ) {
      firstLastEmitter.emit( number + 1 );
    }
  } );
  const actual: Array<readonly [ string, number ]> = [];
  lotsInMiddleEmitter.addListener( number => {
    actual.push( [ 'middle', number ] as const );
  } );
  firstLastEmitter.addListener( number => {
    actual.push( [ 'firstLast', number ] as const );
  } );
  lotsInMiddleEmitter.emit( 1 );

  const expected: Array<readonly [ string, number ]> = [
    ..._.range( 1, 21 ).map( number => [ 'firstLast', number ] as const ),
    ..._.range( 1, 10 ).map( number => [ 'middle', number ] as const ),
    ..._.range( 10, 21 ).map( number => [ 'firstLast', number ] as const ),
    [ 'middle', 10 ]
  ];
  assert.deepEqual( actual, expected, 'notifications should happen like a queueu' );
} );


QUnit.test( 'Test multiple reentrant emitters (notify:stack)', assert => {
  const firstEmitter = new TinyEmitter<[ number ]>( null, null, 'stack' );
  const secondEmitter = new TinyEmitter<[ number ]>( null, null, 'stack' );
  secondEmitter.addListener( number => {
    if ( number === 1 || number === 10 ) {
      firstEmitter.emit( number );
    }
    if ( number < 10 ) {
      secondEmitter.emit( number + 1 );
    }
  } );
  firstEmitter.addListener( number => {
    if ( number < 20 ) {
      firstEmitter.emit( number + 1 );
    }
  } );
  const actual: Array<readonly [ string, number ]> = [];
  secondEmitter.addListener( number => {
    actual.push( [ 'first', number ] as const );
  } );
  firstEmitter.addListener( number => {
    actual.push( [ 'last', number ] as const );
  } );
  secondEmitter.emit( 1 );

  const expected: Array<readonly [ string, number ]> = [
    ..._.range( 20, 0 ).map( number => [ 'last', number ] as const ),
    ..._.range( 20, 9 ).map( number => [ 'last', number ] as const ),
    ..._.range( 10, 0 ).map( number => [ 'first', number ] as const )
  ];
  assert.deepEqual( actual, expected, 'Notifications should happen like a stack' );
} );