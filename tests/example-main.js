define( [
  'AXON/axon',
  'AXON/BooleanProperty',
  'AXON/Property',
  'AXON/DerivedProperty',
  'AXON/PropertySet',
  'Person'
], function( axon, BooleanProperty, Property, DerivedProperty, PropertySet, Person ) {
  'use strict';

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

//////New example
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

  console.log( 'also, did I mention the BMI is', person.bmiProperty.value );
} );