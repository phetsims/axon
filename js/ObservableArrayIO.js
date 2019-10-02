// Copyright 2017-2019, University of Colorado Boulder

/**
 * IO type for ObservableArray.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );
  const FunctionIO = require( 'TANDEM/types/FunctionIO' );
  const NumberIO = require( 'TANDEM/types/NumberIO' );
  const ObjectIO = require( 'TANDEM/types/ObjectIO' );
  const validate = require( 'AXON/validate' );
  const VoidIO = require( 'TANDEM/types/VoidIO' );

  // constants
  const OBSERVABLE_ARRAY_VALIDATOR = {
    isValidValue: v => {
      const ObservableArray = window.phet ? phet.axon.ObservableArray : axon.ObservableArray;
      return v instanceof ObservableArray;
    }
  };

  /**
   * Parametric IO type constructor.  Given an element type, this function returns an ObservbleArray IO type.
   * @param {function(new:ObjectIO)} parameterType - IO type of the DerivedProperty. If loaded by phet (not phet-io)
   *                                    it will be the function returned by the 'ifphetio!' plugin.
   * @param {Object} options
   * @returns {function(new:ObjectIO)}
   * @constructor
   */
  function ObservableArrayIO( parameterType, options ) {
    assert && assert( typeof parameterType === 'function', 'element type should be defined' );

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
    ObservableArrayIOImpl.parameterType = parameterType; // TODO: I hope we can get rid of this, https://github.com/phetsims/phet-io/issues/1371
    ObservableArrayIOImpl.parameterTypes = [ parameterType ];
    ObjectIO.validateSubtype( ObservableArrayIOImpl );

    return ObservableArrayIOImpl;
  }

  return axon.register( 'ObservableArrayIO', ObservableArrayIO );
} );

