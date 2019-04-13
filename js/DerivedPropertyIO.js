// Copyright 2016, University of Colorado Boulder

/**
 * IO type for DerivedProperty.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var phetioInherit = require( 'TANDEM/phetioInherit' );
  var PropertyIO = require( 'AXON/PropertyIO' );
  var VoidIO = require( 'TANDEM/types/VoidIO' );

  /**
   * Parametric IO type constructor.  Given an value type, this function returns an appropriate DerivedProperty IO type.
   *
   * @param {function} phetioValueType - phet-io type wrapper like StringIO, NumberIO, etc. If loaded by phet (not phet-io)
   *                                    it will be the function returned by the 'ifphetio!' plugin.
   */
  function DerivedPropertyIO( phetioValueType ) {

    // The parent type is also parameterized, so we have to instantiate it before we can extend it.
    var PropertyIOImpl = PropertyIO( phetioValueType );

    /**
     * This type constructor is parameterized based on the phetioValueType.
     *
     * @param {DerivedProperty} derivedProperty
     * @param {string} phetioID - the full unique tandem name for the instance
     * @constructor
     */
    var DerivedPropertyIOImpl = function DerivedPropertyIOImpl( derivedProperty, phetioID ) {
      assert && assert( !!phetioValueType, 'DerivedPropertyIO needs phetioValueType' );

      PropertyIOImpl.call( this, derivedProperty, phetioID );
    };
    phetioInherit( PropertyIOImpl, 'DerivedPropertyIO', DerivedPropertyIOImpl, {

      setValue: {
        returnType: VoidIO,
        parameterTypes: [ phetioValueType ],
        implementation: function( value ) {
          return this.instance.set( value );
        },
        documentation: 'Errors out when you try to set a derived property.',
        invocableForReadOnlyElements: false
      }
    }, {
      documentation: 'Like PropertyIO, but not settable.  Instead it is derived from other DerivedPropertyIO or PropertyIO ' +
                     'instances',

      // Used to generate the unique parametric typename for each PropertyIO
      parameterTypes: [ phetioValueType ],

      elementType: phetioValueType,
      validator: {
        isValidValue: v => {
          var DerivedProperty = window.phet ? phet.axon.DerivedProperty : axon.DerivedProperty;
          return v instanceof DerivedProperty;
        }
      }
    } );

    // @public - allow type checking for DerivedPropertyIOImpl
    DerivedPropertyIOImpl.outerType = DerivedPropertyIO;

    return DerivedPropertyIOImpl;
  }

  axon.register( 'DerivedPropertyIO', DerivedPropertyIO );

  return DerivedPropertyIO;
} );