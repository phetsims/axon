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
  var assertInstanceOf = require( 'PHET_IO/assertions/assertInstanceOf' );
  var phetioInherit = require( 'PHET_IO/phetioInherit' );
  var phetioNamespace = require( 'PHET_IO/phetioNamespace' );
  var TFunctionWrapper = require( 'PHET_IO/types/TFunctionWrapper' );
  var TObject = require( 'PHET_IO/types/TObject' );
  var toEventOnStatic = require( 'PHET_IO/events/toEventOnStatic' );

  /**
   * Parametric wrapper type constructor.  Given an value type, this function returns an appropriate DerivedProperty wrapper type.
   *
   * @param {TObject} valueType - wrapper type of the DerivedProperty
   * @constructor
   */
  var TVoid = require( 'PHET_IO/types/TVoid' );

  function TDerivedProperty( valueType ) {
    assert && assert( !!valueType, 'TDerivedProperty needs valueType' );

    /**
     * This type constructor is parameterized based on the valueType.
     *
     * @param property {DerivedProperty}
     * @param {string} phetioID - the full unique tandem name for the instance
     * @constructor
     */
    var TDerivedPropertyImpl = function TDerivedPropertyImpl( property, phetioID ) {
      TObject.call( this, property, phetioID );
      assertInstanceOf( property, phet.axon.DerivedProperty );

      toEventOnStatic( property.events, 'CallbacksForChanged', 'model', phetioID, TDerivedProperty( valueType ), 'changed', function( newValue, oldValue ) {
        return {
          oldValue: valueType.toStateObject( oldValue ),
          newValue: valueType.toStateObject( newValue )
        };
      } );
    };
    return phetioInherit( TObject, 'TDerivedProperty', TDerivedPropertyImpl, {

      getValue: {
        returnType: valueType,
        parameterTypes: [],
        implementation: function() {
          return this.instance.get();
        },
        documentation: 'Gets the current value'
      },

      unlink: {
        returnType: TVoid,
        parameterTypes: [ TFunctionWrapper( TVoid, [ valueType ] ) ],
        implementation: function( listener ) {
          this.instance.unlink( listener );
        },
        documentation: 'Removes a listener that was added with link'
      },

      link: {
        returnType: TVoid,
        parameterTypes: [ TFunctionWrapper( TVoid, [ valueType ] ) ],
        implementation: function( listener ) {
          this.instance.link( listener );
        },
        documentation: 'Adds a listener which will receive notifications when the value changes and an immediate callback' +
                       ' with the current value upon linking.'
      }
    }, {
      documentation: 'Like TProperty, but not settable.  Instead it is derived from other TDerivedProperty or TProperty ' +
                     'instances',
      valueType: valueType,
      events: [ 'changed' ],

      /**
       * Decodes a state into a DerivedProperty.
       * @param {Object} stateObject
       * @returns {Object}
       */
      fromStateObject: function( stateObject ) {
        return valueType.fromStateObject( stateObject );
      },


      /**
       * Encodes a DerivedProperty instance to a state.
       * @param {Object} instance
       * @returns {Object}
       */
      toStateObject: function( instance ) {
        return valueType.toStateObject( instance.value );
      }
    } );
  }

  phetioNamespace.register( 'TDerivedProperty', TDerivedProperty );

  return TDerivedProperty;
} );

