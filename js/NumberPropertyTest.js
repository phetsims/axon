// Copyright 2017, University of Colorado Boulder

/**
 *
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var inherit = require( 'PHET_CORE/inherit' );
  var NumberProperty = require( 'AXON/NumberProperty' );

  var NumberPropertyTest = {
    runTests: function() {

      QUnit.module( 'NumberProperty' );

      QUnit.test( 'NumberProperty', function( assert ) {
        var p = new NumberProperty( 1 );
        p.value = 0;

        // default validation
        window.assert && assert.throws( function() {
          p = new NumberProperty( 'foo' );
        }, 'should throw Assertion failed: invalid initial value: foo' );
        p = new NumberProperty( 0 );
        window.assert && assert.throws( function() {
          p.value = 'bar';
        }, 'should throw Assertion failed: invalid initial value: bar' );

        // range
        p = new NumberProperty( 0, {
          range: { min: 0, max: 10 }
        } );
        p.value = 5;
        window.assert && assert.throws( function() {
          p.value = 11;
        }, 'should throw Assertion failed: invalid value: 11' );
        window.assert && assert.throws( function() {
          p.value = -1;
        }, 'should throw Assertion failed: invalid value: -1' );

        // valueType
        p = new NumberProperty( 0 );
        assert.equal( p.valueType, 'FloatingPoint', 'default valueType should be FloatingPoint' );

        p = new NumberProperty( 0, { valueType: 'Integer' } );
        assert.equal( p.valueType, 'Integer', 'valueType should be integer when set as such.' );

        window.assert && assert.throws( function() {
          p = new NumberProperty( 0, { valueType: 'GarbaldyGOOK' } );
        }, 'should throw Assertion failed: invalid type: GarbaldyGOOK' );

        p = new NumberProperty( 0, { valueType: 'Integer' } );

        window.assert && assert.throws( function() {
          p.value = 3.4;
        }, 'should throw Assertion failed: invalid value: 3.4' );

        p.value = 3;
        assert.equal( p.value, 3 );

        p = new NumberProperty( 0, { range: { min: 0, max: 5 }, valueType: 'Integer' } );
        window.assert && assert.throws( function() {
          p.value = 3.4;
        }, 'should throw Assertion failed: invalid value: 3.4' );

        p = new NumberProperty( 3.4, { range: { min: 0, max: 5 }, valueType: 'FloatingPoint' } );
        window.assert && assert.throws( function() {
          p = new NumberProperty( 3.4, { range: { min: 0, max: 5 }, valueType: 'Integer' } );
        }, 'should throw Assertion failed: initial value 3.4 must be of type: Integer' );

        p = new NumberProperty( 0, { range: { min: 0, max: 5 }, valueType: 'FloatingPoint' } );
        p.value = 3.4;
        assert.equal( p.value, 3.4 );

        p = new NumberProperty( 0, { validValues: [ 0, 1, 2, 3, 4, 5 ], valueType: 'Integer' } );
        window.assert && assert.throws( function() {
          p = new NumberProperty( 0, { validValues: [ 0, 1, 2, 3.4, 5 ], valueType: 'Integer' } );
        }, 'should throw Assertion failed: validValues must contain numbers of the right valueType' );

        p = new NumberProperty( 0, { range: { min: 0, max: 5 }, valueType: 'FloatingPoint' } );
        p.value = 3.4;
        assert.equal( p.value, 3.4 );

        // validValues
        p = new NumberProperty( 0, {
          validValues: [ 0, 1, 2 ]
        } );
        p.value = 1;
        p.value = 2;
        window.assert && assert.throws( function() {
          p.value = 3;
        }, 'should throw Assertion failed: invalid value: 3' );

        // isValidValue
        p = new NumberProperty( 0, {
          isValidValue: function( value ) { return value >= 0; }
        } );
        p.value = 1;
        p.value = 0;
        window.assert && assert.throws( function() {
          p.value = -1;
        }, 'should throw Assertion failed: invalid value: -1' );
        window.assert && assert.throws( function() {
          p.value = 'foo';
        }, 'should throw Assertion failed: invalid value: foo' );

        // mutually-exclusive options
        window.assert && assert.throws( function() {
          p = new NumberProperty( 0, {
            range: { min: 0, max: 10 },
            isValidValue: function( value ) { return value >= 0; },
            validValues: [ 0, 1, 2 ]
          }, 'should throw Assertion failed: validValues, isValidValue and range are mutually-exclusive options' );
        } );

        if ( !window.assert ) {
          assert.expect( 5 ); // TODO: this is a hack to suppress the "expected 0 tests but 5 were run" error.
        }
      } );
    }
  };

  axon.register( 'NumberPropertyTest', NumberPropertyTest );

  return inherit( Object, NumberPropertyTest );
} );