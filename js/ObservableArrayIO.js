// Copyright 2017-2020, University of Colorado Boulder

/**
 * IO Type for ObservableArray.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */

import FunctionIO from '../../tandem/js/types/FunctionIO.js';
import IOType from '../../tandem/js/types/IOType.js';
import NumberIO from '../../tandem/js/types/NumberIO.js';
import VoidIO from '../../tandem/js/types/VoidIO.js';
import axon from './axon.js';

// {Object.<parameterTypeName:string, function(new:ObjectIO)>} - Cache each parameterized ObservableArrayIO so that it
// is only created once.
const cache = {};

/**
 * An observable array that triggers notifications when items are added or removed.
 * @param {function(new:ObjectIO)} parameterType
 * @returns {function(new:ObjectIO)}
 */
function ObservableArrayIO( parameterType ) {
  assert && assert( parameterType instanceof IOType, 'element type should be defined' );

  if ( !cache.hasOwnProperty( parameterType.typeName ) ) {
    cache[ parameterType.typeName ] = new IOType( `ObservableArrayIO<${parameterType.typeName}>`, {
      documentation: 'An array that sends notifications when its values have changed.',
      isValidValue: v => {
        const ObservableArray = window.phet ? phet.axon.ObservableArray : axon.ObservableArray;
        return v instanceof ObservableArray;
      },
      events: [ 'itemAdded', 'itemRemoved' ],
      parameterTypes: [ parameterType ],
      toStateObject: observableArray => ( { array: observableArray.getArray().map( item => parameterType.toStateObject( item ) ) } ),
      applyState: ( observableArray, stateObject ) => {
        observableArray.clear();
        const elements = stateObject.array.map( paramStateObject => parameterType.fromStateObject( paramStateObject ) );
        observableArray.addAll( elements );
      },
      methods: {

        /**
         * Adds a listener to the observable array.
         * @param listener
         * @public
         */
        addItemAddedListener: {
          returnType: VoidIO,
          parameterTypes: [ FunctionIO( VoidIO, [ parameterType ] ) ],
          implementation: function( listener ) {
            this.addItemAddedListener( listener );
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
            this.addItemRemovedListener( listener );
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
            return this.length;
          },
          documentation: 'Get the number of elements in the observable array'
        }
      }
    } );
  }

  return cache[ parameterType.typeName ];
}

axon.register( 'ObservableArrayIO', ObservableArrayIO );
export default ObservableArrayIO;