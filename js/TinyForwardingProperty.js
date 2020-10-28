// Copyright 2020, University of Colorado Boulder

/**
 * A lightweight version of Property (that satisfies some of the interface), meant for high-performance applications
 * where validation, phet-io support and other things are not needed. This includes additional logic for conditionally
 * forwarding to/from another Property.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import axon from './axon.js';
import Property from './Property.js';
import TinyProperty from './TinyProperty.js';

class TinyForwardingProperty extends TinyProperty {

  /**
   * @param {*} value - The initial value of the property
   * @param {boolean} [forwardingPropertyInstrumented=false]
   */
  constructor( value, forwardingPropertyInstrumented = false ) {
    super( value );

    // TODO: https://github.com/phetsims/scenery/issues/1097 rename forwardingProperty to targetProperty, note there are usages outside of this file
    /*******************************************************************************************/
    // @protected {Property.<*>|null|undefined} forwardingProperty - Set in setForwardingProperty
    /*******************************************************************************************/

    /*******************************************************************************************/
    // @protected {function|undefined} forwardingListener - Set lazily in setForwardingProperty
    /*******************************************************************************************/

    // @public {boolean|undefined} forwardingPropertyInstrumented -  when true, automatically set up a PhET-iO instrumented
    // forwarded Property for this TinyProperty, see this.initializePhetioObject() for usage.
    /*******************************************************************************************/

    // @private - when true, automatically set up a PhET-iO instrumented forwarded Property for pickableProperty, see this.initializePhetioObject for usage
    if ( forwardingPropertyInstrumented ) {
      this.forwardingPropertyInstrumented = forwardingPropertyInstrumented;
    }

    /*******************************************************************************************/
    // @public (NodeTests) {Property|undefined} ownedPhetioProperty - TinyProperty is not instrumented for PhET-iO, so when a Node is
    // instrumented, by default, an instrumented `Property` can be forwarded to. This field stores the default
    // instrumented Property when forwardingPropertyInstrumented is true.
    /*******************************************************************************************/

    if ( assert ) {

      // @private - guard against double initialization
      this.phetioInitialized = false;
    }
  }

  /**
   * Sets (or unsets if `null` is provided) the Property that we use for forwarding changes.
   * @public
   *
   * @param {Node} node - The container of TinyForwardingProperty which supports updateLinkedElementForProperty()
   * @param {string} tandemName
   * @param {TinyProperty.<*>|Property.<*>|null} newTarget - null to "unset" forwarding.
   * @returns {Node} - the passed in Node, for chaining.
   */
  setForwardingProperty( node, tandemName, newTarget ) {

    // no-op if we are already forwarding to that property OR if we still aren't forwarding
    if ( this.forwardingProperty === newTarget ) {
      return node; // for chaining
    }

    const currentForwardingPropertyInstrumented = this.forwardingProperty &&
                                                  this.forwardingProperty.isPhetioInstrumented();
    assert && currentForwardingPropertyInstrumented && assert( newTarget && newTarget.isPhetioInstrumented(),
      'Cannot set swap out a PhET-iO instrumented forwardingProperty for an uninstrumented one' );

    // We need this information eagerly for later on in the function
    const previousTarget = this.forwardingProperty;

    // If we had the "default instrumented" Property, we'll remove that and then link our new Property. Guard on the fact
    // that ownedPhetioProperty is added via this exact method, see this.initializePhetio() for details
    // Do this before adding a PhET-iO LinkedElement because ownedPhetioProperty has the same phetioID as the LinkedElement
    if ( this.ownedPhetioProperty && newTarget !== this.ownedPhetioProperty ) {
      this.ownedPhetioProperty.dispose();
      delete this.ownedPhetioProperty; // back to original value
    }

    node.updateLinkedElementForProperty( tandemName, previousTarget, newTarget );

    // Lazily set this value, it will be added as a listener to any forwardingProperty we have.
    this.forwardingListener = this.forwardingListener || ( ( value, oldValue ) => {
      this.notifyListeners( oldValue );
    } );

    const oldValue = this.get();

    if ( this.forwardingProperty ) {
      this.forwardingProperty.unlink( this.forwardingListener );
    }

    this.forwardingProperty = newTarget;

    if ( this.forwardingProperty ) {
      this.forwardingProperty.lazyLink( this.forwardingListener );
    }
    else {
      // If we're switching away from a forwardingProperty, prefer no notification (so set our value to the last value)
      this._value = oldValue;
    }

    const newValue = this.get();

    // Changing forwarding COULD change the value, so send notifications if this is the case.
    if ( !this.areValuesEqual( oldValue, newValue ) ) {
      this.notifyListeners( oldValue );
    }

    return node; // for chaining
  }

  /**
   * Gets the value.
   * @public
   * @override
   *
   * You can also use the es5 getter (property.value) but this means is provided for inner loops
   * or internal code that must be fast.
   * @returns {*}
   */
  get() {
    if ( this.forwardingProperty ) {
      return this.forwardingProperty.value;
    }
    else {
      return super.get();
    }
  }

  /**
   * Sets the value and notifies listeners, unless deferred or disposed. You can also use the es5 getter
   * (property.value) but this means is provided for inner loops or internal code that must be fast. If the value
   * hasn't changed, this is a no-op.
   * @public
   * @override
   *
   * @param {*} value
   * @returns {TinyForwardingProperty} this instance, for chaining.
   */
  set( value ) {
    if ( this.forwardingProperty ) {
      this.forwardingProperty.set( value );
    }
    else {
      super.set( value );
    }
    return this;
  }

  /**
   * Directly notifies listeners of changes. This needs to be an override to make sure that the value of the forwarding
   * Property is used if it exists.
   * @public
   * @override
   *
   * @param {*} oldValue
   */
  notifyListeners( oldValue ) {

    // NOTE: This is overridden to use this.get(), since we need to hook up forwarding.
    this.emit( this.get(), oldValue, this );
  }

  /**
   * Adds listener and calls it immediately. If listener is already registered, this is a no-op. The initial
   * notification provides the current value for newValue and null for oldValue.
   * @public
   * @override - So we can call the slightly more expensive getter, instead of the direct access
   *
   * @param {function} listener a function of the form listener(newValue,oldValue)
   */
  link( listener ) {
    this.addListener( listener );

    listener( this.get(), null, this ); // null should be used when an object is expected but unavailable
  }

  /**
   * Use this to automatically create a forwarded, PhET-iO instrumented Property owned by this TinyForwardingProperty.
   *
   * @public
   * @param {boolean} forwardingPropertyInstrumented
   * @param {Node} node
   * @returns {Node} - for chaining
   */
  setForwardingPropertyInstrumented( forwardingPropertyInstrumented, node ) {
    assert && assert( typeof forwardingPropertyInstrumented === 'boolean' );

    // See Node.initializePhetioObject for more details on this assertion
    assert && assert( !node.isPhetioInstrumented(), 'this option only works if it is passed in before this Node is instrumented' );

    this.forwardingPropertyInstrumented = forwardingPropertyInstrumented;

    return node;
  }

  /**
   * @param {Node} node - the parent container that supports updateLinkedElementForProperty()
   * @param {string} tandemName
   * @param {function():Property} createProperty - creates an "owned" Property
   * @public
   */
  initializePhetio( node, tandemName, createProperty ) {
    assert && assert( !this.phetioInitialized, 'already initialized' );
    assert && assert( !this.ownedPhetioProperty, 'Already created the ownedPhetioProperty' );

    if ( this.forwardingPropertyInstrumented ) {
      assert && assert( !this.forwardingProperty, 'I create the forwardingProperty when forwardingPropertyInstrumented:true' );

      this.ownedPhetioProperty = createProperty();
      assert && assert( this.ownedPhetioProperty instanceof Property, 'The owned property should be an AXON/Property' );
      assert && assert( this.ownedPhetioProperty.isPhetioInstrumented(), 'The owned property should be PhET-iO instrumented' );

      this.setForwardingProperty( node, tandemName, this.ownedPhetioProperty );
    }
    else if ( this.forwardingProperty && this.forwardingProperty.isPhetioInstrumented() ) {

      // If the Property was already set, now that it is instrumented, add a LinkedElement for it.
      node.updateLinkedElementForProperty( tandemName, null, this.forwardingProperty );
    }

    if ( assert ) {
      this.phetioInitialized = true;
    }
  }
}

axon.register( 'TinyForwardingProperty', TinyForwardingProperty );
export default TinyForwardingProperty;