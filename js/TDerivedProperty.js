// Copyright 2016, University of Colorado Boulder

/**
 * PhET-iO wrapper type for phet's DerivedProperty type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );

  // phet-io modules
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertions/assertInstanceOf' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var TVoid = require( 'ifphetio!PHET_IO/types/TVoid' );
  var TProperty = require( 'AXON/TProperty' );

  /**
   * Parametric wrapper type constructor.  Given an value type, this function returns an appropriate DerivedProperty wrapper type.
   *
   * @param {function} phetioValueType - phet-io type wrapper like TString, TNumber, etc. If loaded by phet (not phet-io)
   *                                    it will be the function returned by the 'ifphetio!' plugin.
   * @constructor
   */
  function TDerivedProperty( phetioValueType ) {

    // The parent type is also parameterized, so we have to instantiate it before we can extend it.
    var TPropertyImpl = new TProperty( phetioValueType );

    /**
     * This type constructor is parameterized based on the phetioValueType.
     *
     * @param {DerivedProperty} property
     * @param {string} phetioID - the full unique tandem name for the instance
     * @constructor
     */
    var TDerivedPropertyImpl = function TDerivedPropertyImpl( property, phetioID ) {
      assert && assert( !!phetioValueType, 'TDerivedProperty needs phetioValueType' );

      TPropertyImpl.call( this, property, phetioID );
      assertInstanceOf( property, phet.axon.DerivedProperty );
    };
    return phetioInherit( TPropertyImpl, 'TDerivedProperty', TDerivedPropertyImpl, {

      setValue: {
        returnType: TVoid,
        parameterTypes: [ phetioValueType ],
        implementation: function( value ) {
          return this.instance.set( value );
        },
        documentation: 'Errors out when you try to set a derived property.'
      }
    }, {
      documentation: 'Like TProperty, but not settable.  Instead it is derived from other TDerivedProperty or TProperty ' +
                     'instances',
      valueType: phetioValueType,

      /**
       * Decodes a state into a DerivedProperty.
       * @param {Object} stateObject
       * @returns {Object}
       */
      fromStateObject: function( stateObject ) {
        return phetioValueType.fromStateObject( stateObject );
      },


      /**
       * Encodes a DerivedProperty instance to a state.
       * @param {Object} instance
       * @returns {Object}
       */
      toStateObject: function( instance ) {
        return phetioValueType.toStateObject( instance.value );
      }
    } );
  }

  axon.register( 'TDerivedProperty', TDerivedProperty );

  return TDerivedProperty;
} );

