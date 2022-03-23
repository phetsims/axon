// Copyright 2020-2022, University of Colorado Boulder

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
import TinyProperty, { TinyPropertyOnBeforeNotify } from './TinyProperty.js';
import IProperty from './IProperty.js';
import { PropertyLazyLinkListener } from './IReadOnlyProperty.js';

type NodeLike = {
  updateLinkedElementForProperty: <T>( tandemName: string, oldProperty?: IProperty<T> | null, newProperty?: IProperty<T> | null ) => void;
  isPhetioInstrumented: () => boolean;
};

export default class TinyForwardingProperty<T> extends TinyProperty<T> {

  // Set in setTargetProperty() - public for read-only NodeTests
  targetProperty?: IProperty<T> | null;

  // Set lazily in setTargetProperty()
  protected forwardingListener?: PropertyLazyLinkListener<T>;

  // TinyProperty is not instrumented for PhET-iO, so when a Node is instrumented, by default, an instrumented
  // `Property` can be forwarded to. This field stores the default instrumented Property when
  // targetPropertyInstrumented is true. - Public for NodeTests
  ownedPhetioProperty?: IProperty<T>;

  // when true, automatically set up a PhET-iO instrumented forwarded Property for this TinyProperty, see
  // this.initializePhetioObject() for usage.
  private targetPropertyInstrumented?: boolean;

  // Guard against double initialization
  private phetioInitialized?: boolean;

  constructor( value: T, targetPropertyInstrumented: boolean, onBeforeNotify?: TinyPropertyOnBeforeNotify<T> ) {
    super( value, onBeforeNotify );

    if ( targetPropertyInstrumented ) {
      this.targetPropertyInstrumented = targetPropertyInstrumented;
    }

    if ( assert ) {
      this.phetioInitialized = false;
    }
  }

  /**
   * Sets (or unsets if `null` is provided) the Property that we use for forwarding changes.
   *
   * @param node - The container of TinyForwardingProperty which supports updateLinkedElementForProperty()
   * @param tandemName - null if the Property doesn't not support PhET-iO instrumentation
   * @param newTargetProperty - null to "unset" forwarding.
   * @returns the passed in Node, for chaining.
   */
  setTargetProperty<NodeType extends NodeLike>( node: NodeType, tandemName: string | null, newTargetProperty: IProperty<T> | null ): NodeType {
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

    node && tandemName !== null && node.updateLinkedElementForProperty( tandemName, previousTarget, newTargetProperty );

    // Lazily set this value, it will be added as a listener to any targetProperty we have.
    this.forwardingListener = this.forwardingListener || this.onTargetPropertyChange.bind( this );

    const oldValue = this.get();

    if ( this.targetProperty ) {
      this.targetProperty.unlink( this.forwardingListener );
    }

    this.targetProperty = newTargetProperty;

    if ( this.targetProperty ) {
      this.targetProperty.lazyLink( this.forwardingListener );
      this.setPropertyValue( this.targetProperty.value );
    }
    else {
      // If we're switching away from a targetProperty, prefer no notification (so set our value to the last value)
      this.setPropertyValue( oldValue );
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
   */
  private onTargetPropertyChange( value: T ) {
    super.set( value );
  }

  /**
   * Sets the value and notifies listeners, unless deferred or disposed. You can also use the es5 getter
   * (property.value) but this means is provided for inner loops or internal code that must be fast. If the value
   * hasn't changed, this is a no-op.
   */
  set( value: T ): this {
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
   * Use this to automatically create a forwarded, PhET-iO instrumented Property owned by this TinyForwardingProperty.
   */
  setTargetPropertyInstrumented<NodeType extends NodeLike>( targetPropertyInstrumented: boolean, node: NodeType ): NodeType {
    assert && assert( typeof targetPropertyInstrumented === 'boolean' );

    // See Node.initializePhetioObject for more details on this assertion
    assert && assert( !node.isPhetioInstrumented(), 'this option only works if it is passed in before this Node is instrumented' );

    this.targetPropertyInstrumented = targetPropertyInstrumented;

    return node;
  }

  getTargetPropertyInstrumented(): boolean {
    return this.targetPropertyInstrumented || false;
  }

  /**
   * @param node - the parent container that supports updateLinkedElementForProperty()
   * @param tandemName
   * @param createProperty - creates an "owned" Property
   */
  initializePhetio( node: NodeLike, tandemName: string, createProperty: () => IProperty<T> ) {
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
   */
  private disposeOwnedPhetioProperty() {
    if ( this.ownedPhetioProperty ) {
      this.ownedPhetioProperty.dispose();
      delete this.ownedPhetioProperty; // back to original value
    }
  }

  dispose() {
    this.targetProperty && this.forwardingListener && this.targetProperty.unlink( this.forwardingListener );
    this.disposeOwnedPhetioProperty();
    super.dispose();
  }
}

axon.register( 'TinyForwardingProperty', TinyForwardingProperty );
