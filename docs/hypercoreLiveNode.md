# Hypercore Live Node API Documentation

The **hypercoreLiveNode** is a reactive node that provides a live data stream from a hypercore. It integrates with Dagify's reactive framework and RxJS to continuously emit new data as it is appended to the hypercore. When the underlying core or its configuration changes, the node can hot swap by closing the old stream and creating a new one.

---

## Overview

- **Live Streaming:**  
  The node creates a read stream from the hypercore with `{ live: true }`, meaning it listens continuously for new data.

- **Hot Swap Behavior:**  
  When the hypercore or configuration changes:
    - If `config.hotswap` is true (default), the node destroys any existing stream(s) and creates a new one.
    - If `config.hotswap` is false, previously created streams remain open until the node completes.

- **Reactive Configuration:**  
  The node expects its configuration to be reactive.
    - If the configuration is not already reactive, it must supply a `hypercore` property via `config.hypercore` (either as a reactive node or a valid hypercore instance).
    - If `config.hypercore` is not reactive, it is wrapped using `ensureNode` with shallow options.

- **Resource Management:**  
  An internal counter (`streamCount`) tracks the number of active streams, and cleanup functions are maintained in an array to ensure proper teardown when the node is finalized.

---

## Function Signature

```js
const hypercoreLiveNode = (config = {}) => { ... }
```

---

## Parameters

- **config** *(Object, default: `{}`)*  
  A configuration object controlling the live stream behavior.

    - **config.hypercore** *(Hypercore | ReactiveNode)*  
      The hypercore instance or a reactive node wrapping a hypercore to observe.  
      **Note:** If the configuration is not already reactive, this property is required. An error will be thrown if it is missing.

    - **config.hotswap** *(boolean, default: true)*  
      Determines whether to hot swap the stream when the underlying core changes.
        - If `true` (default), when a new hypercore is detected, any existing streams are immediately destroyed.
        - If `false`, existing streams remain open until the node is completed.

    - **config.length** *(number, optional)*  
      An optional length override that specifies the starting position for the live read stream.  
      If not provided, the stream starts at `hypercore.length`.

    - **Other Properties:**  
      Any additional configuration properties are passed along to the hypercore's `createReadStream` method.

---

## Return Value

- **ReactiveNode**  
  Returns a reactive node that emits live data from the hypercore. The node's value updates in real time as new data is appended. It also exposes a `streamCount` property that reflects the number of active streams.

---

## Internal Behavior and Lifecycle

1. **Reactive Dependency Handling:**
    - The computed function receives both the `hypercore` and the configuration as reactive dependencies.
    - If no hypercore is provided (in a non-reactive configuration), an error is thrown.

2. **Hot Swap Mechanism:**
    - The node checks if the hypercore has changed by comparing it with an internally stored `lastCore`.
    - If a new hypercore is detected and hot swapping is enabled (`config.hotswap` !== false), the node invokes all cleanup functions to terminate the old stream(s).

3. **Stream Creation and Data Emission:**
    - A new live read stream is created using `hypercore.createReadStream` with the current configuration options, ensuring that the stream is set to live mode.
    - A dedicated `AsyncSubject` (`close$`) is used to signal when the stream should be terminated.
    - The stream’s data is wrapped in an observable via `from(stream)`, and operators like `takeUntil`, `finalize`, and `catchError` are applied to manage the lifecycle and error handling.
    - The `finalize` operator decrements an internal `streamCount` when a stream completes.

4. **Cleanup:**
    - When the node is finalized, an `onCleanup` callback is triggered, iterating through the cleanup functions and ensuring all streams are properly destroyed.

---

## Example Usage

```js
import { hypercoreLiveNode } from "dagify-hyper";

// Example configuration to create a live node.
// The hypercore is provided as a reactive node or a direct hypercore instance.
const config = {
  hypercore: myHypercoreInstance, // Required if config is non-reactive.
  hotswap: true,                  // Enable hot swapping (default behavior).
  length: 0                       // Optional: start reading from a specific offset.
};

const liveNode = hypercoreLiveNode(config);

// Subscribe to receive live updates from the hypercore.
liveNode.subscribe(data => {
  console.log("Live data received:", data);
});

// Check the number of active streams.
console.log("Active stream count:", liveNode.streamCount);

// When done, complete the node to trigger cleanup.
liveNode.complete();
```

---

## Summary

The **hypercoreLiveNode** provides a powerful, reactive interface for live data streaming from a hypercore. Key features include:

- **Live Data Updates:**  
  Continuously emits new data as it is appended to the hypercore.

- **Hot Swapping:**  
  Automatically handles hypercore changes by closing old streams and starting new ones (if `hotswap` is enabled).

- **Reactive Configuration:**  
  Integrates with reactive configuration systems, allowing the hypercore to be supplied either immediately or later.

- **Resource Management:**  
  Uses RxJS operators and internal cleanup functions to manage stream lifecycles and ensure proper resource deallocation.

> **Warning:**  
> When integrating hyper* libraries (e.g., hypercore, corestore, hyperswarm), always wrap these objects using `createShallowNode` or `createNode` with `{ shallow: true }` to ensure proper reactivity and avoid deep analysis of complex internals.

This node is part of the dagify-hyper suite, which aims to provide a comprehensive set of reactive tools for working with decentralized hyper* protocols in your applications.

---