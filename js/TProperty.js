// Copyright 2016, University of Colorado Boulder

/**
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
  var TFunctionWrapper = require( 'ifphetio!PHET_IO/types/TFunctionWrapper' );
  var TObject = require( 'ifphetio!PHET_IO/types/TObject' );
  var toEventOnEmit = require( 'ifphetio!PHET_IO/toEventOnEmit' );
  var TVoid = require( 'ifphetio!PHET_IO/types/TVoid' );
  var phetio = require( 'ifphetio!PHET_IO/phetio' );

  /**
   * An observable property that triggers notifications when the value changes.
   * @param {function} phetioValueType - If loaded by phet (not phet-io) it will be the function returned by the
   *                                     'ifphetio!' plugin.
   * @param options
   * @module TProperty
   * @constructor
   */
  function TProperty( phetioValueType, options ) {

    options = _.extend( {

      // Properties can opt-out of appearing in the phetio.getState() and phetio.setState() where the values are redundant or easily recomputed
      // in the playback simulation.
      phetioStateElement: true
    }, options );

    var TPropertyImpl = function TPropertyImpl( property, phetioID ) {
      assert && assert( !!phetioValueType, 'TProperty needs phetioValueType' );
      assert && assert( property, 'Property should exist' );
      assert && assert( _.endsWith( phetioID, 'Property' ), 'TProperty instances should end with the "Property" suffix, for ' + phetioID );

      assertInstanceOf( property, phet.axon.Property );
      TObject.call( this, property, phetioID );

      this.phetioStateElement = options.phetioStateElement;

      toEventOnEmit(
        property.startedCallbacksForChangedEmitter,
        property.endedCallbacksForChangedEmitter,
        'model',
        phetioID,
        this.constructor,
        'changed',
        function( newValue, oldValue ) {
          return {
            oldValue: phetioValueType.toStateObject( oldValue ),
            newValue: phetioValueType.toStateObject( newValue ),

            // Pass through the value type units.  Undefined are filtered out
            units: phetioValueType.units
          };
        } );
    };

    // Add the valueType to the typeName
    var typeName = 'TProperty.<' + phetioValueType.typeName + '>';
    return phetioInherit( TObject, typeName, TPropertyImpl, {

      getValue: {
        returnType: phetioValueType,
        parameterTypes: [],
        implementation: function() {
          return this.instance.get();
        },
        documentation: 'Gets the current value.'
      },

      setValue: {
        returnType: TVoid,
        parameterTypes: [ phetioValueType ],
        implementation: function( value ) {
          this.instance.set( value );
        },
        documentation: 'Sets the value of the property, and triggers notifications if the value is different'
      },

      link: {
        returnType: TVoid,
        parameterTypes: [ TFunctionWrapper( TVoid, [ phetioValueType, phetioValueType ] ) ],
        implementation: function( listener ) {
          this.instance.link( listener );
        },
        documentation: 'Add a listener which will be called when the value changes.  The listener also gets an ' +
                       'immediate callback with the current value.'
      },

      lazyLink: {
        returnType: TVoid,
        parameterTypes: [ TFunctionWrapper( TVoid, [ phetioValueType, phetioValueType ] ) ],
        implementation: function( listener ) {
          this.instance.lazyLink( listener );
        },
        documentation: 'Add a listener which will be called when the value changes, but not for the initial value.'
      },

      unlink: {
        returnType: TVoid,
        parameterTypes: [ TFunctionWrapper( TVoid, [ phetioValueType ] ) ],
        implementation: function( listener ) {
          this.instance.unlink( listener );
        },
        documentation: 'Removes a listener'
      }
    }, {

      phetioStateElement: options.phetioStateElement,

      documentation: 'Model values that can send out notifications when the value changes. This is different from the ' +
                     'traditional listener pattern in that listeners also receive a callback with the current value ' +
                     'when the listeners are registered.',
      valueType: phetioValueType,
      events: [ 'changed' ],

      getAPI: function() {
        return {
          valueType: phetio.getAPIForType( phetioValueType )
        };
      },

      /**
       * Decodes a state into a Property.
       * @param {Object} stateObject
       * @returns {Object}
       */
      fromStateObject: function( stateObject ) {
        return phetioValueType.fromStateObject( stateObject );
      },

      /**
       * Encodes a DerivedProperty instance to a state.
       * @param {Object} instance
       * @returns {Object} - a state object
       */
      toStateObject: function( instance ) {
        assert && assert( instance, 'instance should be defined' );
        assert && assert( phetioValueType.toStateObject, 'toStateObject doesnt exist for ' + phetioValueType.typeName );
        return phetioValueType.toStateObject( instance.value );
      },

      /**
       * Used to set the value when loading a state
       * @param instance
       * @param value
       */
      setValue: function( instance, value ) {
        instance.set( value );
      },

      options: options
    } );
  }

  axon.register( 'TProperty', TProperty );

  return TProperty;
} );

