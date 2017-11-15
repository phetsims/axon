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
  var assertInstanceOf = require( 'ifphetio!PHET_IO/assertInstanceOf' );
  var phetio = require( 'ifphetio!PHET_IO/phetio' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var TFunctionWrapper = require( 'ifphetio!PHET_IO/types/TFunctionWrapper' );
  var TObject = require( 'ifphetio!PHET_IO/types/TObject' );
  var TVoid = require( 'ifphetio!PHET_IO/types/TVoid' );

  /**
   * An observable property that triggers notifications when the value changes.
   * @param {function} phetioValueType - If loaded by phet (not phet-io) it will be the function returned by the
   *                                     'ifphetio!' plugin.
   * @param options
   * @module PropertyIO
   * @constructor
   */
  function PropertyIO( phetioValueType, options ) {

    var PropertyIOImpl = function PropertyIOImpl( property, phetioID ) {
      assert && assert( !!phetioValueType, 'PropertyIO needs phetioValueType' );
      assert && assert( property, 'Property should exist' );
      assert && assert( _.endsWith( phetioID, 'Property' ), 'PropertyIO instances should end with the "Property" suffix, for ' + phetioID );

      assert && assertInstanceOf( property, phet.axon.Property );
      TObject.call( this, property, phetioID );
    };

    return phetioInherit( TObject, 'PropertyIO', PropertyIOImpl, {
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
      documentation: 'Model values that can send out notifications when the value changes. This is different from the ' +
                     'traditional listener pattern in that listeners also receive a callback with the current value ' +
                     'when the listeners are registered.',
      elementType: phetioValueType,

      // Used to generate the unique parametric typename for each PropertyIO
      parameterTypes: [ phetioValueType ],

      events: [ 'changed' ],

      getAPI: function() {
        return {
          elementType: phetio.getAPIForType( phetioValueType )
        };
      },

      /**
       * Decodes a state into a Property.
       * @param {Object} stateObject
       * @returns {Object}
       */
      fromStateObject: function( stateObject ) {
        return {
          value: phetioValueType.fromStateObject( stateObject.value ),
          validValues: stateObject.validValues && stateObject.validValues.map( function( v ) {
            return phetioValueType.fromStateObject( v );
          } )
        };
      },

      /**
       * Encodes a Property instance to a state.
       * @param {Object} instance
       * @returns {Object} - a state object
       */
      toStateObject: function( instance ) {
        assert && assert( instance, 'instance should be defined' );
        assert && assert( phetioValueType.toStateObject, 'toStateObject doesnt exist for ' + phetioValueType.typeName );
        var stateObject = {
          value: phetioValueType.toStateObject( instance.value )
        };

        // Only include validValues if specified, so they only show up in instance proxies when supplied.
        if ( instance.validValues ) {
          stateObject.validValues = instance.validValues.map( function( v ) {
            return phetioValueType.toStateObject( v );
          } );
        }
        return stateObject;
      },

      /**
       * Used to set the value when loading a state
       * @param instance
       * @param stateObject
       */
      setValue: function( instance, stateObject ) {
        instance.set( stateObject.value );
        instance.validValues = stateObject.validValues;
      },

      options: options
    } );
  }

  axon.register( 'PropertyIO', PropertyIO );

  return PropertyIO;
} );