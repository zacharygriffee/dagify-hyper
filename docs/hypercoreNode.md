# Hypercore Node API Documentation

The **hypercoreNode** function creates a reactive node that retrieves a hypercore from a corestore using a provided configuration. It is designed to work within the Dagify reactive framework, automatically updating when the configuration changes and supporting hot swapping of hypercores.

> **Warning:**  
> When integrating hyper* libraries (such as **hypercore**, **corestore**, **hyperswarm**, etc.) with Dagify's reactive system, it is **essential** to wrap these objects using either `createShallowNode` or `createNode` with the option `{ shallow: true }`.  
> This shallow wrapping ensures that only the top-level object is made reactive, without attempting a deep analysis of complex internal state.  
> Failure to do so may result in unexpected behavior, inefficient updates, or runtime errors.
>
> **Example:**
> ```js
> // Wrap a hypercore instance shallowly:
> const reactiveHypercore = createShallowNode(hypercoreInstance);
> 
> // Or using createNode with shallow options:
> const reactiveCorestore = createNode(corestoreInstance, { shallow: true });
> ```

## Overview

The `hypercoreNode` retrieves a hypercore instance based on a configuration object that must specify either a `name` or a `key`—but not both—to uniquely identify the core. Optionally, a custom corestore may be provided via the configuration (using the `corestore` property); if omitted, the global corestore is used.

When the configuration changes and a new core is returned:
- **Hot Swap Enabled (default):**  
  If `config.hotswap` is true, the previous core is closed immediately.
- **Hot Swap Disabled:**  
  If `config.hotswap` is set to false, previously created cores remain open until the node is finalized.

The node waits for the new core to be ready before emitting it. All cores that were created are tracked internally and are closed during cleanup when the node completes.

## Function Signature

```js
const hypercoreNode = (config = {}) => { ... }
```

## Parameters

- **config** *(Object, default: `{}`)*  
  The configuration object for retrieving the hypercore. It must include exactly one of the following:

    - **config.name** *(string, optional)*  
      The name used to identify the core. **Mutually exclusive** with `config.key`.

    - **config.key** *(any, optional)*  
      The key used to identify the core. **Mutually exclusive** with `config.name`.

  Additionally, the configuration can include:

    - **config.hotswap** *(boolean, default: true)*  
      Determines whether hot swapping is enabled.
        - If `true`, when a new core is returned (due to configuration changes), the previous core is closed immediately.
        - If `false`, previously created cores remain open until the node is finalized.

    - **config.corestore** *(Corestore | ReactiveNode, optional)*  
      An optional corestore from which to retrieve cores. If not supplied, the global corestore is used.

- **store:**  
  (Internal; not part of the public API)  
  The function uses the corestore specified by `config.corestore` if provided. Otherwise, it defaults to the global corestore.

## Return Value

- **ReactiveNode**  
  Returns a reactive node that yields the hypercore instance. This node automatically re-computes if the configuration changes, and it ensures that outdated cores are closed according to the hot swap policy.

## Behavior and Lifecycle

1. **Configuration Validation:**  
   The computed function first checks that exactly one of `config.name` or `config.key` is provided. If neither or both are present, the node emits `NO_EMIT`.

2. **Core Retrieval:**  
   Using the corestore (from `config.corestore` or the global corestore), the node retrieves a new core via `corestore.get(config)`.

3. **Hot Swapping:**
    - If there is a previously retrieved core (`lastCore`) that is different from the new one:
        - If `config.hotswap` is not explicitly set to false (default is true), the previous core is closed immediately.
        - The old core is removed from the internal tracking array.
    - The new core is then stored as `lastCore` and added to the tracking array.

4. **Core Readiness:**  
   The node waits for the new core to become ready by calling `await newCore.ready()` before emitting the core.

5. **Cleanup:**  
   When the node is finalized (via the `onCleanup` callback), all created cores are closed by iterating through the internal tracking array.

## Example Usage

```js
import { hypercoreNode } from "dagify-hyper";

// Example configuration using a name to identify the core.
const config = {
  name: "my-hypercore",
  hotswap: true,  // Optional; defaults to true.
  // Additional options as needed.
};

// Create the reactive node. Optionally, you can pass a custom corestore via config.corestore.
const node = hypercoreNode(config);

// Subscribe to the node to receive the hypercore instance.
node.subscribe(core => {
  console.log("Received hypercore:", core);
});

// When the configuration changes (e.g., a new name or key is provided), the node re-computes:
// - If hot swapping is enabled, the previous core is closed immediately.
// - The new core is awaited to be ready before being emitted.
```

## Summary

The **hypercoreNode** function provides a reactive interface to retrieve hypercores from a corestore. It ensures that:
- A valid configuration is provided (exactly one of `name` or `key`).
- The hypercore is retrieved from either a custom or global corestore.
- Old cores are hot swapped (closed) when a new core is obtained (if enabled).
- All cores are properly closed when the node is finalized, preventing resource leaks.

This design makes it easy to integrate hypercore data sources into reactive applications using Dagify.

---