// Copyright 2020-2021, University of Colorado Boulder

/**
 * A lightweight version of Property (that satisfies some of the interface), meant for high-performance applications
 * where validation, phet-io support and other things are not needed. This includes additional logic for conditionally
 * forwarding to/from another Property.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import axon from './axon.js';
import Property from './Property.js';
import TinyProperty from './TinyProperty.js';

class TinyForwardingProperty extends TinyProperty {

  /**
   * @param {*} value - The initial value of the property
   * @param {boolean} targetPropertyInstrumented
   * @param {function()} [onBeforeNotify]
   */
  constructor( value, targetPropertyInstrumented, onBeforeNotify ) {
    super( value, onBeforeNotify );

    /*******************************************************************************************************************
     targetProperty - @public (read-only NodeTests) {Property.<*>|null|undefined} - Set in setTargetProperty()
     ******************************************************************************************************************/

    /*******************************************************************************************************************
     forwardingListener - @protected {function|undefined} forwardingListener - Set lazily in setTargetProperty()
     ******************************************************************************************************************/

    /*******************************************************************************************************************
     ownedPhetioProperty - @public (NodeTests) {Property|undefined} - TinyProperty is not instrumented for PhET-iO, so
     - when a Node is instrumented, by default, an instrumented `Property` can be forwarded to. This field stores the
     - default instrumented Property when targetPropertyInstrumented is true.
     ******************************************************************************************************************/

    /*******************************************************************************************************************
     targetPropertyInstrumented - @private {boolean|undefined} - when true, automatically set up a PhET-iO instrumented
     forwarded Property for this TinyProperty, see this.initializePhetioObject() for usage.
     ******************************************************************************************************************/

    if ( targetPropertyInstrumented ) {
      this.targetPropertyInstrumented = targetPropertyInstrumented;
    }

    if ( assert ) {

      // @private - guard against double initialization
      this.phetioInitialized = false;
    }
  }

  /**
   * Sets (or unsets if `null` is provided) the Property that we use for forwarding changes.
   * @public
   *
   * @param {{updateLinkedElementForProperty:function}|null} node - The container of TinyForwardingProperty which supports updateLinkedElementForProperty()
   * @param {string|null} tandemName - null if the Property doesn't not support PhET-iO instrumentation
   * @param {TinyProperty.<*>|Property.<*>|null} newTargetProperty - null to "unset" forwarding.
   * @returns {Node} - the passed in Node, for chaining.
   */
  setTargetProperty( node, tandemName, newTargetProperty ) {
    assert && node && tandemName === null && assert( !node.isPhetioInstrumented(), 'tandemName must be provided for instrumented Nodes' );

    // no-op if we are already forwarding to that property OR if we still aren't forwarding
    if ( this.targetProperty === newTargetProperty ) {
      return node; // for chaining
    }

    const currentForwardingPropertyInstrumented = this.targetProperty &&
                                                  this.targetProperty.isPhetioInstrumented();
    assert && currentForwardingPropertyInstrumented && assert( newTargetProperty && newTargetProperty.isPhetioInstrumented(),
      'Cannot set swap out a PhET-iO instrumented targetProperty for an uninstrumented one' );

    // We need this information eagerly for later on in the function
    const previousTarget = this.targetProperty;

    // If we had the "default instrumented" Property, we'll remove that and then link our new Property. Guard on the fact
    // that ownedPhetioProperty is added via this exact method, see this.initializePhetio() for details
    // Do this before adding a PhET-iO LinkedElement because ownedPhetioProperty has the same phetioID as the LinkedElement
    if ( this.ownedPhetioProperty && newTargetProperty !== this.ownedPhetioProperty ) {
      this.disposeOwnedPhetioProperty();
    }

    node && node.updateLinkedElementForProperty( tandemName, previousTarget, newTargetProperty );

    // Lazily set this value, it will be added as a listener to any targetProperty we have.
    this.forwardingListener = this.forwardingListener || this.onTargetPropertyChange.bind( this );

    const oldValue = this.get();

    if ( this.targetProperty ) {
      this.targetProperty.unlink( this.forwardingListener );
    }

    this.targetProperty = newTargetProperty;

    if ( this.targetProperty ) {
      this.targetProperty.lazyLink( this.forwardingListener );
    }
    else {
      // If we're switching away from a targetProperty, prefer no notification (so set our value to the last value)
      this._value = oldValue;
    }

    const newValue = this.get();

    // Changing forwarding target COULD change the value, so send notifications if this is the case.
    if ( !this.areValuesEqual( oldValue, newValue ) ) {
      this.notifyListeners( oldValue );
    }

    return node; // for chaining
  }

  /**
   * Notify this Property's listeners when the targetProperty changes.
   * For performance, keep this listener on the prototype.
   * @param {*} value
   * @param {*} oldValue
   * @private
   */
  onTargetPropertyChange( value, oldValue ) {
    this.notifyListeners( oldValue );
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
    if ( this.targetProperty ) {
      return this.targetProperty.value;
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
    if ( this.targetProperty ) {
      assert && assert( this.targetProperty.isSettable(), 'targetProperty must be settable' );
      this.targetProperty.set( value );
    }
    else {
      super.set( value );
    }
    return this;
  }

  /**
   * Directly notifies listeners of changes. This needs to be an override to make sure that the value of the targetProperty
   * is used if it exists.
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
   * @param {boolean} targetPropertyInstrumented
   * @param {Node} node
   * @returns {Node} - for chaining
   */
  setTargetPropertyInstrumented( targetPropertyInstrumented, node ) {
    assert && assert( typeof targetPropertyInstrumented === 'boolean' );

    // See Node.initializePhetioObject for more details on this assertion
    assert && assert( !node.isPhetioInstrumented(), 'this option only works if it is passed in before this Node is instrumented' );

    this.targetPropertyInstrumented = targetPropertyInstrumented;

    return node;
  }

  /**
   * @public
   * @returns {boolean}
   */
  getTargetPropertyInstrumented() {
    return this.targetPropertyInstrumented;
  }

  /**
   * @param {Node} node - the parent container that supports updateLinkedElementForProperty()
   * @param {string} tandemName
   * @param {function():Property} createProperty - creates an "owned" Property
   * @public
   */
  initializePhetio( node, tandemName, createProperty ) {
    assert && assert( typeof tandemName === 'string' );
    assert && assert( typeof createProperty === 'function' );
    assert && assert( !this.phetioInitialized, 'already initialized' );
    assert && assert( !this.ownedPhetioProperty, 'Already created the ownedPhetioProperty' );

    if ( !this.targetProperty && this.targetPropertyInstrumented ) {

      this.ownedPhetioProperty = createProperty();
      assert && assert( this.ownedPhetioProperty instanceof Property, 'The owned property should be an AXON/Property' );
      assert && assert( this.ownedPhetioProperty.isPhetioInstrumented(), 'The owned property should be PhET-iO instrumented' );

      this.setTargetProperty( node, tandemName, this.ownedPhetioProperty );
    }
    else if ( this.targetProperty && this.targetProperty.isPhetioInstrumented() ) {

      // If the Property was already set, now that it is instrumented, add a LinkedElement for it.
      node.updateLinkedElementForProperty( tandemName, null, this.targetProperty );
    }

    if ( assert ) {
      this.phetioInitialized = true;
    }
  }

  /**
   * This currently also involves deleting the field.
   * @private
   */
  disposeOwnedPhetioProperty() {
    if ( this.ownedPhetioProperty ) {
      this.ownedPhetioProperty.dispose();
      delete this.ownedPhetioProperty; // back to original value
    }
  }

  /**
   * @public
   * @override
   */
  dispose() {
    this.targetProperty && this.targetProperty.unlink( this.forwardingListener );
    this.disposeOwnedPhetioProperty();
    super.dispose();
  }
}

axon.register( 'TinyForwardingProperty', TinyForwardingProperty );
export default TinyForwardingProperty;