// Copyright 2016, University of Colorado Boulder

/**
 * IO type for Property
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
  var FunctionIO = require( 'ifphetio!PHET_IO/types/FunctionIO' );
  var ObjectIO = require( 'ifphetio!PHET_IO/types/ObjectIO' );
  var phetio = require( 'ifphetio!PHET_IO/phetio' );
  var phetioInherit = require( 'ifphetio!PHET_IO/phetioInherit' );
  var VoidIO = require( 'ifphetio!PHET_IO/types/VoidIO' );

  /**
   * An observable property that triggers notifications when the value changes.
   * @param {function} phetioValueType - If loaded by phet (not phet-io) it will be the function returned by the
   *                                     'ifphetio!' plugin.
   * @param options
   * @module PropertyIO
   * @constructor
   */
  function PropertyIO( phetioValueType, options ) {

    /**
     * @param {Property} property
     * @param {string} phetioID
     * @constructor
     */
    var PropertyIOImpl = function PropertyIOImpl( property, phetioID ) {
      assert && assert( !!phetioValueType, 'PropertyIO needs phetioValueType' );
      assert && assert( property, 'Property should exist' );
      assert && assert( _.endsWith( phetioID, 'Property' ), 'PropertyIO instances should end with the "Property" suffix, for ' + phetioID );

      assert && assertInstanceOf( property, phet.axon.Property );
      ObjectIO.call( this, property, phetioID );
    };

    return phetioInherit( ObjectIO, 'PropertyIO', PropertyIOImpl, {
      getValue: {
        returnType: phetioValueType,
        parameterTypes: [],
        implementation: function() {
          return this.instance.get();
        },
        documentation: 'Gets the current value.'
      },

      setValue: {
        returnType: VoidIO,
        parameterTypes: [ phetioValueType ],
        implementation: function( value ) {
          this.instance.set( value );
        },
        documentation: 'Sets the value of the property, and triggers notifications if the value is different'
      },

      link: {
        returnType: VoidIO,
        parameterTypes: [ FunctionIO( VoidIO, [ phetioValueType, phetioValueType ] ) ],
        implementation: function( listener ) {
          this.instance.link( listener );
        },
        documentation: 'Adds a listener which will be called when the value changes. On registration, the listener is ' +
                       'also called with the current value.'
      },

      lazyLink: {
        returnType: VoidIO,
        parameterTypes: [ FunctionIO( VoidIO, [ phetioValueType, phetioValueType ] ) ],
        implementation: function( listener ) {
          this.instance.lazyLink( listener );
        },
        documentation: 'Add a listener which will be called when the value changes. This method is like "link", but ' +
                       'without the current-value callback on registration.'
      },

      unlink: {
        returnType: VoidIO,
        parameterTypes: [ FunctionIO( VoidIO, [ phetioValueType ] ) ],
        implementation: function( listener ) {
          this.instance.unlink( listener );
        },
        documentation: 'Removes a listener'
      }
    }, {
      documentation: 'Observable values that send out notifications when the value changes. This differs from the ' +
                     'traditional listener pattern in that added listeners also receive a callback with the current value ' +
                     'when the listeners are registered. This is a widely-used pattern in PhET-iO simulations.',
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
       * Encodes a Property instance to a state.
       * @param {Object} property
       * @returns {Object} - a state object
       */
      toStateObject: function( property ) {
        assert && assertInstanceOf( property, phet.axon.Property );
        assert && assert( phetioValueType.toStateObject, 'toStateObject doesnt exist for ' + phetioValueType.typeName );
        var stateObject = {
          value: phetioValueType.toStateObject( property.value )
        };

        // Only include validValues if specified, so they only show up in studio when supplied.
        if ( property.validValues ) {
          stateObject.validValues = property.validValues.map( function( v ) {
            return phetioValueType.toStateObject( v );
          } );
        }

        // Only supply units if they were specified, to avoid seeing "units: null" in so many properties, see https://github.com/phetsims/phet-io/issues/1315
        if ( property.units ) {
          stateObject.units = property.units;
        }
        return stateObject;
      },

      /**
       * Decodes a state into a Property.
       * @param {Object} stateObject
       * @returns {Object}
       */
      fromStateObject: function( stateObject ) {
        return {
          units: stateObject.units,
          value: phetioValueType.fromStateObject( stateObject.value ),
          validValues: stateObject.validValues && stateObject.validValues.map( function( v ) {
            return phetioValueType.fromStateObject( v );
          } )
        };
      },

      /**
       * Used to set the value when loading a state
       * @param {Property} property
       * @param {Object} fromStateObject
       */
      setValue: function( property, fromStateObject ) {
        assert && assertInstanceOf( property, phet.axon.Property );
        property.units = fromStateObject.units;
        property.set( fromStateObject.value );
        property.validValues = fromStateObject.validValues;
      },

      options: options
    } );
  }

  axon.register( 'PropertyIO', PropertyIO );

  return PropertyIO;
} );