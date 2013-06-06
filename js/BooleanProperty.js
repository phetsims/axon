// Copyright 2002-2013, University of Colorado

/**
 * Subclass of Property that adds methods specific to boolean values
 *
 * @author Sam Reid
 */
define(
  ['PHETCOMMON/model/property/Property', 'PHETCOMMON/util/Inheritance'],
  function( Property, Inheritance ) {
    "use strict";

    function BooleanProperty( value ) {
      Property.call( this, value );
    }

    Inheritance.inheritPrototype( BooleanProperty, Property );

    BooleanProperty.prototype.toggle = function() {
      this.set( !this.get() );
    };

    return BooleanProperty;
  } );