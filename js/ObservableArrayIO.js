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

  // ifphetio
  const phetioEngine = require( 'ifphetio!PHET_IO/phetioEngine' );

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
    options = _.extend( {
      isReferenceType: true
    }, options );

    class ObservableArrayIOImpl extends ObjectIO {

      static toStateObject( observableArray ) {
        validate( observableArray, this.validator );
        if ( !observableArray ) {
          return observableArray;
        }
        return {
          array: observableArray.getArray().map( function( item ) {
            return options.isReferenceType ? item.phetioID : // TODO: assert that phetioID is defined, https://github.com/phetsims/axon/issues/245
                   parameterType.toStateObject( item );
          } )
        };
      }

      static fromStateObject( stateObject ) {
        const tempArray = [];
        stateObject.array.forEach( function( parameterTypePhetioID ) {
          tempArray.push( phetioEngine.getPhetioObject( parameterTypePhetioID ) );
        } );
        return tempArray;
      }

      static setValue( observableArray, fromStateObject ) {
        validate( observableArray, this.validator );
        observableArray.clear();
        observableArray.addAll( fromStateObject );
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
    ObservableArrayIOImpl.typeName = `ObservableArrayIO.<${parameterType.typeName}>`;
    ObservableArrayIOImpl.parameterType = parameterType;
    ObjectIO.validateSubtype( ObservableArrayIOImpl );

    return ObservableArrayIOImpl;
  }

  return axon.register( 'ObservableArrayIO', ObservableArrayIO );
} );

