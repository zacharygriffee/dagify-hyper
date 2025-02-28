# Hypercore Nodes Documentation

This documentation describes a collection of reactive nodes built around hypercore and corestore. These nodes wrap hypercore functionality into Dagify’s reactive framework so that data streams, core instances, or ranges of data can be observed and managed reactively. The nodes covered are:

    - **Hypercore Head Node**
- **Hypercore Latest Node**
- **Hypercore Live Node**
- **Hypercore Node**
- **Hypercore Range Node**

Each node provides a specific use case, and many include features like hot swapping, cleanup, and reactive configuration.

---

## 1. Hypercore Head Node

**Purpose:**
Retrieves a specific value (the “head”) from a hypercore at a given offset.

**Implementation Details:**
- Uses `core.get(offset, coreConfig)` to obtain the value.
- Designed as a simple wrapper that takes a hypercore instance and optional offset/configuration.

**Usage Example:**

```js
import { hypercoreHeadNode } from "./hypercoreHeadNode.js";

// Retrieve the head value (default offset is 0)
const headNode = hypercoreHeadNode(hypercore, { offset: 0 });
headNode.subscribe(value => {
  console.log("Head value:", value);
});
```

---

## 2. Hypercore Latest Node

**Purpose:**
Tracks and emits the latest value from a hypercore (for example, the last appended item).

**Implementation Details:**
- Combines multiple triggers: one that listens to "append" events (via `hypercoreOnAppend`) and another that listens to when the core becomes ready (via `hypercoreReadyTrigger`).
- Wraps these dependencies into a shallow node so that whenever the hypercore updates (new append), the node recalculates and emits the latest value.
- Often used in live applications where you want to react to new data as it arrives.

**Usage Example:**

```js
import { hypercoreLatestNode } from "./hypercoreLatestNode.js";

const latestNode = hypercoreLatestNode(hypercore, { offset: -1 });
latestNode.subscribe(latestValue => {
  console.log("Latest value:", latestValue);
});
```

---

## 3. Hypercore Live Node

**Purpose:**
Creates a live, continuously updating stream from a hypercore. This node emits new data as it is appended.

**Key Features:**
- **Live Streaming:** Uses `core.createReadStream` with `{ live: true }` so that the stream keeps listening for new data.
                                                                                                                - **Hot Swapping:**
- When the underlying core or its configuration changes, if `config.hotswap` is true (the default), any existing stream is destroyed, and a new stream is created.
- Maintains a `streamCount` property to track the number of active streams.
- **Reactive Configuration:**
Both the core and config are wrapped with `ensureNode`, so changes to configuration (such as `hotswap` or `length`) automatically trigger re-computation.

**Usage Example:**

```js
import { hypercoreLiveNode } from "./hypercoreLiveNode.js";

const liveNode = hypercoreLiveNode(hypercore, { hotswap: true, length: 0 });
liveNode.subscribe(data => {
  console.log("Live data:", data);
});

// The node automatically cleans up old streams if the core or config changes.
console.log("Active stream count:", liveNode.streamCount);
```

---

## 4. Hypercore Node

**Purpose:**
Retrieves a hypercore instance from a corestore based on a reactive configuration.

**Key Features:**
- **Configuration-Driven:**
The node requires a configuration object that must contain either a `name` or a `key` (but not both) to identify the core.
- **Parameter Signature:**
The function signature is designed as `hypercoreNode(config, store)` where:
    - `config` is required.
- `store` is optional (defaults to a global corestore).
- **Hot-Swap Logic:**
When a new core is obtained (due to changes in configuration), if `config.hotswap` is enabled (default true), the previous core is immediately closed. Otherwise, all cores remain open until cleanup.
- **Cleanup:**
On node finalization, all cores that were created are closed.

**Usage Example:**

```js
import { hypercoreNode } from "./hypercoreNode.js";

// Provide a configuration with either a name or a key.
const config = { name: "my-hypercore", hotswap: true };
const node = hypercoreNode(config);

// Subscribe to get the hypercore instance.
node.subscribe(core => {
  console.log("Received core:", core);
});
```

---

## 5. Hypercore Range Node

**Purpose:**
Retrieves a range of values from a hypercore between specified start and end indices.

**Key Features:**
- **Range Interpretation:**
- If the `start` or `end` values are negative, they are interpreted as offsets from the current length of the core.
- **Data Collection:**
Uses a read stream (with `live: false`) to retrieve all items in the range and collects them into an array via the `toArray` operator.
- **One-Time Retrieval:**
Since the stream is not live, this node is used for one-off queries on the hypercore data.

**Usage Example:**

```js
import { hypercoreRangeNode } from "./hypercoreRangeNode.js";

const rangeNode = hypercoreRangeNode(hypercore, { start: 0, end: 10 });
rangeNode.subscribe(values => {
  console.log("Range values:", values);
});
```

---

## General Concepts

### Reactive Wrapping with `ensureNode`
    Each hypercore node makes use of Dagify’s `ensureNode` utility to wrap objects (like a hypercore instance, corestore, or configuration object) so that they become reactive. This ensures that:
    - Any changes to these dependencies will trigger re-computation.
- Complex objects are shallow-wrapped so that their identity is maintained without deep analysis.

### Hot Swapping
Both the **Hypercore Node** and **Hypercore Live Node** support hot swapping:
    - **Definition:** Hot swapping refers to the process of closing the old resource (core or stream) and replacing it with a new one when configuration or core values change.
- **Configuration:** Controlled by the `hotswap` flag in the configuration object. If true, old cores/streams are closed immediately upon detecting a change.

### Cleanup and Resource Management
Each node is designed to manage its resources:
    - **Hypercore Node:** Closes all created cores on cleanup.
- **Hypercore Live Node:** Uses an internal cleanup array and RxJS operators (like `finalize` and `takeUntil`) to ensure that streams are destroyed and the stream count is updated when the node completes.

---

## Summary

- **Hypercore Head Node:** Retrieves a specific value (by offset) from a hypercore.
- **Hypercore Latest Node:** Tracks and emits the most recently appended value.
- **Hypercore Live Node:** Provides a live stream of appended data with hot-swap capabilities for streams.
                                                                                                  - **Hypercore Node:** Retrieves a hypercore instance from a corestore based on a configuration, with hot-swap behavior for cores.
                                                                                                                                                                                                                             - **Hypercore Range Node:** Retrieves a set of values from a hypercore within a specified range.

    This collection of nodes leverages reactive programming to dynamically manage hypercore resources, ensure cleanup, and support hot swapping in response to configuration changes. Each node is tailored for a different use case—whether you need live updates, single-value retrieval, or range queries—and is designed to integrate seamlessly into the Dagify ecosystem.

---