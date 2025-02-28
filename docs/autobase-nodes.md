# Autobase Integration using Dagify Reactive Nodes

This module provides a function, `createAutobaseIntegration`, that sets up a series of reactive nodes to integrate an Autobase view into your application. It leverages Dagify’s reactive architecture to manage updates, view retrieval, and lifecycle cleanup, making it easier to compose and manage Autobase integrations in a reactive manner.

## Overview

The `createAutobaseIntegration` function creates three primary reactive nodes:

- **applyNode:**  
  Captures and propagates updates, view data, and hostcalls from the integration.

- **viewNode:**  
  Holds the view retrieved from the store.

- **viewLatestNode:**  
  Derives the latest view from `viewNode` using the `hypercoreLatestNode` function. This node tracks the most recent view data.

Additionally, the function returns a configuration object that provides methods to apply updates, open a store (and retrieve the view), and close the integration—triggering cleanup on all nodes.

## Function Signature

```js
createAutobaseIntegration({
  viewName = "view",
  autobaseConfig,
  baseEncoding,
  viewEncoding
} = {})
```

### Parameters

- **options (Object)** *(optional)*  
  An object with the following properties:

    - **viewName (string, default: `"view"`):**  
      The name of the view in the store to retrieve.

    - **autobaseConfig (Object):**  
      Additional configuration options for the Autobase integration.

    - **baseEncoding (\*):**  
      The encoding to use for the base hypercore.

    - **viewEncoding (\*):**  
      The encoding to use for the view hypercore.

### Returns

An object containing:

- **config (Object):**  
  The integration configuration object that includes:
    - **apply(updates, view, hostcalls):**  
      Applies updates to the integration by setting the value of `applyNode`.
    - **open(store):**  
      Opens a store, retrieves the view (using the provided `viewName` and `viewEncoding`), sets the `viewNode`, and returns the view.
    - **close():**  
      Completes all reactive nodes (`applyNode`, `viewNode`, and `viewLatestNode`) to trigger cleanup.
    - **valueEncoding:**  
      The base encoding used for the hypercore.
    - Any additional properties supplied via `autobaseConfig`.

- **viewNode (ReactiveNode):**  
  A node that holds the view data retrieved from the store.

- **viewLatestNode (ReactiveNode):**  
  A node derived from `viewNode` that tracks the latest view (using `hypercoreLatestNode`).

- **applyNode (ReactiveNode):**  
  A node that receives and propagates updates, view data, and hostcalls.

## Detailed Behavior

When you call `createAutobaseIntegration`, it internally:

1. **Creates the applyNode:**  
   A node that later receives a combined payload of updates, view data, and hostcalls via the `apply()` method.

2. **Creates the viewNode:**  
   A node that holds the current view. This node is updated when a store is opened via the `open()` method.

3. **Creates the viewLatestNode:**  
   A node that derives the latest view from `viewNode` using the `hypercoreLatestNode` reactive node. This node is useful for applications that need to react only to the most recent view data.

4. **Builds the configuration object:**  
   The returned configuration object includes:
    - An **apply** method that sets a new value on `applyNode`.
    - An **open** method that retrieves a view from the store (using the given `viewName` and `viewEncoding`), sets the `viewNode`, and returns the view.
    - A **close** method that completes all reactive nodes to trigger proper cleanup.
    - The `valueEncoding` for the base hypercore.
    - Any additional configuration properties specified in `autobaseConfig`.

## Example Usage

Below is an example of how to use the Autobase integration:

```js
import { createAutobaseIntegration } from "./path/to/createAutobaseIntegration.js";

// Set up the integration with custom configuration.
const { config, viewNode, viewLatestNode, applyNode } = createAutobaseIntegration({
  viewName: "myView",
  autobaseConfig: { /* additional options */ },
  baseEncoding: "utf8",
  viewEncoding: "utf8"
});

// To apply updates to the integration:
config.apply({ delta: "some updates" }, { currentView: "viewData" }, { hostAction: "doSomething" });

// To open a store and retrieve the view:
const store = /* get your store instance */;
const view = config.open(store);
console.log("Retrieved view:", view);

// Subscribe to reactive nodes:
viewNode.subscribe(viewData => {
  console.log("View data updated:", viewData);
});

viewLatestNode.subscribe(latest => {
  console.log("Latest view data:", latest);
});

// Later, when closing the integration:
config.close();
```

## Conclusion

The `createAutobaseIntegration` function offers a structured way to integrate Autobase views into your application using Dagify reactive nodes. It provides clear separation of concerns with dedicated nodes for applying updates, holding the view, and tracking the latest view data. The configuration object returned by the function offers convenient methods to manage the lifecycle of your integration, ensuring that updates are applied and resources are cleaned up appropriately.