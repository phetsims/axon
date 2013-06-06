// Copyright 2002-2013, University of Colorado
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
 * -TODO: Make it easy to mix-in with model classes?  Subclassing PropertySet already works fairly well, so this may good enough already.
 * -TODO: Type checking, so that a boolean input will be automatically generated as BooleanProperty, etc.
 * -TODO: Should this be called Model or perhaps something even better?
 * -TODO: addProperty(DerivedProperty/Property)???  Perhaps overload it?  Let's wait on that until we need it.
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
 * p.values = {name:'clark',age:102,kids:['alice','bob','charlie']}; //TODO: should we support this es5 way of doing it?  I kind of like it better than set
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
 * @author Sam Reid
 */

define( function( require ) {
  "use strict";

  var Property = require( 'PHETCOMMON/model/property/Property' );
  var DerivedProperty = require( 'PHETCOMMON/model/property/DerivedProperty' );

  /**
   * @class PropertySet
   * @constructor
   * @param values an object hash with the initial values for the properties
   */
  function PropertySet( values ) {
    var propertySet = this;

    //Keep track of the keys so we know which to reset
    this.keys = [];

    Object.getOwnPropertyNames( values ).forEach( function( value ) {
      propertySet.addProperty( value, values[value] );
    } );
  }

  PropertySet.prototype = {

    /**
     * Adds a new property to this PropertySet
     *
     * @param {String} name
     * @param value
     */
    addProperty: function( name, value ) {
      this[name + 'Property'] = new Property( value );
      this.addGetterAndSetter( name );
      this.keys.push( name );
    },

    /**
     * Remove any property (whether a derived property or not) that was added to this PropertySet
     * @param name
     */
    removeProperty: function( name ) {

      //Remove from the keys (only for non-derived properties)
      var index = this.keys.indexOf( name );
      if ( index !== -1 ) {
        this.keys.splice( index, index + 1 );
      }

      //Unregister the Property instance from the PropertySet
      delete this[name + 'Property'];

      //Unregister the getter/setter, if they exist
      delete this[name];
    },

    //Taken from https://gist.github.com/dandean/1292057, same as in github/Atlas
    addGetterAndSetter: function( name ) {
      var propertyName = name + 'Property';

      //TODO: Store the this[propertyName] in a closure for performance?  Memory/performance tradeoff, and problems if the property instance ever changes (unlikely)
      //TODO: If a subclass ever substitutes a property like this: person.ageProperty = new Property(person.age), then it would break the getter/setter
      Object.defineProperty( this, name, {

        // Getter proxies to Model#get()...
        get: function() { return this[propertyName].get();},

        // Setter proxies to Model#set(attributes)
        set: function( value ) { this[propertyName].set( value );},

        // Make it configurable and enumerable so it's easy to override...
        configurable: true,
        enumerable: true
      } );
    },

    addGetter: function( name ) {

      //TODO: Store the this[propertyName] for performance?
      var propertyName = name + 'Property';
      Object.defineProperty( this, name, {

        get: function() { return this[propertyName].get();},

        // Make it configurable and enumerable so it's easy to override...
        configurable: true,
        enumerable: true
      } );
    },

    //Resets all of the properties associated with this PropertySet 
    reset: function() {
      var propertySet = this;
      this.keys.forEach( function( key ) {
        propertySet[key + 'Property'].reset();
      } );
    },

    /**
     * Creates a DerivedProperty from the given dependency names and derivation.
     * @param dependencyNames {Array<String>}
     * @param derivation {Function}
     * @returns {DerivedProperty}
     */
    toDerivedProperty: function( dependencyNames, derivation ) {
      var propertySet = this;
      var dependencies = dependencyNames.map( function( dependency ) {
        return propertySet[dependency + 'Property'];
      } );
      return new DerivedProperty( dependencies, derivation );
    },

    addDerivedProperty: function( name, dependencyNames, derivation ) {
      this[name + 'Property'] = this.toDerivedProperty( dependencyNames, derivation );
      this.addGetter( name );
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
     */
    set: function( values ) {
      var propertySet = this;
      Object.getOwnPropertyNames( values ).forEach( function( val ) {
        if ( typeof(propertySet[val + 'Property'] === 'Property') ) {
          propertySet[val + 'Property'].set( values[val] );
        }
        else {
          throw new Error( 'property not found: ' + val );
        }
      } );
    },

    /**
     * Add a listener to zero or more properties in this PropertySet, useful when you have an update function
     * that relies on several properties.  Similar to DerivedProperty.
     * TODO: Should this be named link because it won't clash with any other methods on this class?
     *  Discussion result: Let's use 'multilink' for now, and in the future we may change it to link.
     * @param dependencyNames {Array<String>} the list of dependencies to use
     * @param listener {Function} the listener to call back, with signature matching the dependency names
     */
    multilink: function( dependencyNames, listener ) {
      return this.toDerivedProperty( dependencyNames, listener );
    },

    /**
     * Removes the multilinked listener from this PropertySet.
     * Same as calling detach() on the handle (which happens to be a DerivedProperty instance)
     * @param derivedProperty
     */
    unmultilink: function( derivedProperty ) {
      derivedProperty.detach();
    },

    toString: function() {
      var text = 'PropertySet{';
      var propertySet = this;
      for ( var i = 0; i < this.keys.length; i++ ) {
        var key = this.keys[i];
        text = text + key + ':' + propertySet[key].toString();
        if ( i < this.keys.length - 1 ) {
          text = text + ',';
        }
      }
      return text + '}';
    }
  };

  return PropertySet;
} );