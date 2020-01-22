// Copyright 2016-2020, University of Colorado Boulder

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

      // @public {number|null} (read-only - If defined, provides a step that the NumberProperty can be
      // incremented/decremented.
      this.step = options.step;

      // @private {function|null} value validation that is specific to NumberProperty, null if assertions are disabled
      this.assertNumberPropertyValidateValue = assert && ( value => {

        // validate for integer
        options.numberType === 'Integer' && validate( value, VALID_INTEGER );

        // validate for range
        if ( this.range ) {
          const currentRange = this.range;
          validate( value, { isValidValue: v => currentRange.contains( v ) } );
        }
      } );

      // @public {Range|null} (read-only except NumberPropertyIO) - if defined, provides the range of possible values
      // (inclusive)
      this.range = null;

      // @public (read-only) {Property.<Range>|null} - non null only if provided via options.range
      this.rangeProperty = null;

      let rangePropertyObserver = null;

      if ( options.range instanceof Property ) {
        this.rangeProperty = options.range;
        rangePropertyObserver = range => {
          assert && assert( range instanceof Range, `rangeProperty passed to NumberProperty should only take range instances, unexpected Range: ${range}` );
          this.range = range;
          this.assertNumberPropertyValidateValue && this.assertNumberPropertyValidateValue( this.value );
        };
        this.rangeProperty.link( rangePropertyObserver );
      }
      else {
        this.range = options.range;
      }

      // verify that validValues meet other NumberProperty-specific validation criteria
      if ( options.validValues && this.assertNumberPropertyValidateValue ) {
        options.validValues.forEach( this.assertNumberPropertyValidateValue );
      }

      // validate initial value
      this.assertNumberPropertyValidateValue && this.assertNumberPropertyValidateValue( value );

      // @private
      this.disposeNumberProperty = () => {
        rangePropertyObserver && this.rangeProperty.unlink( rangePropertyObserver );
      };
    }

    /**
     * @public
     */
    reset() {
      super.reset();

      // reset this after the value has been reset, because this reset may change the range such that the value isn't
      // valid anymore.
      this.rangeProperty && this.rangeProperty.reset();
    }

    /**
     * @public
     * @override
     */
    dispose() {
      this.disposeNumberProperty();
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

    /**
     * An atomic setting function that will set a range and a value at the same time, to make sure that validation does
     * not fail after one but has been set not the other.
     *
     * To only be used when this.range is a Property (otherwise the range cannot change anyways)
     * @param {Number} value
     * @param {Range} range
     * @public
     */
    setValueAndRange( value, range ) {

      // use mutation on the Property
      this.rangeProperty.value.setMinMax( range.min, range.max );
      super.setPropertyValue( value );

      // defer validation and notification
      this.assertNumberPropertyValidateValue && this.assertNumberPropertyValidateValue( value );
      this.validate && this.validate( this.value );
      this.rangeProperty.notifyListenersStatic();
      this.notifyListenersStatic();
    }
  }

  return axon.register( 'NumberProperty', NumberProperty );
} );