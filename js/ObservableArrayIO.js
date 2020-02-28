// Copyright 2017-2020, University of Colorado Boulder

/**
 * IO type for ObservableArray.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import FunctionIO from '../../tandem/js/types/FunctionIO.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import ObjectIO from '../../tandem/js/types/ObjectIO.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import axon from './axon.js';
import validate from './validate.js';

// constants
const OBSERVABLE_ARRAY_VALIDATOR = {
  isValidValue: v => {
    const ObservableArray = window.phet ? phet.axon.ObservableArray : axon.ObservableArray;
    return v instanceof ObservableArray;
  }
};

// {Object.<parameterTypeName:string, function(new:ObjectIO)>} - Cache each parameterized ObservableArrayIO so that it
// is only created once.
const cache = {};

/**
 * An observable array that triggers notifications when items are added or removed.
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 */
function ObservableArrayIO( parameterType ) {
  assert && assert( typeof parameterType === 'function', 'element type should be defined' );

  if ( !cache.hasOwnProperty( parameterType.typeName ) ) {
    cache[ parameterType.typeName ] = create( parameterType );
  }

  return cache[ parameterType.typeName ];
}

/**
 * Creates a ObservableArrayIOImpl
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 */
const create = parameterType => {

  /**
   * Parametric IO type constructor.  Given an element type, this function returns an ObservbleArray IO type.
   * This caching implementation should be kept in sync with the other parametric IO type caching implementations.
   * @param {function(new:ObjectIO)} parameterType
   * @returns {function(new:ObjectIO)}
   * @constructor
   */
  class ObservableArrayIOImpl extends ObjectIO {

    /**
     * @override
     * @param {ObservableArray} observableArray
     * @returns {{array: Array.<*>}}
     * @public
     */
    static toStateObject( observableArray ) {
      validate( observableArray, this.validator );
      return {
        array: observableArray.getArray().map( item => parameterType.toStateObject( item ) )
      };
    }

    /**
     * @public
     * @override
     * @param {{array: Array.<*>}} stateObject - where each array value is the parameter type state object of the element
     * @returns {Array{Object}}
     */
    static fromStateObject( stateObject ) {
      return stateObject.array.map( paramStateObject => parameterType.fromStateObject( paramStateObject ) );
    }

    /**
     * @public
     * @param observableArray
     * @param elementsFromStateObject
     */
    static setValue( observableArray, elementsFromStateObject ) {
      validate( observableArray, this.validator );
      observableArray.clear();
      observableArray.addAll( elementsFromStateObject );
    }
  }

  ObservableArrayIOImpl.methods = {

    /**
     * Adds a listener to the observable array.
     * @param listener
     * @public
     */
    addItemAddedListener: {
      returnType: VoidIO,
      parameterTypes: [ FunctionIO( VoidIO, [ parameterType ] ) ],
      implementation: function( listener ) {
        this.phetioObject.addItemAddedListener( listener );
      },
      documentation: 'Add a listener that is called when an item is added to the observable array.'
    },

    /**
     * Removes a listener that was added via addItemAddedListener.
     * @param listener
     * @public
     */
    addItemRemovedListener: {
      returnType: VoidIO,
      parameterTypes: [ FunctionIO( VoidIO, [ parameterType ] ) ],
      implementation: function( listener ) {
        this.phetioObject.addItemRemovedListener( listener );
      },
      documentation: 'Add a listener that is called when an item is removed from the observable array.'
    },

    /**
     * Get the number of electrons currently in the array.
     */
    getLength: {
      returnType: NumberIO,
      parameterTypes: [],
      implementation: function() {
        return this.phetioObject.length;
      },
      documentation: 'Get the number of elements in the observable array'
    }
  };

  ObservableArrayIOImpl.documentation = 'An array that sends notifications when its values have changed.';
  ObservableArrayIOImpl.validator = OBSERVABLE_ARRAY_VALIDATOR;
  ObservableArrayIOImpl.events = [ 'itemAdded', 'itemRemoved' ];
  ObservableArrayIOImpl.typeName = `ObservableArrayIO<${parameterType.typeName}>`;
  ObservableArrayIOImpl.parameterTypes = [ parameterType ];
  ObjectIO.validateSubtype( ObservableArrayIOImpl );

  return ObservableArrayIOImpl;
};

axon.register( 'ObservableArrayIO', ObservableArrayIO );
export default ObservableArrayIO;