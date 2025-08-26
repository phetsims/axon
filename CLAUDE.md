# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Axon is a PhET library that provides the observable Property system and related patterns for interactive simulations. It contains Properties, Emitters, and other fundamental patterns used throughout PhET simulations.

## Development Commands

### Essential Commands
```bash
# TypeScript transpilation (required for development)
grunt output-js-project --live  # Watch mode for auto-transpilation

# Type checking
grunt type-check

# Linting
grunt lint         # Check for lint errors
grunt lint --fix   # Auto-fix lint errors
```

### Testing Architecture
- Unit tests are in `js/*Tests.ts` files alongside source files
- Tests use QUnit framework and run in browser via `axon-tests.html`
- Test entry point is `js/axon-tests.ts` which imports all test modules
- Tests should be run in both `phet` and `phet-io` brands to cover all functionality

## Code Architecture

### Core Property System
- `Property<T>` - Mutable observable properties with initial values and reset capability
- `ReadOnlyProperty<T>` - Immutable observable properties  
- `DerivedProperty` - Properties computed from other properties
- `NumberProperty`, `BooleanProperty`, `StringProperty` - Typed property subclasses
- `TinyProperty` - Lightweight property implementation

### Observer Pattern
- `Emitter` - Event emitter for notifications
- `TinyEmitter` - Lightweight emitter implementation
- Properties use link/unlink for observation

### Key Patterns
```typescript
// Creating properties
const positionProperty = new Vector2Property( new Vector2( 0, 0 ) );
const massProperty = new NumberProperty( 5 );

// Observing changes
const listener = ( value: number ) => { /* handle change */ };
massProperty.link( listener );

// CRITICAL: Always unlink to prevent memory leaks
massProperty.unlink( listener );

// DerivedProperty for computed values
const forceProperty = new DerivedProperty(
  [ massProperty, accelerationProperty ],
  ( mass, acceleration ) => mass * acceleration
);
```

### Memory Management
- Always unlink Property listeners when disposing objects
- Use dispose patterns consistently
- Avoid setting Properties within their own listeners (reentrant issues)

### TypeScript Migration
- Repository is fully migrated to TypeScript
- Use `grunt output-js-project --live` for development transpilation
- Type definitions are comprehensive throughout

## File Structure
- `js/` - All source code in TypeScript
- `js/*Tests.ts` - Unit tests alongside source files
- `js/axon.ts` - Namespace export
- `js/main.ts` - Main entry point
- `axon-tests.html` - Browser test runner

## Development Notes
- This is a core PhET library used by simulation repositories
- Changes here affect many dependent repositories
- Follow existing Property patterns and naming conventions
- All public APIs should be well-typed and documented