// Copyright 2020-2022, University of Colorado Boulder

/**
 * A lightweight version of Property (that satisfies some of the interface), meant for high-performance applications
 * where validation, phet-io support and other things are not needed. This includes additional logic for conditionally
 * forwarding to/from another Property.
 *
 * Please note that TinyForwardingProperty exclusively supports settable Properties
 * via its TypeScript implementation. If you want to use a read-only Property as the target, please type cast as settable
 * and use runtime assertions to ensure that the target (or this forwarding Property) are not set. See examples like
 * Node.setVisibleProperty.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Jonathan Olson <jonathan.olson@colorado.edu>
 */

import axon from './axon.js';
import Property from './Property.js';
import ReadOnlyProperty from './ReadOnlyProperty.js';
import TinyProperty, { TinyPropertyOnBeforeNotify } from './TinyProperty.js';
import TProperty from './TProperty.js';
import TReadOnlyProperty, { isTReadOnlyProperty, PropertyLazyLinkListener } from './TReadOnlyProperty.js';

type NodeLike = {
  updateLinkedElementForProperty: <ValueType>( tandemName: string, oldProperty?: TProperty<ValueType> | null, newProperty?: TProperty<ValueType> | null ) => void;
  isPhetioInstrumented: () => boolean;
};

export default class TinyForwardingProperty<ValueType> extends TinyProperty<ValueType> {

  // Set in setTargetProperty()
  private targetProperty?: TProperty<ValueType> | null;

  // Set lazily in setTargetProperty()
  protected forwardingListener?: PropertyLazyLinkListener<ValueType>;

  // TinyProperty is not instrumented for PhET-iO, so when a Node is instrumented, by default, an instrumented
  // `Property` can be forwarded to. This field stores the default instrumented Property when
  // targetPropertyInstrumented is true. - Public for NodeTests
  private ownedPhetioProperty?: TProperty<ValueType>;

  // when true, automatically set up a PhET-iO instrumented forwarded Property for this TinyProperty, see
  // this.initializePhetioObject() for usage.
  private targetPropertyInstrumented?: boolean;

  // Guard against double initialization
  private phetioInitialized?: boolean;

  public constructor( value: ValueType, targetPropertyInstrumented: boolean, onBeforeNotify?: TinyPropertyOnBeforeNotify<ValueType> ) {
    super( value, onBeforeNotify );

    if ( targetPropertyInstrumented ) {
      this.targetPropertyInstrumented = targetPropertyInstrumented;
    }

    if ( assert ) {
      this.phetioInitialized = false;
    }
  }

  // API support for setting a Property|ValueType onto the forwarding Property
  public setValueOrTargetProperty<NodeType extends NodeLike, NodeParam extends ( NodeType | null )>(
    node: NodeParam, tandemName: string | null, newValueOrTargetProperty: TReadOnlyProperty<ValueType> | ValueType ): void {

    if ( ( isTReadOnlyProperty( newValueOrTargetProperty ) ) ) {

      // As a new Property
      this.setTargetProperty( node, tandemName, newValueOrTargetProperty as TProperty<ValueType> );
    }
    else { // as a ValueType
      const oldValue = this.get();

      this.clearTargetProperty();

      assert && assert( !this.targetProperty, 'just cleared' );

      // If we're switching away from a targetProperty, prefer no notification (so set our value to the last value)
      this.setPropertyValue( newValueOrTargetProperty );

      // Changing forwarding target COULD change the value, so send notifications if this is the case.
      if ( !this.areValuesEqual( oldValue, newValueOrTargetProperty ) ) {
        this.notifyListeners( oldValue );
      }
    }
  }

  /**
   * Sets (or unsets if `null` is provided) the Property that we use for forwarding changes.
   *
   * @param node - The container of TinyForwardingProperty which supports updateLinkedElementForProperty()
   * @param tandemName - null if the Property does not support PhET-iO instrumentation
   * @param newTargetProperty - null to "unset" forwarding.
   * @returns the passed in Node, for chaining.
   */
  public setTargetProperty<NodeType extends NodeLike, NodeParam extends ( NodeType | null )>( node: NodeParam, tandemName: string | null, newTargetProperty: TProperty<ValueType> | null ): NodeParam {
    assert && node && tandemName === null && this.targetPropertyInstrumented && assert( !node.isPhetioInstrumented(), 'tandemName must be provided for instrumented Nodes' );

    // no-op if we are already forwarding to that property OR if we still aren't forwarding
    if ( this.targetProperty === newTargetProperty ) {
      return node; // for chaining
    }

    const currentForwardingPropertyInstrumented = this.targetProperty &&
                                                  this.targetProperty instanceof ReadOnlyProperty && this.targetProperty.isPhetioInstrumented();
    assert && currentForwardingPropertyInstrumented && assert( newTargetProperty && newTargetProperty instanceof ReadOnlyProperty && newTargetProperty.isPhetioInstrumented(),
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

    const oldValue = this.get();

    this.clearTargetProperty();

    this.targetProperty = newTargetProperty;

    if ( this.targetProperty ) {
      assert && assert( this.forwardingListener, 'forwardingListener is not set yet' );
      this.targetProperty.lazyLink( this.forwardingListener! );
      this.setPropertyValue( this.targetProperty.value );
    }
    else {
      // If we're switching away from a targetProperty, prefer no notification (so set our value to the last value)
      this.setPropertyValue( oldValue );
    }

    // Changing forwarding target COULD change the value, so send notifications if this is the case.
    if ( !this.areValuesEqual( oldValue, this.get() ) ) {
      this.notifyListeners( oldValue );
    }

    return node; // for chaining
  }

  private clearTargetProperty(): void {

    // Lazily set this value, it will be added as a listener to any targetProperty we have.
    this.forwardingListener = this.forwardingListener || this.onTargetPropertyChange.bind( this );

    if ( this.targetProperty ) {
      this.targetProperty.unlink( this.forwardingListener );
    }
    this.targetProperty = null;
  }

  /**
   * Notify this Property's listeners when the targetProperty changes.
   * For performance, keep this listener on the prototype.
   */
  private onTargetPropertyChange( value: ValueType ): void {
    super.set( value );
  }

  /**
   * Sets the value and notifies listeners, unless deferred or disposed. You can also use the es5 getter
   * (property.value) but this means is provided for inner loops or internal code that must be fast. If the value
   * hasn't changed, this is a no-op.
   */
  public override set( value: ValueType ): this {
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
  public setTargetPropertyInstrumented<NodeType extends NodeLike>( targetPropertyInstrumented: boolean, node: NodeType ): NodeType {

    // See Node.initializePhetioObject for more details on this assertion
    assert && assert( !node.isPhetioInstrumented(), 'this option only works if it is passed in before this Node is instrumented' );

    this.targetPropertyInstrumented = targetPropertyInstrumented;

    return node;
  }

  public getTargetPropertyInstrumented(): boolean {
    return this.targetPropertyInstrumented || false;
  }

  /**
   * @param node - the parent container that supports updateLinkedElementForProperty()
   * @param tandemName
   * @param createProperty - creates an "owned" Property
   */
  public initializePhetio( node: NodeLike, tandemName: string, createProperty: () => TProperty<ValueType> ): void {
    assert && assert( !this.phetioInitialized, 'already initialized' );
    assert && assert( !this.ownedPhetioProperty, 'Already created the ownedPhetioProperty' );

    if ( !this.targetProperty && this.targetPropertyInstrumented ) {

      this.ownedPhetioProperty = createProperty();
      assert && assert( this.ownedPhetioProperty instanceof Property, 'The owned property should be an AXON/Property' );
      assert && assert( this.ownedPhetioProperty instanceof ReadOnlyProperty && this.ownedPhetioProperty.isPhetioInstrumented(), 'The owned property should be PhET-iO instrumented' );

      this.setTargetProperty( node, tandemName, this.ownedPhetioProperty );
    }
    else if ( this.targetProperty && this.targetProperty instanceof ReadOnlyProperty && this.targetProperty.isPhetioInstrumented() ) {

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
  private disposeOwnedPhetioProperty(): void {
    if ( this.ownedPhetioProperty ) {
      this.ownedPhetioProperty.dispose();
      delete this.ownedPhetioProperty; // back to original value
    }
  }

  public override dispose(): void {
    this.clearTargetProperty();
    this.disposeOwnedPhetioProperty();
    super.dispose();
  }
}

axon.register( 'TinyForwardingProperty', TinyForwardingProperty );
