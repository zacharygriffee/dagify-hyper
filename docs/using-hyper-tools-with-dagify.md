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