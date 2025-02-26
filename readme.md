# Dagify-Hyper

A collection of Dagify nodes for peer-to-peer hyper ecosystem tools. This library leverages Dagify to create reactive nodes that integrate seamlessly with hypercore and Autobase, enabling you to build reactive, p2p-enabled applications.

---

## Features

- **hypercoreLatestNode**: A reactive node that tracks the latest value from a hypercore instance. It listens for `"append"` events and emits the most recent value based on a configurable offset.
- **createAutobaseIntegration**: Provides a reactive integration configuration for Autobase. It creates dedicated nodes for handling view updates, applying changes, and managing resource cleanup.

---

## Installation

Ensure you have the required peer dependencies (`autobase` and `hypercore`) installed. Then install this package:

```bash
npm install dagify-hyper
```

---

## API Documentation

### hypercoreLatestNode

Creates a reactive node that emits the latest value from a hypercore. It updates whenever a new entry is appended or when the hypercore is ready.

**Signature:**

```js
hypercoreLatestNode(core, { offset = -1, ...coreConfig } = {}) => ReactiveNode
```

**Parameters:**

- **core**: The hypercore instance from which to retrieve data.
- **options** (optional):
    - **offset** (`number`, default: `-1`): Determines which element to retrieve relative to the hypercore length. For example, an offset of `-1` returns the last item, `-2` returns the second-to-last, etc.
    - **coreConfig**: Additional configuration options passed to the underlying hypercore event processing.

**Returns:**

- A `ReactiveNode` that emits the latest hypercore value based on the specified offset.

**Example:**

```js
import Hypercore from 'hypercore';
import RAM from 'random-access-memory';
import { hypercoreLatestNode } from 'dagify-hyper';
import { sleep } from './util/sleep.js';

const core = new Hypercore(RAM, { valueEncoding: 'utf8' });
const coreNode = hypercoreLatestNode(core, { offset: -1 });

coreNode.subscribe(value => {
  console.log('Latest value:', value);
});

// Append data and see the node update.
await core.append("hello");
await sleep(0); // Allow propagation
await core.append("world");
await sleep(0);
```

---

### createAutobaseIntegration

Creates a reactive Autobase integration configuration using Dagify nodes. This function sets up the necessary nodes to manage view updates and apply operations within the Autobase ecosystem.

**Signature:**

```js
createAutobaseIntegration({
  viewName = "view",
  autobaseConfig,
  baseEncoding,
  viewEncoding
} = {}) => { config, viewNode, viewLatestNode, applyNode }
```

**Parameters:**

- **options** (optional):
    - **viewName** (`string`, default: `"view"`): The name of the view to retrieve from the store.
    - **autobaseConfig** (`Object`): Additional configuration options for Autobase.
    - **baseEncoding**: The encoding to use for the base hypercore.
    - **viewEncoding**: The encoding to use for the view hypercore.

**Returns:**

An object containing:
- **config**: An integration configuration object with the following methods:
    - `apply(updates, view, hostcalls)`: Applies updates by setting the value of the apply node.
    - `open(store)`: Retrieves the view from the store using the provided `viewName` and `viewEncoding`, sets the view node, and returns the view.
    - `close()`: Completes all reactive nodes (`applyNode`, `viewNode`, and `viewLatestNode`) to clean up resources.
    - `valueEncoding`: The base encoding used for the hypercore.
- **viewNode**: A reactive node that holds the current view.
- **viewLatestNode**: A reactive node derived from `viewNode` that tracks the latest view.
- **applyNode**: A reactive node that captures updates, view, and hostcalls.

## Integration Usage Example

Below is an example of how you might utilize the Autobase integration in your application.

### Example: Reactive Autobase Integration

Imagine you have an Autobase instance managing a p2p data store. You can use the integration to process updates and display the latest view reactively:

```js
import Corestore from 'corestore';
import RAM from 'random-access-memory';
import Autobase from 'autobase';
import { createAutobaseIntegration } from 'dagify-hyper';
import { createNode } from 'dagify';
import { sleep } from './util/sleep.js';

// Set up the integration configuration with desired encodings.
const { config, viewLatestNode, applyNode } = createAutobaseIntegration({
  viewEncoding: "utf8",
  baseEncoding: "utf8"
});

// Create a Corestore instance using in-memory storage.
const corestore = new Corestore(RAM.reusable());

// Initialize Autobase with the reactive integration configuration.
const base = new Autobase(corestore, config);

// Create a Dagify node that listens for updates through applyNode.
// This node processes each update by appending " poke" to the incoming value,
// then appends the transformed value to the view.
createNode(
  async ({ updates, view, hostcalls }) => {
    for await (const { value } of updates) {
      await view.append(value + " world");
    }
  },
  applyNode
);

// Append an update to the Autobase instance.
await base.append("hello");

// Close the Autobase instance to trigger cleanup.
await base.close();

// Wait briefly to allow asynchronous propagation.
await sleep(0);

// You would likely utilize subscribe or attach this
// node to a computed rather than get the value (node.value) directly.
// The viewLatestNode should now reflect the transformed value.
console.log("Latest view:", viewLatestNode.value); // Expected output: "hello world"
```

### Explanation

1. **Integration Setup:**  
   The integration is created using `createAutobaseIntegration`, which returns a configuration object along with reactive nodes for managing the view and updates.

2. **Store and Autobase Initialization:**  
   A Corestore is created and used to initialize an Autobase instance with the provided integration config. This ties the reactive nodes into the p2p data flow.

3. **Reactive Update Processing:**  
   A Dagify node is set up using `applyNode` to process updates. For every update received, it appends a transformed version (by adding `" poke"`) to the view. This demonstrates how you can handle updates reactively.

4. **Cleanup and Result:**  
   After performing an update, the integration is closed, and the reactive node `viewLatestNode` is used to verify that the update has been processed correctly.

This usage example shows how to leverage the integration to build a reactive, p2p-enabled application that seamlessly ties together Autobase, hypercore, and Dagify nodes.


## License

MIt