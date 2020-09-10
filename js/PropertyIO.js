// Copyright 2017-2020, University of Colorado Boulder

/**
 * IO Type for Property
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import FunctionIO from '../../tandem/js/types/FunctionIO.js';
import NullableIO from '../../tandem/js/types/NullableIO.js';
import ObjectIO from '../../tandem/js/types/ObjectIO.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import axon from './axon.js';
import Property from './Property.js';
import validate from './validate.js';

// {Map.<cacheKey:function(new:ObjectIO), function(new:ObjectIO)>} - Cache each parameterized PropertyIO based on
// the parameter type, so that it is only created once
const cache = new Map();

/**
 * An observable Property that triggers notifications when the value changes.
 * This caching implementation should be kept in sync with the other parametric IO Type caching implementations.
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 */
function PropertyIO( parameterType ) {
  assert && assert( parameterType, 'PropertyIO needs parameterType' );

  if ( !cache.has( parameterType ) ) {
    cache.set( parameterType, create( parameterType ) );
  }

  return cache.get( parameterType );
}

/**
 * Creates a PropertyIOImpl
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 */
const create = parameterType => {
  assert && assert( parameterType.fromStateObject, 'only data type serialization supported for parameterType.' );

  /**
   * @param {Property} property
   * @param {string} phetioID
   * @constructor
   */
  class PropertyIOImpl extends ObjectIO {

    /**
     * @param {Property} property
     * @param {string} phetioID
     */
    constructor( property, phetioID ) {
      assert && assert( !!parameterType, 'PropertyIO needs parameterType' );
      assert && assert( property, 'Property should exist' );

      super( property, phetioID );
    }

    /**
     * Encodes a Property phetioObject to a state.
     * @param {Object} property
     * @returns {Object} - a state object
     * @public
     * @override
     */
    static toStateObject( property ) {
      validate( property, this.validator );
      assert && assert( parameterType.toStateObject, 'toStateObject doesnt exist for ' + parameterType.typeName );
      const stateObject = {
        value: parameterType.toStateObject( property.value )
      };

      // Only include validValues if specified, so they only show up in PhET-iO Studio when supplied.
      if ( property.validValues ) {
        stateObject.validValues = property.validValues.map( function( v ) {
          return parameterType.toStateObject( v );
        } );
      }

      // Only supply units if they were specified, to avoid seeing "units: null" in so many properties, see https://github.com/phetsims/phet-io/issues/1315
      if ( property.units ) {
        stateObject.units = property.units;
      }
      return stateObject;
    }

    /**
     * Used to set the value when loading a state
     * @param {Property} property
     * @param {Object} stateObject
     * @override
     * @public
     */
    static applyState( property, stateObject ) {
      validate( property, this.validator );
      property.units = stateObject.units;
      property.set( parameterType.fromStateObject( stateObject.value ) );

      if ( stateObject.validValues ) {
        property.validValues = stateObject.validValues.map( valueStateObject => parameterType.fromStateObject( valueStateObject ) );
      }
    }
  }

  PropertyIOImpl.methods = {
    getValue: {
      returnType: parameterType,
      parameterTypes: [],
      implementation: function() {
        return this.get();
      },
      documentation: 'Gets the current value.'
    },

    setValue: {
      returnType: VoidIO,
      parameterTypes: [ parameterType ],
      implementation: function( value ) {
        this.set( value );
      },
      documentation: 'Sets the value of the Property. If the value differs from the previous value, listeners are ' +
                     'notified with the new value.',
      invocableForReadOnlyElements: false
    },

    link: {
      returnType: VoidIO,

      // oldValue will start as "null" the first time called
      parameterTypes: [ FunctionIO( VoidIO, [ parameterType, NullableIO( parameterType ) ] ) ],
      implementation: function( listener ) {
        this.link( listener );
      },
      documentation: 'Adds a listener which will be called when the value changes. On registration, the listener is ' +
                     'also called with the current value. The listener takes two arguments, the new value and the ' +
                     'previous value.'
    },

    lazyLink: {
      returnType: VoidIO,

      // oldValue will start as "null" the first time called
      parameterTypes: [ FunctionIO( VoidIO, [ parameterType, NullableIO( parameterType ) ] ) ],
      implementation: function( listener ) {
        this.lazyLink( listener );
      },
      documentation: 'Adds a listener which will be called when the value changes. This method is like "link", but ' +
                     'without the current-value callback on registration. The listener takes two arguments, the new ' +
                     'value and the previous value.'
    },
    unlink: {
      returnType: VoidIO,
      parameterTypes: [ FunctionIO( VoidIO, [ parameterType ] ) ],
      implementation: function( listener ) {
        this.unlink( listener );
      },
      documentation: 'Removes a listener.'
    }
  };

  PropertyIOImpl.documentation = 'Observable values that send out notifications when the value changes. This differs from the ' +
                                 'traditional listener pattern in that added listeners also receive a callback with the current value ' +
                                 'when the listeners are registered. This is a widely-used pattern in PhET-iO simulations.';
  PropertyIOImpl.methodOrder = [ 'link', 'lazyLink' ];
  PropertyIOImpl.validator = { valueType: Property };
  PropertyIOImpl.events = [ 'changed' ];
  PropertyIOImpl.typeName = `PropertyIO<${parameterType.typeName}>`;
  PropertyIOImpl.parameterTypes = [ parameterType ];
  ObjectIO.validateIOType( PropertyIOImpl );

  return PropertyIOImpl;
};

axon.register( 'PropertyIO', PropertyIO );
export default PropertyIO;