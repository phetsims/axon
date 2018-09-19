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
} );