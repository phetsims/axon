# axon

Axon provides powerful and concise models based on observable Properties and related patterns.  Developed by PhET Interactive Simulations at the University of Colorado Boulder.

## History
This code was developed in https://github.com/phetsims/phetcommon and moved to Axon in June 2013 

## API and Sample Usage
The foundational classes in Axon are Property and DerivedProperty.  PropertySet provides a way of creating and maintaining aggregates of properties.
 
### Property
When creating a model with a single observable value, a Property class can be used like so
```javascript
//Create the property
var paused = new Property( false );

//Synchronize a callback for when the Property is changed
var listener = function( paused ) {console.log( 'paused: ', paused );};
paused.link( listener ); //linking automatically calls back the listener, so this prints "paused: false"

//Use es5 get/set to read and modify the value
paused.value = !paused.value; //Prints "paused: true"

//Reset the property to the original value
paused.reset();  //Prints "paused: false"; 

//Remove a listener
paused.unlink( listener );

paused.value = true; //Nothing printed to console because listener was removed
```

### PropertySet
A PropertySet makes it easy to create, maintain, set and reset many Property instances at the same time.  Typically this will be used in model classes that extend PropertySet like so:
```javascript
define( function( require ) {
  "use strict";

  //Import dependencies for PropertySet and inheritance
  var PropertySet = require( 'AXON/PropertySet' );
  var inherit = require( 'PHET_CORE/inherit' );

  //Constructor, with initial values for the Person
  function Person( name, id, age, weight, height ) {

    //Set a constant, or untracked value for the class, which does not send notifications when changed
    this.id = id;

    //Call the super class by specifying the values that should be converted to properties
    PropertySet.call( this, {name: name, age: age, weight: weight, height: height, paused: false} );

    //Add a derived (computed) property that is computed as a function of other properties
    this.addDerivedProperty( 'bmi', ['weight', 'height'], function( weight, height ) {return weight / height / height;} );
  }

  inherit( PropertySet, Person, {
    incrementYear: function() {
      this.age = this.age + 1;
    }
  } );

  return Person;
} );
```

Sample usage given the Person definition above
```javascript
//Create a Person instance
var person = new Person( 'larry', 123, 50, 180, 6.2 );

//Access constants or untracked fields as per usual
console.log( person.id );

//Access property values with es5 getters
console.log( person.weight );

//When linking to a PropertySet-based model, append 'Property' to the var name
person.ageProperty.link( function( age ) {console.log( 'the age is ', age );} ); //prints 'the age is 50'

//Also works for derived properties
person.bmiProperty.link( function( bmi ) {console.log( 'the bmi is ', bmi );} ); //prints 'the bmi is 4.68'

//Set values with es5 setters
person.height = 6.3; //prints 'the bmi is 4.53'

//Call methods on the model
person.incrementYear();//prints 'the age is 51'
```

Third-Party Dependencies
=============

This repository uses third-party libraries.
Those libraries and their licenses are available in: https://github.com/phetsims/sherpa.