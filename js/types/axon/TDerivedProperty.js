// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare
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
  var TVoid = require( 'PHET_IO/types/TVoid' );

  var TDerivedProperty = function( valueType ) {
    assert && assert( !!valueType, 'TDerivedProperty needs valueType' );
    return phetioInherit( TObject, 'TDerivedProperty', function( property, phetioID ) {
      TObject.call( this, property, phetioID );
      assertInstanceOf( property, phet.axon.DerivedProperty );

      toEventOnStatic( property.events, 'CallbacksForChanged', 'model', phetioID, TDerivedProperty( valueType ), 'changed', function( oldValue, newValue ) {
        return {
          oldValue: valueType.toStateObject( oldValue ),
          newValue: valueType.toStateObject( newValue )
        };
      } );
    }, {

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

      fromStateObject: function( stateObject ) {
        return valueType.fromStateObject( stateObject );
      },

      toStateObject: function( instance ) {
        return valueType.toStateObject( instance.value );
      }
    } );
  };

  phetioNamespace.register( 'TDerivedProperty', TDerivedProperty );

  return TDerivedProperty;
} );

