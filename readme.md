# dagify-hyper

**dagify-hyper** is the starting point for a suite of reactive hyper* tools built on top of [Dagify](https://github.com/zacharygriffee/dagify). It provides a collection of reactive nodes for integrating with distributed data storage and streaming systems such as Hypercore and Autobase.

These nodes are designed to simplify the process of working with hypercore-based data sources in a reactive programming model. They manage lifecycle events, support hot swapping for dynamic updates, and offer a clean reactive interface for reading, updating, and querying data.

## Overview

The library includes, but is not limited to, the following reactive nodes:

- **Hypercore Nodes:**
    - *hypercoreNode*: Retrieves a hypercore instance from a corestore using reactive configuration.
    - *hypercoreLiveNode*: Provides a live, continuously updating stream from a hypercore with hot-swap support.
    - *hypercoreRangeNode*: Retrieves a range of data from a hypercore.
    - *hypercoreHeadNode* and *hypercoreLatestNode*: Retrieve specific data points from a hypercore.

- **Autobase Integration:**  
  An integration configuration that sets up a reactive workflow for applying updates, retrieving views, and managing host calls in an Autobase environment.

## Ongoing Development

This repository is under active development, with a focus on enabling a broader range of reactive hyper* tools. Future work will include:

- Expanded integrations for hypercore, Autobase, and related distributed data systems.
- Enhanced lifecycle management and resource cleanup strategies.
- More comprehensive tooling to enable dynamic, reactive workflows in decentralized applications.

For a detailed API reference and usage examples, please refer to the [docs section](docs).

## Contributing

Contributions, bug reports, and feature requests are welcome! If you have ideas or improvements, please feel free to submit an issue or pull request.

## License

This project is licensed under the MIT License.

---

This README provides a concise overview of the project and its ongoing development, while keeping the API details and examples in the separate documentation section.