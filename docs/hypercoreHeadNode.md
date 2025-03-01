# Hypercore Head Node API Documentation

The **hypercoreHeadNode** is a reactive node that retrieves a single value from a hypercore at a specified offset. It integrates with the Dagify reactive framework so that if the underlying hypercore or configuration changes, the node re-computes and updates its emitted value.

---

## Overview

The `hypercoreHeadNode` retrieves a value from a hypercore using the hypercore's `get` method. By default, the node retrieves the value at offset `0` (i.e. the first element), but this can be adjusted via the configuration.  
**Note:**
- If the configuration is provided as a reactive node, the `hypercore` property is optional and may be supplied later.
- If the configuration is not reactive, then a hypercore must be supplied via `config.hypercore` (either as a reactive node or as a valid hypercore instance). In the latter case, if it is not already reactive, it is wrapped using `ensureNode` (with shallow options).

---

## Function Signature

```js
const hypercoreHeadNode = (config = {}) => { ... }
```

---

## Parameters

- **config** *(Object, default: `{}`)*  
  A configuration object for retrieving the hypercore value. This object may be reactive.

    - **config.hypercore** *(Hypercore | ReactiveNode, optional)*  
      The hypercore instance or reactive node wrapping a hypercore.
        - **Required if the configuration is non-reactive.**
        - If the configuration is reactive, the hypercore may be supplied later.

    - **config.offset** *(number, default: 0)*  
      The offset at which to retrieve the value from the hypercore. An offset of `0` retrieves the first element; other values retrieve the corresponding element.

    - **config.coreConfig** *(Object, optional)*  
      Additional options that will be passed to the hypercore's `get` method.

    - **Other Properties:**  
      Any additional configuration properties will be forwarded to the node's computed function.

---

## Return Value

- **ReactiveNode**  
  Returns a reactive node that emits the value obtained from the hypercore at the specified offset. The node automatically re-computes when the underlying hypercore or configuration changes.

---

## Behavior and Lifecycle

1. **Reactive Dependency Handling:**
    - If the provided configuration is not already reactive and does not supply `config.hypercore`, an error is thrown.
    - If `config.hypercore` is not a reactive node, it is wrapped using `ensureNode` with shallow options, ensuring that changes to the hypercore propagate correctly.
    - When the configuration is reactive, the hypercore may be provided later without affecting the node’s ability to re-compute.

2. **Value Retrieval:**  
   The node calls `hypercore.get(offset, coreConfig)` on the supplied hypercore to retrieve the value at the specified offset.

3. **Reactivity:**  
   If the underlying hypercore or any configuration options change, the node re-computes and emits the updated value.

---

## Example Usage

```js
import { hypercoreHeadNode } from "dagify-hyper";

// Example configuration using a non-reactive hypercore:
// Here, hypercore must be supplied directly.
const config1 = {
  hypercore: myHypercoreInstance,  // Must be supplied if config is non-reactive.
  offset: 0,                       // Retrieve the element at index 0.
  coreConfig: { wait: false }      // Additional options for hypercore.get.
};

const headNode1 = hypercoreHeadNode(config1);
headNode1.subscribe(value => {
  console.log("Head value (non-reactive config):", value);
});

// Example configuration using a reactive config:
// The hypercore property is optional here; it may be supplied later.
const reactiveConfig = createNode({ offset: 0, coreConfig: { wait: false } });
const headNode2 = hypercoreHeadNode(reactiveConfig);
headNode2.subscribe(value => {
  console.log("Head value (reactive config):", value);
});
```

---

## Summary

The **hypercoreHeadNode** provides a straightforward reactive interface for retrieving a specific element from a hypercore based on a given offset. It supports both reactive and non-reactive configurations:
- When using a non-reactive configuration, `config.hypercore` is required.
- When using a reactive configuration, the hypercore can be supplied later, making it flexible for dynamic setups.

The node automatically updates its output when any of its dependencies change, ensuring that your application always has access to the correct value from the hypercore.