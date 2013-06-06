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