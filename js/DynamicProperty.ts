// Copyright 2017-2023, University of Colorado Boulder

/**
 * Creates a Property that does synchronization of values with a swappable Property that itself can change.
 * Handles the case where you need a Property that can switch between acting like multiple other Properties.
 *
 * With no other options specified, the value of this Property is:
 * - null, if valuePropertyProperty.value === null
 * - valuePropertyProperty.value.value otherwise
 *
 * The value of this Property (generalized, with the options available) is:
 * - derive( defaultValue ), if valuePropertyProperty.value === null
 * - map( derive( valuePropertyProperty.value ).value ) otherwise
 *
 * Generally, this DynamicProperty uses one-way synchronization (it only listens to the source), but if the
 * 'bidirectional' option is true, it will use two-way synchronization (changes to this Property will change the active
 * source). Thus when this Property changes value (when bidirectional is true), it will set:
 * - derive( valuePropertyProperty.value ).value = inverseMap( this.value ), if valuePropertyProperty.value !== null
 *
 *******************************
 * General example
 *******************************
 *   const firstProperty = new Property( Color.RED );
 *   const secondProperty = new Property( Color.BLUE );
 *   const currentProperty = new Property( firstProperty ); // {Property.<Property.<Color>>}
 *
 *   const backgroundFill = new DynamicProperty( currentProperty ) // Turns into a {Property.<Color>}
 *   backgroundFill.value; // Color.RED, since: currentProperty.value === firstProperty and
 *                                              firstProperty.value === Color.RED
 *   firstProperty.value = Color.YELLOW;
 *   backgroundFill.value; // Color.YELLOW - It's connected to firstProperty right now
 *
 *   currentProperty.value = secondProperty;
 *   backgroundFill.value; // Color.BLUE - It's the secondProperty's value
 *
 *   secondProperty.value = Color.MAGENTA;
 *   backgroundFill.value; // Color.MAGENTA - Yes, it's listening to the other Property now.
 *
 * Also supports falling back to null if our main Property is set to null:
 *   currentProperty.value = null;
 *   backgroundFill.value; // null
 *
 *******************************
 * 'derive' option
 *******************************
 * Additionally, DynamicProperty supports the ability to derive the Property value from our main Property's value.
 * For example, say you have multiple scenes each with the type:
 *   scene: {
 *     backgroundColorProperty: {Property.<Color>}
 *   }
 * and you have a currentSceneProperty: {Property.<Scene>}, you may want to create:
 *   const currentBackgroundColorProperty = new DynamicProperty( currentSceneProperty, {
 *     derive: 'backgroundColorProperty'
 *   } );
 * This would always report the current scene's current background color.
 * What if you sometimes don't have a scene active, e.g. {Property.<Scene|null>}? You can provide a default value:
 *  new DynamicProperty( currentSceneProperty, {
 *    derive: 'backgroundColorProperty',
 *    defaultValue: Color.BLACK
 *  } );
 * So that if the currentSceneProperty's value is null, the value of our DynamicProperty will be Color.BLACK.
 *
 *******************************
 * 'bidirectional' option
 *******************************
 * If you would like for direct changes to this Property to change the original source (bidirectional synchronization),
 * then pass bidirectional:true:
 *   const firstProperty = new Property( 5 );
 *   const secondProperty = new Property( 10 );
 *   const numberPropertyProperty = new Property( firstProperty );
 *   const dynamicProperty = new DynamicProperty( numberPropertyProperty, { bidirectional: true } );
 *   dynamicProperty.value = 2; // allowed now that it is bidirectional, otherwise prohibited
 *   firstProperty.value; // 2
 *   numberPropertyProperty.value = secondProperty; // change which Property is active
 *   dynamicProperty.value; // 10, from the new Property
 *   dynamicProperty.value = 0;
 *   secondProperty.value; // 0, set above.
 *   firstProperty.value; // still 2 from above, since our dynamic Property switched to the other Property
 *
 *******************************
 * 'map' and 'inverseMap' options
 *******************************
 * DynamicProperty also supports mapping values to different types. For example, say we have a
 * numberPropertyProperty {Property.<Property.<number>>}, but want to have a {Property.<string>} as the output. Then:
 *   new DynamicProperty( numberPropertyProperty, {
 *     map: function( number ) { return '' + number; }
 *   } );
 * will do the trick. If this needs to be done with a bidirectional DynamicProperty, also include inverseMap:
 *   new DynamicProperty( numberPropertyProperty, {
 *     bidirectional: true,
 *     map: function( number ) { return '' + number; },
 *     inverseMap: function( string ) { return Number.parseFloat( string ); }
 *   } );
 * so that changes to the dynamic Property will result in a change in the numberPropertyProperty's value.
 *
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import KeysMatching from '../../phet-core/js/types/KeysMatching.js';
import axon from './axon.js';
import TProperty from './TProperty.js';
import Property, { PropertyOptions } from './Property.js';
import ReadOnlyProperty from './ReadOnlyProperty.js';
import optionize from '../../phet-core/js/optionize.js';
import TReadOnlyProperty from './TReadOnlyProperty.js';
import LinkableProperty from './LinkableProperty.js';

export type TNullableProperty<T> = TReadOnlyProperty<T | null> | TReadOnlyProperty<T>;

type SelfOptions<ThisValueType, InnerValueType, OuterValueType> = {
  // If set to true then changes to this Property (if valuePropertyProperty.value is non-null at the time) will also be
  // made to derive( valuePropertyProperty.value ).
  bidirectional?: boolean;

  // If valuePropertyProperty.value === null, this dynamicProperty will act instead like
  // derive( valuePropertyProperty.value ) === new Property( defaultValue ). Note that if a custom map function is
  // provided, it will be applied to this defaultValue to determine our Property's value.
  defaultValue?: InnerValueType;

  // Maps a non-null valuePropertyProperty.value into the Property to be used. See top-level documentation for usage.
  // If it's a string, it will grab that named property out (e.g. it's like passing u => u[ derive ])
  // NOTE: This accepts TReadOnlyProperty, but if you have bidirectional:true it must be a full TProperty.
  // This is not currently type checked.
  derive?: ( ( outerValue: OuterValueType ) => TReadOnlyProperty<InnerValueType> ) | KeysMatching<OuterValueType, TReadOnlyProperty<InnerValueType>>;

  // Maps our input Property value to/from this Property's value. See top-level documentation for usage.
  // If it's a string, it will grab that named property out (e.g. it's like passing u => u[ derive ])
  map?: ( ( innerValue: InnerValueType ) => ThisValueType ) | KeysMatching<InnerValueType, ThisValueType>;
  inverseMap?: ( ( value: ThisValueType ) => InnerValueType ) | KeysMatching<ThisValueType, InnerValueType>;
};

export type DynamicPropertyOptions<ThisValueType, InnerValueType, OuterValueType> = SelfOptions<ThisValueType, InnerValueType, OuterValueType> & PropertyOptions<ThisValueType>;

// ThisValueType: The value type of the resulting DynamicProperty
// InnerValueType: The value type of the inner (derived) Property, whose value gets mapped to ThisValueType and back
// OuterValueType: The value type of the main passed-in Property (whose value may be derived to the InnerValueType)
// e.g.:
// class Foo { colorProperty: Property<Color> }
// new DynamicProperty<number, Color, Foo>( someFooProperty, {
//   derive: 'colorProperty',
//   map: ( color: Color ) => color.alpha
// } );
// Here, ThisValueType=number (we're a Property<number>). You've passed in a Property<Foo>, so OuterValueType is a Foo.
// InnerValueType is what we get from our derive (Color), and what the parameter of our map is.
export default class DynamicProperty<ThisValueType, InnerValueType, OuterValueType> extends ReadOnlyProperty<ThisValueType> implements LinkableProperty<ThisValueType> {

  // Set to true when this Property's value is changing from an external source.
  private isExternallyChanging: boolean;

  private defaultValue: InnerValueType;
  protected derive: ( u: OuterValueType ) => TReadOnlyProperty<InnerValueType>;
  protected map: ( v: InnerValueType ) => ThisValueType;
  protected inverseMap: ( t: ThisValueType ) => InnerValueType;
  protected bidirectional: boolean;
  private valuePropertyProperty: TNullableProperty<OuterValueType>;
  private propertyPropertyListener: ( value: InnerValueType, oldValue: InnerValueType | null, innerProperty: TReadOnlyProperty<InnerValueType> | null ) => void;
  private propertyListener: ( newPropertyValue: OuterValueType | null, oldPropertyValue: OuterValueType | null | undefined ) => void;

  /**
   * @param valuePropertyProperty - If the value is null, it is considered disconnected.
   * @param [providedOptions] - options
   */
  public constructor( valuePropertyProperty: TNullableProperty<OuterValueType> | TReadOnlyProperty<OuterValueType>, providedOptions?: DynamicPropertyOptions<ThisValueType, InnerValueType, OuterValueType> ) {

    const options = optionize<DynamicPropertyOptions<ThisValueType, InnerValueType, OuterValueType>, SelfOptions<ThisValueType, InnerValueType, OuterValueType>, PropertyOptions<ThisValueType>>()( {
      bidirectional: false,
      defaultValue: null as unknown as InnerValueType,
      derive: _.identity,
      map: _.identity,
      inverseMap: _.identity
    }, providedOptions );

    const optionsDerive = options.derive;
    const optionsMap = options.map;
    const optionsInverseMap = options.inverseMap;

    const derive: ( ( u: OuterValueType ) => TReadOnlyProperty<InnerValueType> ) = typeof optionsDerive === 'function' ? optionsDerive : ( ( u: OuterValueType ) => u[ optionsDerive ] as unknown as TProperty<InnerValueType> );
    const map: ( ( v: InnerValueType ) => ThisValueType ) = typeof optionsMap === 'function' ? optionsMap : ( ( v: InnerValueType ) => v[ optionsMap ] as unknown as ThisValueType );
    const inverseMap: ( ( t: ThisValueType ) => InnerValueType ) = typeof optionsInverseMap === 'function' ? optionsInverseMap : ( ( t: ThisValueType ) => t[ optionsInverseMap ] as unknown as InnerValueType );

    // Use the Property's initial value
    const initialValue = valuePropertyProperty.value === null ?
                         map( options.defaultValue ) :
                         map( derive( valuePropertyProperty.value ).value );

    super( initialValue, options );

    this.defaultValue = options.defaultValue;
    this.derive = derive;
    this.map = map;
    this.inverseMap = inverseMap;
    this.bidirectional = options.bidirectional;
    this.valuePropertyProperty = valuePropertyProperty;
    this.isExternallyChanging = false;

    this.propertyPropertyListener = this.onPropertyPropertyChange.bind( this );
    this.propertyListener = this.onPropertyChange.bind( this );

    // Rehook our listener to whatever is the active Property.
    valuePropertyProperty.link( this.propertyListener );

    // If we aren't bidirectional, we should never add this listener.
    if ( options.bidirectional ) {
      // No unlink needed, since our own disposal will remove this listener.
      this.lazyLink( this.onSelfChange.bind( this ) );
    }
  }

  /**
   * Listener added to the active inner Property.
   *
   * @param value - Should be either our defaultValue (if valuePropertyProperty.value is null), or
   *                derive( valuePropertyProperty.value ).value otherwise.
   * @param oldValue - Ignored for our purposes, but is the 2nd parameter for Property listeners.
   * @param innerProperty
   */
  private onPropertyPropertyChange( value: InnerValueType, oldValue: InnerValueType | null, innerProperty: TReadOnlyProperty<InnerValueType> | null ): void {

    // If the value of the inner Property is already the inverse of our value, we will never attempt to update our
    // own value in an attempt to limit "ping-ponging" cases mainly due to numerical error. Otherwise it would be
    // possible, given certain values and map/inverse, for both Properties to toggle back-and-forth.
    // See https://github.com/phetsims/axon/issues/197 for more details.
    if ( this.bidirectional && this.valuePropertyProperty.value !== null && innerProperty ) {
      const currentProperty = this.derive( this.valuePropertyProperty.value );
      // Notably, we only want to cancel interactions if the Property that sent the notification is still the Property
      // we are paying attention to.
      if ( currentProperty === innerProperty && innerProperty.areValuesEqual( this.inverseMap( this.value ), innerProperty.get() ) ) {
        return;
      }
    }

    // Since we override the setter here, we need to call the version on the prototype
    super.set( this.map( value ) );
  }

  /**
   * Listener added to the outer Property.
   *
   * @param newPropertyValue - If derive is not provided then it should be a {Property.<*>|null}
   * @param oldPropertyValue - If derive is not provided then it should be a {Property.<*>|null}.
   *                                              We additionally handle the initial link() case where this is
   *                                              undefined.
   */
  private onPropertyChange( newPropertyValue: OuterValueType | null, oldPropertyValue: OuterValueType | null | undefined ): void {
    if ( oldPropertyValue ) {
      this.derive( oldPropertyValue ).unlink( this.propertyPropertyListener );
    }
    if ( newPropertyValue ) {
      this.derive( newPropertyValue ).link( this.propertyPropertyListener );
    }
    else {
      // Switch to null when our Property's value is null.
      this.onPropertyPropertyChange( this.defaultValue, null, null );
    }
  }

  /**
   * Listener added to ourself when we are bidirectional
   */
  private onSelfChange( value: ThisValueType ): void {
    assert && assert( this.bidirectional );

    if ( this.valuePropertyProperty.value !== null ) {
      const innerProperty = this.derive( this.valuePropertyProperty.value );

      // If our new value is the result of map() from the inner Property's value, we don't want to propagate that
      // change back to the innerProperty in the case where the map/inverseMap are not exact matches (generally due
      // to floating-point issues).
      // See https://github.com/phetsims/axon/issues/197 for more details.
      if ( !this.areValuesEqual( value, this.map( innerProperty.value ) ) ) {
        // We'll fail at runtime if needed, this cast is needed since sometimes we can do non-bidirectional work on
        // things like a DerivedProperty
        ( innerProperty as TProperty<InnerValueType> ).value = this.inverseMap( value );
      }
    }
  }

  /**
   * Disposes this Property
   */
  public override dispose(): void {
    this.valuePropertyProperty.unlink( this.propertyListener );

    if ( this.valuePropertyProperty.value !== null ) {
      this.derive( this.valuePropertyProperty.value ).unlink( this.propertyPropertyListener );
    }

    super.dispose();
  }

  /**
   * Resets the current property (if it's a Property instead of a TinyProperty)
   */
  public reset(): void {
    assert && assert( this.bidirectional, 'Cannot reset a non-bidirectional DynamicProperty' );

    if ( this.valuePropertyProperty.value !== null ) {
      const property = this.derive( this.valuePropertyProperty.value );
      ( property as Property<InnerValueType> ).reset();
    }
  }

  /**
   * Prevent setting this Property manually if it is not marked as bidirectional.
   */
  public override set( value: ThisValueType ): void {
    assert && assert( this.bidirectional,
      `Cannot set values directly to a non-bidirectional DynamicProperty, tried to set: ${value}` );

    this.isExternallyChanging = true;
    super.set( value );

    this.isExternallyChanging = false;
  }

  /**
   * Overridden to make public
   */
  public override get value(): ThisValueType {
    return super.value;
  }

  /**
   * Overridden to make public
   * We ran performance tests on Chrome, and determined that calling super.value = newValue is statistically significantly
   * slower at the p = 0.10 level( looping over 10,000 value calls). Therefore, we prefer this optimization.
   */
  public override set value( value: ThisValueType ) {
    this.set( value );
  }

  /**
   * Returns true if this Property value can be set externally, by set() or .value =
   */
  public override isSettable(): boolean {
    return super.isSettable() || this.bidirectional;
  }
}

axon.register( 'DynamicProperty', DynamicProperty );
