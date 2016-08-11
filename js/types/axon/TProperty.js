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
  var StringUtils = require( 'PHETCOMMON/util/StringUtils' );
  var phetio = require( 'PHET_IO/phetio' );

  /**
   * An observable property that triggers notifications when the value changes.
   * @module TProperty
   */
  var TProperty = function( valueType, options ) {
    assert && assert( valueType.typeName, 'TProperty can only wrap types, but you passed a ' + typeof(valueType) );
    return phetioInherit( TObject, 'TProperty', function TPropertyImpl( property, phetioID ) {
      assert && assert( StringUtils.endsWith( phetioID, 'Property' ), 'TProperty instances should end with the "Property" suffix, for ' + phetioID );

      assertInstanceOf( property, phet.axon.Property );
      TObject.call( this, property, phetioID );


      toEventOnStatic( property.events, 'CallbacksForChanged', 'model', phetioID, TProperty( valueType ), 'changed',
        function( newValue, oldValue ) {
          return {
            oldValue: valueType.toStateObject( oldValue ),
            newValue: valueType.toStateObject( newValue ),

            // Pass through the value type units.  Undefined are filtered out
            units: valueType.units
          };
        } );
    }, {

      getValue: {
        returnType: valueType,
        parameterTypes: [],
        implementation: function() {
          return this.instance.get();
        },
        documentation: 'Gets the current value.'
      },

      setValue: {
        returnType: TVoid,
        parameterTypes: [ valueType ],
        implementation: function( value ) {
          this.instance.set( value );
        },
        documentation: 'Sets the value of the property, and triggers notifications if the value is different'
      },

      link: {
        returnType: TVoid,
        parameterTypes: [ TFunctionWrapper( TVoid, [ valueType ] ) ],
        implementation: function( listener ) {
          this.instance.link( listener );
        },
        documentation: 'Add a listener which will be called when the value changes.  The listener also gets an ' +
                       'immediate callback with the current value.'
      },

      unlink: {
        returnType: TVoid,
        parameterTypes: [ TFunctionWrapper( TVoid, [ valueType ] ) ],
        implementation: function( listener ) {
          this.instance.unlink( listener );
        },
        documentation: 'Removes a listener'
      }
    }, {
      documentation: 'Model values that can send out notifications when the value changes. This is different from the ' +
                     'traditional observer pattern in that listeners also receive a callback with the current value ' +
                     'when the listeners are registered.',
      valueType: valueType,
      events: [ 'changed' ],

      getAPI: function() {
        return {
          valueType: phetio.getAPIForType( valueType )
        };
      },

      fromStateObject: function( stateObject ) {
        return valueType.fromStateObject( stateObject );
      },

      toStateObject: function( instance ) {
        return valueType.toStateObject( instance.value );
      },

      options: options
    } );
  };

  phetioNamespace.register( 'TProperty', TProperty );

  return TProperty;
} );

