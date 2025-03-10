import { createNode, ensureNode, NO_EMIT } from "dagify";
import { corestore as globalCorestore } from "../corestore/index.js";

/**
 * Creates a ReactiveNode that retrieves a hypercore from a corestore using the provided configuration.
 *
 * The configuration object must include either a `name` or a `key` (but not both) to identify the core.
 * Optionally, a custom corestore can be supplied as the `corestore` property; if omitted, the global corestore is used.
 *
 * When the configuration changes and a new core is returned, then:
 * - If `config.hotswap` is true (the default), the old core is closed immediately.
 * - If `config.hotswap` is false, previously created cores remain open until the node completes.
 *
 * @param {Object} [config={}] - Configuration options for retrieving the core.
 * @param {boolean} [config.hotswap=true] - Whether to hot swap cores (i.e. close the old one when a new core is obtained).
 * @param {string} [config.name] - The name used to identify the core (mutually exclusive with `config.key`).
 * @param {*} [config.key] - The key used to identify the core (mutually exclusive with `config.name`).
 * @param {Corestore|ReactiveNode} [config.corestore] - An optional corestore from which to retrieve cores. If not provided, the global corestore is used.
 * @returns {ReactiveNode} A node that yields the hypercore.
 * @throws {Error} If the configuration is invalid (i.e. if neither or both of `name` and `key` are provided)
 *                 or if no valid corestore is available.
 */
const hypercoreNode = (config = {}) => {
    let lastCore = null;
    let coresCreated = []; // Keep track of all cores created

    return createNode(
        async ({ corestore = globalCorestore?.value, ...config }) => {
            // Validate that exactly one of config.name or config.key is provided.
            if (
                !config ||
                (!config.name && !config.key) ||
                (config.name && config.key)
            ) {
                return NO_EMIT;
            }
            if (!corestore) return NO_EMIT;
            const newCore = corestore.get(config);
            // Hot-swap: if there is a previous core and it's different from the new one…
            if (lastCore && lastCore !== newCore) {
                if (config.hotswap !== false) {
                    // Hot-swap enabled (default): immediately close the old core.
                    lastCore.close();
                    // Remove the old core from our list.
                    coresCreated = coresCreated.filter(core => core !== lastCore);
                }
                // If hot-swap is disabled, simply accumulate cores.
            }
            lastCore = newCore;
            coresCreated.push(newCore);
            await newCore.ready();
            return newCore;
        },
        config,
        {
            skip: 1,
            onCleanup: () => {
                // When the node is cleaned up, close all cores that were created.
                let core;
                while ((core = coresCreated.pop())) {
                    core.close();
                }
            }
        }
    );
};

export { hypercoreNode };
