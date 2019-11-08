// Copyright 2016-2019, University of Colorado Boulder

/**
 * Property whose value must be a number.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );
  const merge = require( 'PHET_CORE/merge' );
  const NumberPropertyIO = require( 'AXON/NumberPropertyIO' );
  const Property = require( 'AXON/Property' );
  const Range = require( 'DOT/Range' );
  const validate = require( 'AXON/validate' );

  // constants
  const VALID_NUMBER_TYPES = NumberPropertyIO.VALID_NUMBER_TYPES;
  const VALID_INTEGER = { valueType: 'number', isValidValue: v => v % 1 === 0 };

  class NumberProperty extends Property {

    /**
     * @param {number} value - initial value
     * @param {Object} [options]
     * @constructor
     */
    constructor( value, options ) {

      options = merge( {
        numberType: 'FloatingPoint', // {string} see VALID_NUMBER_TYPES

        // {Range|Property.<Range>|null} range
        range: null,

        // {number|null} step - used by PhET-iO Studio to control this Property
        step: null
      }, options );

      assert && assert( _.includes( VALID_NUMBER_TYPES, options.numberType ), 'invalid numberType: ' + options.numberType );
      assert && options.range && assert( options.range instanceof Range ||
                                         ( options.range instanceof Property && options.range.value instanceof Range ),
        'options.range must be of type Range or Property.<Range>:' + options.range );
      assert && options.step && assert( typeof options.step === 'number', 'options.step must be of type step:' + options.step );

      // client cannot specify superclass options that are controlled by NumberProperty
      assert && assert( !options.valueType, 'NumberProperty sets valueType' );
      assert && assert( !options.hasOwnProperty( 'phetioType' ), 'NumberProperty sets phetioType' );

      // Fill in superclass options that are controlled by NumberProperty.
      options = merge( {
        valueType: 'number',
        phetioType: NumberPropertyIO
      }, options );

      super( value, options );

      // @public (read-only) - used by PhET-iO in NumberPropertyIO as metadata passed to the wrapper.
      this.numberType = options.numberType;

      // @public {Range|Property.<Range>|null} (read-only) - if defined, provides the range of possible values (inclusive)
      this.range = options.range;

      // @public {number|null} (read-only - If defined, provides a step that the NumberProperty can be
      // incremented/decremented.
      this.step = options.step;

      // @private {function|null} value validation that is specific to NumberProperty, null if assertions are disabled
      this.assertNumberPropertyValidateValue = assert && ( value => {

        // validate for integer
        options.numberType === 'Integer' && validate( value, VALID_INTEGER );

        // validate for range
        if ( options.range ) {
          const currentRange = options.range instanceof Property ? options.range.value : options.range;
          assert && assert( currentRange instanceof Range, `unexpected Range: ${currentRange}` );
          validate( value, { isValidValue: v => currentRange.contains( v ) } );
        }
      } );

      // verify that validValues meet other NumberProperty-specific validation criteria
      if ( options.validValues && this.assertNumberPropertyValidateValue ) {
        options.validValues.forEach( this.assertNumberPropertyValidateValue );
      }

      // @private - {function|null} - only function if range is a Property. Keep track for disposal.
      this.rangeChangeListener = null;
      if ( options.range && options.range instanceof Property ) {
        this.rangeChangeListener = () => {
          this.assertNumberPropertyValidateValue( this.value );
        };
        options.range.link( this.rangeChangeListener );
      }

      // validate initial value
      this.assertNumberPropertyValidateValue && this.assertNumberPropertyValidateValue( value );
    }

    /**
     * @public
     */
    reset() {
      super.reset();

      // reset this after the value has been reset, because this reset may change the range such that the value isn't
      // valid anymore.
      this.range && this.range instanceof Property && this.range.reset();
    }

    /**
     * @public
     * @override
     */
    dispose() {
      this.rangeChangeListener && this.range.unlink( this.rangeChangeListener );
      super.dispose();
    }

    /**
     * Performs value validation that is specific to NumberProperty.
     * Then sets the value and notifies listeners.
     * @param {*} value
     * @public
     * @override
     */
    set( value ) {

      // TODO: should be handled in the super, see https://github.com/phetsims/axon/issues/253
      this.assertNumberPropertyValidateValue && this.assertNumberPropertyValidateValue( value );
      super.set( value );
    }
  }

  return axon.register( 'NumberProperty', NumberProperty );
} );