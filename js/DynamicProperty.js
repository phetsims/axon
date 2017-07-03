// Copyright 2017, University of Colorado Boulder

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
 *   var firstProperty = new Property( Color.RED );
 *   var secondProperty = new Property( Color.BLUE );
 *   var currentProperty = new Property( firstProperty ); // {Property.<Property.<Color>>}
 *
 *   var backgroundFill = new DynamicProperty( currentProperty ) // Turns into a {Property.<Color>}
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
 *   var currentBackgroundColorProperty = new DynamicProperty( currentSceneProperty, {
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
 *   var firstProperty = new Property( 5 );
 *   var secondProperty = new Property( 10 );
 *   var numberPropertyProperty = new Property( firstProperty );
 *   var dynamicProperty = new DynamicProperty( numberPropertyProperty, { bidirectional: true } );
 *   dynamicProperty.value = 2; // allowed now that it is bidrectional, otherwise prohibited
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
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Property = require( 'AXON/Property' );

  /**
   * @constructor
   * @extends {Property}
   *
   * @param {Property.<*|null>} valuePropertyProperty - If the value is null, it is considered disconnected. If the
   *                                                    'derive' option is not used, then this should always have the
   *                                                    type {Property.<Property.<*>|null>}
   * @param {Object} [options] - options
   */
  function DynamicProperty( valuePropertyProperty, options ) {

    options = _.extend( {
      // {boolean} - If set to true then changes to this Property (if valuePropertyProperty.value is non-null at the
      //             time) will also be made to derive( valuePropertyProperty.value ).
      bidirectional: false,

      // {*} - If valuePropertyProperty.value === null, this dynamicProperty will act instead like
      //       derive( valuePropertyProperty.value ) === new Property( defaultValue ). Note that if a custom map
      //       function is provided, it will be applied to this defaultValue to determine our Property's value.
      defaultValue: null,

      // {function|string} - Maps a non-null valuePropertyProperty.value into the Property to be used. See top-level
      //                     documentation for usage. Uses the Lodash path specification (if it's a string).
      derive: _.identity,

      // {function|string} - Maps our input Property value to/from this Property's value. See top-level documentation
      //                     for usage. Uses the Lodash path specification (if it's a string).
      map: _.identity,
      inverseMap: _.identity
    }, options );

    // @public {boolean} - Set to true when this Property's value is changing from an external source.
    this.isExternallyChanging = false;

    // @private {Property.<*|null>}
    this.valuePropertyProperty = valuePropertyProperty;

    // @private {boolean}
    this.bidirectional = options.bidirectional;

    // @private {*}
    this.defaultValue = options.defaultValue;

    // @private {function}
    this.derive = typeof options.derive === 'string' ? _.property( options.derive ) : options.derive;
    this.map = typeof options.map === 'string' ? _.property( options.map ) : options.map;
    this.inverseMap = typeof options.inverseMap === 'string' ? _.property( options.inverseMap ) : options.inverseMap;

    // Use the Property's initial value
    var initialValue;
    if ( this.valuePropertyProperty.value === null ) {
      initialValue = this.map( this.defaultValue );
    }
    else {
      initialValue = this.map( this.derive( this.valuePropertyProperty.value ).value );
    }

    // Super call
    Property.call( this, initialValue, options );

    // @private {function}
    this.propertyPropertyListener = this.onPropertyPropertyChange.bind( this );

    // @private {function}
    this.propertyListener = this.onPropertyChange.bind( this );

    // Rehook our listener to whatever is the active Property.
    valuePropertyProperty.link( this.propertyListener );

    // If we aren't bidirectional, we should never add this listener.
    if ( options.bidirectional ) {
      this.lazyLink( this.onSelfChange.bind( this ) );
    }
  }

  axon.register( 'DynamicProperty', DynamicProperty );

  return inherit( Property, DynamicProperty, {
    /**
     * Listener added to the active inner Property.
     * @private
     *
     * @param {*} value - Should be either our defaultValue (if valuePropertyProperty.value is null), or
     *                    derive( valuePropertyProperty.value ).value otherwise.
     */
    onPropertyPropertyChange: function( value ) {
      // Since we override the setter here, we need to call the version on the prototype
      Property.prototype.set.call( this, this.map( value ) );
    },

    /**
     * Listener added to the outer Property.
     * @private
     *
     * @param {*|null} newPropertyValue - If derive is not provided then it should be a {Property.<*>|null}
     * @param {*|null|undefined} oldPropertyValue - If derive is not provided then it should be a {Property.<*>|null}.
     *                                              We additionally handle the initial link() case where this is
     *                                              undefined.
     */
    onPropertyChange: function( newPropertyValue, oldPropertyValue ) {
      if ( oldPropertyValue ) {
        this.derive( oldPropertyValue ).unlink( this.propertyPropertyListener );
      }
      if ( newPropertyValue ) {
        this.derive( newPropertyValue ).link( this.propertyPropertyListener );
      }
      else {
        // Switch to null when our Property's value is null.
        this.onPropertyPropertyChange( this.defaultValue );
      }
    },

    /**
     * Listener added to ourself when we are bidirectional
     * @private
     *
     * @param {*} value
     */
    onSelfChange: function( value ) {
      if ( this.valuePropertyProperty.value !== null ) {
        this.derive( this.valuePropertyProperty.value ).value = this.inverseMap( value );
      }
    },

    /**
     * Disposes this Property
     * @public
     */
    dispose: function() {
      this.valuePropertyProperty.unlink( this.propertyListener );

      if ( this.valuePropertyProperty.value !== null ) {
        this.derive( this.valuePropertyProperty.value ).unlink( this.propertyPropertyListener );
      }

      Property.prototype.dispose.call( this );
    },

    /**
     * Prevent setting this Property manually
     * @public
     * @override
     *
     * TODO: DerivedProperty should only need to do this, not all of the other methods it's also doing
     *
     * @param {*} value
     */
    set: function( value ) {
      assert && assert( this.bidirectional, 'Cannot set values directly to a DynamicProperty, tried to set: ' + value );

      this.isExternallyChanging = true;

      Property.prototype.set.call( this, value );

      this.isExternallyChanging = false;
    }
  } );
} );
