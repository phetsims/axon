// Copyright 2017-2020, University of Colorado Boulder

/**
 * IO type for Property
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

// {Map.<cacheKey:function(new:ObjectIO), function(new:ObjectIO)>} - Cache each parameterized PropertyIO so that it is only created once
const cache = new Map();

/**
 * An observable Property that triggers notifications when the value changes.
 * This caching implementation should be kept in sync with the other parametric IO type caching implementations.
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 */
function PropertyIO( parameterType ) {
  assert && assert( parameterType, 'PropertyIO needs parameterType' );

  const cacheKey = parameterType;

  if ( !cache.has( cacheKey ) ) {
    cache.set( cacheKey, create( parameterType ) );
  }

  return cache.get( cacheKey );
}

/**
 * Creates a PropertyIOImpl
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 */
const create = parameterType => {

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
      assert && assert( _.endsWith( phetioID, 'Property' ), 'PropertyIO instances should end with the "Property" suffix, for ' + phetioID );

      super( property, phetioID );
    }

    /**
     * Encodes a Property phetioObject to a state.
     * @param {Object} property
     * @returns {Object} - a state object
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
     * Decodes a state into a Property.
     * @param {Object} stateObject
     * @returns {Object}
     */
    static fromStateObject( stateObject ) {
      return {
        units: stateObject.units,
        value: parameterType.fromStateObject( stateObject.value ),
        validValues: stateObject.validValues && stateObject.validValues.map( function( v ) {
          return parameterType.fromStateObject( v );
        } )
      };
    }

    /**
     * Used to set the value when loading a state
     * @param {Property} property
     * @param {Object} fromStateObject
     * @public
     */
    static setValue( property, fromStateObject ) {
      validate( property, this.validator );
      property.units = fromStateObject.units;
      property.set( fromStateObject.value );
      property.validValues = fromStateObject.validValues;
    }
  }

  PropertyIOImpl.methods = {
    getValue: {
      returnType: parameterType,
      parameterTypes: [],
      implementation: function() {
        return this.phetioObject.get();
      },
      documentation: 'Gets the current value.'
    },

    setValue: {
      returnType: VoidIO,
      parameterTypes: [ parameterType ],
      implementation: function( value ) {
        this.phetioObject.set( value );
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
        this.phetioObject.link( listener );
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
        this.phetioObject.lazyLink( listener );
      },
      documentation: 'Adds a listener which will be called when the value changes. This method is like "link", but ' +
                     'without the current-value callback on registration. The listener takes two arguments, the new ' +
                     'value and the previous value.'
    }
    // TODO: get this working again, see https://github.com/phetsims/axon/issues/262
    // ,
    //
    // unlink: {
    //   returnType: VoidIO,
    //   parameterTypes: [ FunctionIO( VoidIO, [ parameterType ] ) ],
    //   implementation: function( listener ) {
    //     this.phetioObject.unlink( listener );
    //   },
    //   documentation: 'Removes a listener.'
    // }
  };

  PropertyIOImpl.documentation = 'Observable values that send out notifications when the value changes. This differs from the ' +
                                 'traditional listener pattern in that added listeners also receive a callback with the current value ' +
                                 'when the listeners are registered. This is a widely-used pattern in PhET-iO simulations.';
  PropertyIOImpl.methodOrder = [ 'link', 'lazyLink' ];
  PropertyIOImpl.validator = { valueType: Property };
  PropertyIOImpl.events = [ 'changed' ];
  PropertyIOImpl.typeName = `PropertyIO<${parameterType.typeName}>`;
  PropertyIOImpl.parameterTypes = [ parameterType ];
  ObjectIO.validateSubtype( PropertyIOImpl );

  return PropertyIOImpl;
};

axon.register( 'PropertyIO', PropertyIO );
export default PropertyIO;