// Copyright 2018, University of Colorado Boulder

/**
 * "definition" type for a "Type" that a value can be validated against.
 * TypeDef accepts multiple ways to test
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

define( require => {
  'use strict';

  const ObjectIO = require( 'TANDEM/types/ObjectIO' );
  const axon = require( 'AXON/axon' );

  const TypeDef = {
    /**
     * Returns whether the parameter is considered to be a TypeDef.
     * @public
     *
     * @param {*} type
     * @returns {boolean}
     */
    isTypeDef( type ) {
      if ( typeof type === 'function' ) {
        if ( type.isPredicate ) { // TODO: are these the best criteria? Function.name ISN'T SUPPORTED ON IE11
          return typeof type() === 'boolean'; // should return a boolean is a predicate function
        }

        // Here we are assuming that whatever the type is will be tested with `instanceof`,
        // though there is no way to check if a function is constructable since not all phet constructors use
        // `class`, see https://stackoverflow.com/a/40922715
        return true;
      }
      if ( ( type === ObjectIO || type.prototype instanceof ObjectIO ) && // is a TypeIO
           typeof type.isInstance === 'function' && // the TypeIO has a isInstance predicate
           typeof type.isInstance() === 'boolean' ) {
        return true;
      }
      return typeof type === 'string'; // like 'number' or 'string'
    },

    /**
     * Test if a value is valid
     * @param {*} value
     * @param {TypeDef} valueType
     * @returns {boolean} - if the value is a valid one given the valueType
     */
    validValue( value, valueType ) {
      if ( typeof valueType === 'string' ) {

        // primitive type
        return typeof value === valueType;
      }

      // If valueType is a TypeIO, then it should have its own validating predicate.
      // Test to see if valueType is a TypeIO, see https://stackoverflow.com/questions/18939192/how-to-test-if-b-is-a-subclass-of-a-in-javascript-node
      else if ( valueType === ObjectIO || valueType.prototype instanceof ObjectIO ) {
        assert && assert( valueType.isInstance, 'unsupported phet-io value type validation.' );
        return valueType.isInstance( value );
      }
      else if ( typeof valueType === 'function' ) {

        // support predicate functions, if passing in an anonymous function, then assume it is a predicate. Also support
        // a `isPredicate` property marker on functions.
        if ( valueType.isPredicate || !valueType.name ) {
          return valueType( value );
        }

        // constructor like `Node` or `Path`
        else {
          return value instanceof valueType;
        }
      }

      // value was not of correct type, or valueType was of an unexpected kind. TODO: error out instead?
      return false;
    },

    /**
     * Given a list of valid values, return a predicate that, when given anything, tests if it an item in the list.
     * An example of a potential "Validator" function in https://github.com/phetsims/axon/issues/189#issuecomment-433183909
     * similar in function to Property.validValues (perhaps that is deprecated).
     *
     * @param {Array} list
     * @returns {function: boolean}
     */
    predicateFromArray( list ) {
      assert && assert( Array.isArray( list ) );
      const predicate = ( value ) => { return _.includes( list, value );};
      predicate.isPredicate = true; // add on this marking so that it is known how to test it.
      return predicate;
    },

    /**
     * Return a predicate that accepts null or the typeof the typeString provided
     * @param typeString
     * @returns {function(*): boolean}
     */
    getNullOrTypeofPredicate( typeString ) {
      assert && assert( typeof typeString === 'string' );
      const predicate = v => v === null || typeof v === typeString;
      predicate.isPredicate = true;
      return predicate;
    },

    /**
     * Return a predicate that accepts null or the typeof the typeString provided
     * @param typeString
     * @returns {function(*): boolean}
     */
    getNullOrInstanceOfPredicate( type ) {
      assert && assert( typeof type === 'function' );
      const predicate = v => v === null || v instanceof type;
      predicate.isPredicate = true;
      return predicate;
    }

  };

  axon.register( 'TypeDef', TypeDef );

  return TypeDef;
} );
