// Copyright 2002-2015, University of Colorado Boulder

/**
 * PropertySet facilitates creation and use of multiple named Property instances.  There are still several API design issues in question, but this
 * class is ready for use.
 *
 * A PropertySet is a set of Property instances that provides support for:
 * -Easily creating several properties using an object literal (hash)
 * -Resetting them as a group
 * -Set multiple values at once, using propertySet.set({x:100,y:200,name:'alice'});
 * -Support for derived properties, which appear with the same interface as basic properties
 * -Convenient toString that prints e.g., PropertySet{name:'larry',age:101,kids:['alice','bob']}
 * -Wiring up to listen to multiple properties simultaneously
 * -Add properties after the PropertySet is created?  Don't forget to add to the key list as well.
 * -Remove properties that were added using addProperty or the constructor
 *
 * Sample usage:
 * var p = new PropertySet( {name: 'larry', age: 100, kids: ['alice', 'bob']} );
 * p.nameProperty.link( function( n ) {console.log( 'hello ' + n );} );
 * p.name = 'jensen';
 * p.age = 101;//Happy Birthday!
 * console.log( p );
 * p.reset();
 * console.log( p );
 * p.set({name:'clark',age:102,kids:['alice','bob','charlie']});
 *
 * How would this be done without PropertySet (for comparison)?
 * //Normally would be created in a class but that is omitted here for brevity.
 * var p ={name: new Property('larry'), age: new Property('age'), kids: new Property(['alice','bob'])}
 * p.reset = function(){
 *   this.name.reset();
 *   this.age.reset();
 *   this.kids.reset();
 * }
 * p.name.set('clark');
 * p.age.set('102');
 * p.kids.set(['alice','bob','charlie']);
 *
 * Note: If a subclass ever substitutes a property like this: person.ageProperty = new Property(person.age), then it would break the getter/setter
 * @author Sam Reid
 */

define( function( require ) {
  'use strict';

  // modules
  var Property = require( 'AXON/Property' );
  var DerivedProperty = require( 'AXON/DerivedProperty' );
  var Multilink = require( 'AXON/Multilink' );
  var Events = require( 'AXON/Events' );
  var axon = require( 'AXON/axon' );
  var inherit = require( 'PHET_CORE/inherit' );

  // constants
  var SUFFIX = 'Property';

  /**
   * PropertySet main constructor
   * @param {Object} values - a hash: keys are the names of properties, values are initial property values. Eg { name: 'Curly', age: 40 }
   * @param {Object} [options]
   * @constructor
   */
  axon.PropertySet = function PropertySet( values, options ) {

    options = _.extend( {
      tandemSet: {} // a hash, keys are a subset of the keys in values, and the value associated with each key is a {Tandem} tandem
    }, options );

    // Verify that the tandemSet doesn't contain bogus keys. filter should return 0 tandemSet keys that are not in values.
    assert && assert( _.filter( _.keys( options.tandemSet ), function( key ) {
      var isBad = !values.hasOwnProperty( key );
      if ( isBad ) { console.error( 'bad tandem key: ' + key ); }
      return isBad;
    } ).length === 0, 'Some tandem keys do not appear in the PropertySet' );

    var propertySet = this;

    Events.call( this );

    // @private Keep track of the keys so we know which to reset
    this.keys = [];

    Object.getOwnPropertyNames( values ).forEach( function( value ) {
      propertySet.addProperty( value, values[ value ], options.tandemSet[ value ] );
    } );
  };

  return inherit( Events, axon.PropertySet, {

    /**
     * Adds a new property to this PropertySet
     * @param {string} propertyName
     * @param {*} value the property's initial value
     * @param {Tandem} [tandem]
     * @public
     */
    addProperty: function( propertyName, value, tandem ) {
      this[ propertyName + SUFFIX ] = new Property( value, { tandem: tandem } );
      this.addGetterAndSetter( propertyName );
      this.keys.push( propertyName );
    },

    /**
     * Remove any property (whether a derived property or not) that was added to this PropertySet
     * @param {String} propertyName
     * @public
     */
    removeProperty: function( propertyName ) {

      //Remove from the keys (only for non-derived properties)
      var index = this.keys.indexOf( propertyName );
      if ( index !== -1 ) {
        this.keys.splice( index, 1 );
      }

      this[ propertyName + SUFFIX ].dispose();

      //Unregister the Property instance from the PropertySet
      delete this[ propertyName + SUFFIX ];

      //Unregister the getter/setter, if they exist
      delete this[ propertyName ];
    },

    /**
     * Adds a getter and setter using ES5 get/set syntax, similar to https://gist.github.com/dandean/1292057, same as in github/Atlas
     * @param {string} propertyName
     * @public
     */
    addGetterAndSetter: function( propertyName ) {
      var property = this[ propertyName + SUFFIX ];

      Object.defineProperty( this, propertyName, {

        // Getter proxies to Model#get()...
        get: function() { return property.get();},

        // Setter proxies to Model#set(attributes)
        set: function( value ) { property.set( value );},

        // Make it configurable and enumerable so it's easy to override...
        configurable: true,
        enumerable: true
      } );
    },

    /**
     * Adds an ES5 getter to a property.
     * @param {string} propertyName
     * @public
     */
    addGetter: function( propertyName ) {
      var property = this[ propertyName + SUFFIX ];

      Object.defineProperty( this, propertyName, {

        get: function() { return property.get();},

        // Make it configurable and enumerable so it's easy to override...
        configurable: true,
        enumerable: true
      } );
    },

    // @public Resets all of the properties associated with this PropertySet
    reset: function() {
      var propertySet = this;
      this.keys.forEach( function( key ) {
        propertySet[ key + SUFFIX ].reset();
      } );
    },

    /**
     * Creates a DerivedProperty from the given property property names and derivation.
     * @param {string[]} propertyNames
     * @param {function} derivation
     * @param {Tandem} [tandem]
     * @returns {DerivedProperty}
     * @public
     */
    toDerivedProperty: function( propertyNames, derivation, tandem ) {
      return new DerivedProperty( this.getProperties( propertyNames ), derivation, { tandem: tandem } );
    },

    /**
     * Adds a derived property to the property set.
     * @param {string} propertyName name for the derived property
     * @param {string[]} dependencyNames names of the properties that it depends on
     * @param {function} derivation function that expects args in the same order as dependencies
     * @param {Tandem} [tandem]
     * @public
     */
    addDerivedProperty: function( propertyName, dependencyNames, derivation, tandem ) {
      this[ propertyName + SUFFIX ] = this.toDerivedProperty( dependencyNames, derivation, tandem );
      this.addGetter( propertyName );
    },

    /**
     * Returns an array of the requested properties.
     * @param propertyNames
     * @returns {*}
     * @private
     */
    getProperties: function( propertyNames ) {
      var propertySet = this;
      return propertyNames.map( function( propertyName ) {
        var propertyKey = propertyName + SUFFIX;
        assert && assert( propertySet.hasOwnProperty( propertyKey ) );
        return propertySet[ propertyKey ];
      } );
    },

    /**
     * Set all of the values specified in the object hash
     * Allows you to use this form:
     * puller.set( {x: knot.x, y: knot.y, knot: knot} );
     *
     * instead of this:
     * puller.x.value = knot.x;
     * puller.y.value = knot.y;
     * puller.knot.value = knot;
     *
     * Throws an error if you try to set a value for which there is no property.
     * @public
     */
    setValues: function( values ) {
      var propertySet = this;
      Object.getOwnPropertyNames( values ).forEach( function( propertyName ) {
        if ( typeof(propertySet[ propertyName + SUFFIX ] === 'Property') ) {
          propertySet[ propertyName + SUFFIX ].set( values[ propertyName ] );
        }
        else {
          throw new Error( 'property not found: ' + propertyName );
        }
      } );
    },

    /**
     * Get a JS object literal with all the current values of the properties in this property set, say for serialization.
     * @see set
     * @public
     * TODO: this works well to serialize numbers, strings, booleans.  How to handle complex state values such as Vector2 or nested Property?  Maybe that must be up to the client code.
     * TODO: This was named 'get' to mirror the 'set' method above, but I'm concerned this will make them difficult to find/replace and may confuse with real getters & setters.  Maybe setState/getState would be better?
     */
    getValues: function() {
      var state = {};
      for ( var i = 0; i < this.keys.length; i++ ) {
        var key = this.keys[ i ];
        state[ key ] = this.property( key ).value;
      }
      return state;
    },

    /**
     * Link to a property by name, see https://github.com/phetsims/axon/issues/16
     * @param {string} propertyName the name of the property to link to
     * @param {function }observer the callback to link to the property
     * @public
     */
    link: function( propertyName, observer ) {
      this[ propertyName + SUFFIX ].link( observer );
    },

    /**
     * Unlink for a property by name, see https://github.com/phetsims/axon/issues/16
     * @param {string} propertyName the name of the property to link to
     * @param {function }observer the callback to link to the property
     * @public
     */
    unlink: function( propertyName, observer ) {
      this[ propertyName + SUFFIX ].unlink( observer );
    },

    /**
     * Link an attribute to a property by name.  Return a handle to the observer so it can be removed using unlink().
     * @param {string} propertyName the property to link to
     * @param {Object} object the object for which the attribute will be set
     * @param {string} attributeName the name of the attribute to set on the object
     * @public
     */
    linkAttribute: function( propertyName, object, attributeName ) {
      return this.property( propertyName ).linkAttribute( object, attributeName );
    },

    /**
     * Unlink an observer added with linkAttribute.  Note: the args of linkAttribute do not match the args of
     * unlinkAttribute: here, you must pass the observer handle returned by linkAttribute rather than object and attributeName
     * @param {string} propertyName - the name of the property that the observer will be removed from
     * @param {function} observer
     * @public
     */
    unlinkAttribute: function( propertyName, observer ) {
      this.property( propertyName ).unlink( observer );
    },

    /**
     * Registers an observer with multiple properties, then notifies the observer immediately.
     * @param {string[]} propertyNames
     * @param {function} observer no params, returns nothing
     * @public
     */
    multilink: function( propertyNames, observer ) {
      return new Multilink( this.getProperties( propertyNames ), observer, false );
    },

    // @public
    lazyMultilink: function( propertyNames, observer ) {
      return new Multilink( this.getProperties( propertyNames ), observer, true );
    },

    /**
     * Removes the multilink from this PropertySet.
     * Same as calling dispose() on the multilink
     * @param {Multilink} multilink
     * @public
     */
    unmultilink: function( multilink ) {
      multilink.dispose();
    },

    // @public
    toString: function() {
      var text = 'PropertySet{';
      var propertySet = this;
      for ( var i = 0; i < this.keys.length; i++ ) {
        var key = this.keys[ i ];
        text = text + key + ':' + propertySet[ key ].toString();
        if ( i < this.keys.length - 1 ) {
          text = text + ',';
        }
      }
      return text + '}';
    },

    /**
     * Get a property by name, see https://github.com/phetsims/axon/issues/16
     * @param {string} propertyName the name of the property to get
     * @deprecated see https://github.com/phetsims/axon/issues/43
     * @public
     */
    property: function( propertyName ) {
      return this[ propertyName + SUFFIX ];
    },

    /**
     * When the PropertySet is no longer used by the sim, it can be eliminated.  All Properties are disposed.
     * @public
     */
    dispose: function() {
      for ( var i = 0; i < this.keys.length; i++ ) {
        this[ this.keys[ i ] + SUFFIX ].dispose();
      }
    }
  } );
} );