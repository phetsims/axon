// Copyright 2018, University of Colorado Boulder

/**
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );

  /**
   * Performs valueType validation on a value. Fails an assertion if invalid.
   * @param {*} value
   * @param {function|string|null} valueType
   */
  function assertValueType( value, valueType ) {

    if ( !assert ) {
      throw new Error( 'call this function only when assertions are enabled' );
    }

    if ( typeof valueType === 'string' ) {

      // primitive type
      assert( typeof value === valueType, 'value should have typeof ' + valueType + ', value=' + value );
    }
    else if ( typeof valueType === 'function' ) {

      // support predicate functions, if passing in an anonymous function, then assume it is a predicate. Also support
      // a `isPredicate` property marker on functions.
      if ( valueType.isPredicate || !valueType.name ) {
        assert( valueType( value ), 'valueType predicate did not resolve truthy for value=' + value );
      }
      else {

        // constructor
        assert( value instanceof valueType, 'value should be instanceof ' + valueType.name + ', value=' + value );
      }
    }
    else {

      // we should never get here, but just in case...
      assert( valueType === null, 'invalid valueType: ' + valueType );
    }
  }

  axon.register( 'assertValueType', assertValueType );

  return assertValueType;
} );