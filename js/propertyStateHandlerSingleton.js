// Copyright 2020-2022, University of Colorado Boulder

/**
 * Singleton responsible for AXON/Property specific state logic. Use this global for the project to have a single
 * place to tap into the PhetioStateEngine, as well as a single point to register any order dependencies that Properties
 * have between each other when setting their state and applying their values/notifying.
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import axon from './axon.js';
import PropertyStateHandler from './PropertyStateHandler.js';

const propertyStateHandlerSingleton = new PropertyStateHandler();
axon.register( 'propertyStateHandlerSingleton', propertyStateHandlerSingleton );
export default propertyStateHandlerSingleton;