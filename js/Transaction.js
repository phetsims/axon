// Copyright 2019, University of Colorado Boulder

/**
 * Groups together related Properties so that they may be changed as a group, without sending out intermediate
 * notifications on inconsistent states.  Even though this is documented as supporting Property and variable names
 * indicate Property type, it is designed to support other types that may have setDeferred in the future.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );

  class Transaction {

    /**
     * @param {Property[]} properties
     */
    constructor( properties ) {

      // @private
      this.properties = properties;

      // @private - for assertions
      this.count = 0;
    }

    /**
     * Begins a transaction.  While the transaction is in progress, set Property values do not take effect or send out
     * notifications.
     *
     * @returns {Transaction} - for chaining
     * @public
     */
    start() {
      assert && assert( this.count === 0, 'Wrong count in Transaction.start, probably indicates a logic error.' );

      this.count++;

      // Defer each Property
      this.properties.forEach( property => property.setDeferred( true ) );

      // chaining so clients can call const transaction = new Transaction(...).start();
      return this;
    }

    /**
     * Ends a transaction.  Properties take their final values, then send out notifications (if values changed).
     * @public
     */
    end() {
      assert && assert( this.count === 1, 'Wrong count in Transaction.end, probably indicates a logic error.' );
      this.count--;

      // End defers that we started.  This allows Properties to take their new values without sending any notifications.
      const actions = this.properties.map( property => property.setDeferred( false ) );

      // If the Property value is different, send out notifications now that all values have been updated.
      actions.forEach( action => action && action() );
    }
  }

  return axon.register( 'Transaction', Transaction );
} );