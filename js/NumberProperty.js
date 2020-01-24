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
  const NullableIO = require( 'TANDEM/types/NullableIO' );
  const NumberPropertyIO = require( 'AXON/NumberPropertyIO' );
  const Property = require( 'AXON/Property' );
  const PropertyIO = require( 'AXON/PropertyIO' );
  const Range = require( 'DOT/Range' );
  const RangeIO = require( 'DOT/RangeIO' );
  const Tandem = require( 'TANDEM/Tandem' );
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
        step: null,

        // To be passed to the rangeProperty if NumberProperty creates it (as rangeProperty can also be passed via options.range)
        // By default, this is not PhET-iO instrumented, if desired, pass a tandem through these options with name "rangeProperty"
        rangePropertyOptions: {
          phetioDocumentation: 'provides the range of possible values for the parent NumberProperty',
          phetioType: PropertyIO( NullableIO( RangeIO ) ),
          phetioReadOnly: true
        },

        // {Tandem}
        tandem: Tandem.OPTIONAL
      }, options );

      assert && assert( _.includes( VALID_NUMBER_TYPES, options.numberType ), 'invalid numberType: ' + options.numberType );
      assert && options.range && assert( options.range instanceof Range ||
                                         ( options.range instanceof Property && options.range.value instanceof Range ),
        'options.range must be of type Range or Property.<Range>:' + options.range );
      assert && options.step && assert( typeof options.step === 'number', 'options.step must be of type step:' + options.step );

      assert && assert( options.rangePropertyOptions instanceof Object, 'rangePropertyOptions should be an Object' );
      assert && options.rangePropertyOptions.tandem && assert( options.rangePropertyOptions.tandem.name === 'rangeProperty',
        'if instrumenting default rangeProperty, the tandem name should be "rangeProperty".' );

      // client cannot specify superclass options that are controlled by NumberProperty
      assert && assert( !options.valueType, 'NumberProperty sets valueType' );
      options.valueType = 'number';
      assert && assert( !options.phetioType, 'NumberProperty sets phetioType' );
      options.phetioType = NumberPropertyIO;

      const rangePropertyProvided = options.range && options.range instanceof Property;
      const ownsRangeProperty = !rangePropertyProvided;

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

        // validate for range if range is non-null
        if ( this.rangeProperty.value && !this.isDeferred && !this.rangeProperty.isDeferred ) {
          validate( value, { isValidValue: v => this.rangeProperty.value.contains( v ) } );
        }
      } );

      // @public (read-only) {Property.<Range|null>}
      this.rangeProperty = null;

      if ( ownsRangeProperty ) {
        this.rangeProperty = new Property( options.range, options.rangePropertyOptions );
      }
      else {
        this.rangeProperty = options.range;
        assert && Tandem.errorOnFailedValidation() && assert(
          this.isPhetioInstrumented() === this.rangeProperty.isPhetioInstrumented(),
          'provided rangeProperty should be instrumented if this NumberProperty is.' );
      }

      const rangePropertyObserver = range => {
        assert && assert( range instanceof Range || range === null,
          `rangeProperty passed to NumberProperty should only take range instances, unexpected Range: ${range}` );
        this.assertNumberPropertyValidateValue && this.assertNumberPropertyValidateValue( this.value );
      };
      this.rangeProperty.link( rangePropertyObserver );

      // verify that validValues meet other NumberProperty-specific validation criteria
      if ( options.validValues && this.assertNumberPropertyValidateValue ) {
        options.validValues.forEach( validValue => this.assertNumberPropertyValidateValue( validValue ) );
      }

      // This puts validation at notification time instead of at value setting time. This is especially helpful as it
      // pertains to Property.prototype.setDeferred(), and setting a range and value together.
      this.assertNumberPropertyValidateValue && this.link( value => {
        this.assertNumberPropertyValidateValue( value );
      } );

      // @private
      this.disposeNumberProperty = () => {
        if ( ownsRangeProperty ) {
          this.rangeProperty.dispose();
        }
        else {
          this.rangeProperty.unlink( rangePropertyObserver );
        }
      };
    }

    /**
     * @public
     * @returns {Range|null}
     */
    get range() {
      return this.rangeProperty.value;
    }

    /**
     * Convenience function for setting the rangeProperty. Note: be careful using this function, as validation will occur
     * immediately, and if the value is outside of this new Range an error will occur. See this.setValueAndRange() for
     *  way to set both at once without assertion errors.
     *
     * @public
     * @param {Range} range
     */
    set range( range ) {
      this.rangeProperty.value = range;
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
     * An atomic setting function that will set a range and a value at the same time, to make sure that validation does
     * not fail after one but has been set not the other.
     *
     * To only be used when this.range is a Property (otherwise the range cannot change anyways)
     * @param {Number} value
     * @param {Range} range
     * @public
     */
    setValueAndRange( value, range ) {
      this.setDeferred( true );
      this.rangeProperty.setDeferred( true );
      this.set( value );
      this.rangeProperty.set( range );
      const notifyValueListeners = this.setDeferred( false );
      const notifyRangeListeners = this.rangeProperty.setDeferred( false );
      notifyValueListeners && notifyValueListeners();
      notifyRangeListeners && notifyRangeListeners();
    }
  }

  return axon.register( 'NumberProperty', NumberProperty );
} );