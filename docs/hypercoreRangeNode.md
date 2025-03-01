# Hypercore Range Node API Documentation

The **hypercoreRangeNode** is a reactive node designed to retrieve an array of values from a hypercore over a specified range. It leverages Dagify's reactive framework and RxJS to create a one-time read stream from the hypercore and collect the resulting values into an array.

---

## Overview

The hypercoreRangeNode emits the values from a hypercore by:
- Creating a read stream with `{ live: false }`, meaning it performs a one-off retrieval.
- Collecting the streamed values into an array using RxJS's `toArray` operator.

### Reactive Configuration

- **Delayed Hypercore Assignment:**  
  If the configuration is reactive (i.e. `config.isDagifyNode` is true), the hypercore may be supplied later via the reactive configuration.

- **Immediate Hypercore Requirement:**  
  If the configuration is non-reactive, a hypercore must be provided immediately via `config.hypercore`.  
  If not already reactive, it will be wrapped with `ensureNode` (using shallow options) to guarantee reactivity.

### Range Calculation

- **Range Definition:**  
  The range is specified via the `config.range` object.
    - `start` defines the starting index.
    - `end` defines the ending index (exclusive). If `end` is not provided, it defaults to the current hypercore length.

- **Negative Indices:**  
  Negative values for `start` or `end` are interpreted as offsets from the current hypercore length.  
  For example, a `start` of `-5` means "start 5 items from the end" of the hypercore.

---

## Function Signature

```js
const hypercoreRangeNode = (config = {}) => { ... }
```

---

## Parameters

- **config** *(Object, default: `{}`)*  
  A configuration object for retrieving a range of values from the hypercore.

    - **config.hypercore** *(Hypercore | ReactiveNode, optional)*  
      The hypercore instance (or reactive node wrapping it) to query.
        - **Required if the configuration is non-reactive.**
        - In a reactive configuration, the hypercore may be supplied later.

    - **config.range** *(Object, optional)*  
      An object specifying the range of values to retrieve.

        - **config.range.start** *(number, optional)*  
          The starting index of the range.  
          If negative, it is treated as an offset from the current hypercore length.

        - **config.range.end** *(number, optional)*  
          The ending index (exclusive) of the range.  
          If negative, it is treated as an offset from the current hypercore length.  
          Defaults to the current hypercore length.

    - **Other properties:**  
      Any additional configuration properties will be forwarded to the node's computed function.

---

## Return Value

- **ReactiveNode**  
  Returns a reactive node that, when evaluated, emits an array containing the values from the specified range of the hypercore. If no hypercore is supplied (in a non-reactive configuration), the node will emit `NO_EMIT`.

---

## Error Handling

If the configuration is non-reactive and no hypercore is supplied via `config.hypercore`, the node will throw an error with the following message:

> "A hypercore must be supplied via config.hypercore (either as a reactive node or a valid hypercore instance) to enable hot swapping."

---

## Internal Behavior and Lifecycle

1. **Reactive Wrapping:**
    - If the configuration is non-reactive and `config.hypercore` is not already reactive, the hypercore is wrapped using `ensureNode` with shallow options.

2. **Range Calculation:**
    - The computed function extracts `start` and `end` from `config.range`.
    - Negative indices are adjusted based on the hypercore's current length.

3. **Stream Creation:**
    - A read stream is created via `hypercore.createReadStream`, with the options `{ live: false, start, end }`.
    - The stream is wrapped in a `defer` so that it is only created upon subscription.

4. **Collecting Data:**
    - The data from the read stream is collected into an array using the RxJS `toArray` operator.

5. **Emission:**
    - The node emits the resulting array of values as its output.

---

## Example Usage

```js
import { hypercoreRangeNode } from "dagify-hyper";

// Example configuration for retrieving a range of values from a hypercore.
const config = {
  hypercore: myHypercoreInstance, // Either a hypercore instance or a reactive node wrapping one.
  range: {
    start: -10,  // Start reading from 10 items from the end.
    end: -1      // End reading 1 item from the end (exclusive).
  }
};

// Create the reactive node.
const rangeNode = hypercoreRangeNode(config);

// Subscribe to the node to receive the array of values.
rangeNode.subscribe(values => {
  console.log("Retrieved range of values:", values);
});
```

---

## Summary

The **hypercoreRangeNode** provides a reactive way to query a hypercore for a specific range of data. It:
- Allows flexible specification of the range, with support for negative indexing.
- Supports reactive configurations so that the hypercore can be supplied later.
- Collects the data into an array and emits it as a single value.
- Enforces that, for non-reactive configurations, a hypercore must be supplied.

> **Warning:** When integrating hyper* libraries (e.g., hypercore, corestore, hyperswarm) with Dagify, always wrap these objects using `createShallowNode` or `createNode` with `{ shallow: true }` to ensure proper reactivity without deep analysis of complex internals.

This node is part of the dagify-hyper suite, which aims to provide a robust set of reactive tools for working with decentralized hyper* protocols in your applications.

---