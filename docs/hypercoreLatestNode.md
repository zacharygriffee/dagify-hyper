# Hypercore Latest Node API Documentation

The **hypercoreLatestNode** is a reactive node that emits the latest value from a hypercore. It waits for a valid hypercore to be supplied via the configuration, then listens for both the core becoming ready and for new append events so that it always reflects the most recent value.

---

## Overview

- **Readiness & Initial Value:**  
  The node waits for the hypercore to become ready (using `hypercore.ready()`), and then retrieves the value at the position determined by the hypercore's length and the provided offset. By default, an offset of `-1` means that the node retrieves the last element of the hypercore.

- **Real-Time Updates:**  
  The node also listens for "append" events (using `hypercoreOnAppend`) so that when new data is added to the hypercore, it updates its emitted value in real time.

- **Hot-Swap Behavior:**  
  If the supplied hypercore changes (i.e. a new hypercore is provided), the node stops previous subscriptions via an internal stop subject (`stop$`) before switching to the new hypercore.

---

## Function Signature

```js
const hypercoreLatestNode = (config = {}) => { ... }
```

---

## Parameters

- **config** *(Object, default: `{}`)*  
  A configuration object controlling the node’s behavior:

    - **config.hypercore** *(Hypercore | ReactiveNode)*  
      The hypercore instance (or a reactive node wrapping a hypercore) to observe.  
      **Note:** The node will not emit any value until this property is supplied.

    - **config.offset** *(number, default: -1)*  
      The offset used when retrieving the value from the hypercore.  
      The node retrieves the value at the position:  
      `hypercore.get(hypercore.length - offset, { ... })`  
      For example, an offset of `-1` retrieves the last element.

    - **config.coreConfig** *(Object, optional)*  
      Additional configuration options that are passed to both the `hypercore.get` and the `hypercoreOnAppend` triggers.

- Additionally, the configuration may already be reactive (i.e. a Dagify node). If not, the node wraps the provided hypercore using `ensureNode` with shallow options.

---

## Return Value

- **ReactiveNode**  
  A reactive node that emits the latest value from the hypercore. The node updates in real time as new data is appended or when the underlying hypercore changes.

---

## Internal Behavior and Lifecycle

1. **Reactive Dependency Handling:**
    - If the supplied configuration is not reactive, the node wraps the hypercore with `ensureNode({ shallow: true })` so that changes propagate.
    - The computed function receives an unwrapped configuration object from which it extracts the hypercore, offset, and any additional coreConfig options.

2. **Offset-Based Retrieval:**
    - When the hypercore is ready, the node calls `hypercore.get` at position `(hypercore.length - offset)`.
    - This allows consumers to specify which element to consider the “latest” value (e.g. using `-1` for the last element).

3. **Listening for Append Events:**
    - The node uses `hypercoreOnAppend` (with the specified offset and coreConfig) to listen for new data.
    - It concatenates the initial retrieval with the stream of new values so that it always emits the current latest value.

4. **Hot-Swap Mechanism:**
    - An internal stop subject (`stop$`) is used to cancel subscriptions if the hypercore changes.
    - If a new hypercore is supplied (detected by comparing with `lastCore`), the node signals the stop subject to terminate the previous subscription before starting a new one.

5. **Finalization:**
    - When the node is completed, the finalize callback emits on `stop$` and completes it, ensuring all subscriptions are properly cleaned up.

---

## Example Usage

```js
import { hypercoreLatestNode } from "dagify-hyper";

// Configure the node with a hypercore instance and an optional offset.
const latestNode = hypercoreLatestNode({
  hypercore: myHypercoreInstance,  // Hypercore instance or reactive node wrapping it.
  offset: -1,                      // Retrieve the last appended element.
  coreConfig: { wait: false }      // Additional options for hypercore triggers.
});

// Subscribe to the node to receive the latest value.
latestNode.subscribe(latestValue => {
  console.log("Latest hypercore value:", latestValue);
});
```

---

## Summary

The **hypercoreLatestNode** is designed to provide a reactive view of the latest value in a hypercore by:

- Waiting for the core to be ready and retrieving the value using an offset-based index.
- Listening for new append events to update the value in real time.
- Handling hot swapping by stopping previous subscriptions when a new hypercore is provided.
- Cleaning up internal subscriptions upon node finalization.

This node abstracts away the complexities of stream management and reactivity, offering a consistent and dynamic interface for applications that need to process the most recent hypercore data.

---