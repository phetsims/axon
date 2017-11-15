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
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertInstanceOf' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var PropertyIO = require( 'AXON/PropertyIO' );
  var VoidIO = require( 'ifphetio!PHET_IO/types/VoidIO' );

  /**
   * Parametric wrapper type constructor.  Given an value type, this function returns an appropriate DerivedProperty wrapper type.
   *
   * @param {function} phetioValueType - phet-io type wrapper like StringIO, NumberIO, etc. If loaded by phet (not phet-io)
   *                                    it will be the function returned by the 'ifphetio!' plugin.
   * @constructor
   */
  function DerivedPropertyIO( phetioValueType ) {

    // The parent type is also parameterized, so we have to instantiate it before we can extend it.
    var TPropertyImpl = new PropertyIO( phetioValueType );

    /**
     * This type constructor is parameterized based on the phetioValueType.
     *
     * @param {DerivedProperty} property
     * @param {string} phetioID - the full unique tandem name for the instance
     * @constructor
     */
    var TDerivedPropertyImpl = function TDerivedPropertyImpl( property, phetioID ) {
      assert && assert( !!phetioValueType, 'DerivedPropertyIO needs phetioValueType' );
      assert && assertInstanceOf( property, phet.axon.DerivedProperty );

      TPropertyImpl.call( this, property, phetioID );
    };
    return phetioInherit( TPropertyImpl, 'DerivedPropertyIO', TDerivedPropertyImpl, {

      setValue: {
        returnType: VoidIO,
        parameterTypes: [ phetioValueType ],
        implementation: function( value ) {
          return this.instance.set( value );
        },
        documentation: 'Errors out when you try to set a derived property.'
      }
    }, {
      documentation: 'Like PropertyIO, but not settable.  Instead it is derived from other DerivedPropertyIO or PropertyIO ' +
                     'instances',

      // Used to generate the unique parametric typename for each PropertyIO
      parameterTypes: [ phetioValueType ],

      elementType: phetioValueType,

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

  axon.register( 'DerivedPropertyIO', DerivedPropertyIO );

  return DerivedPropertyIO;
} );

