import {createNode} from "dagify";
import {hypercoreLatestNode} from "../hypercore/index.js";

/**
 * Creates an Autobase integration configuration using Dagify reactive nodes.
 *
 * This function sets up a series of reactive nodes to integrate an Autobase view into your application.
 * It creates:
 *
 * - An **applyNode** that captures updates, views, and hostcalls from the integration.
 * - A **viewNode** that holds the view retrieved from the store.
 * - A **viewLatestNode** that derives the latest view from the viewNode using hypercoreLatestNode.
 *
 * The returned configuration object includes methods to apply updates, open a store, and close the integration,
 * along with the created nodes for further composition.
 *
 * @param {Object} [options={}] - Configuration options for the Autobase integration.
 * @param {string} [options.viewName="view"] - The name of the view in the store to retrieve.
 * @param {Object} [options.autobaseConfig] - Additional configuration options for Autobase.
 * @param {*} [options.baseEncoding] - The encoding to use for the base hypercore.
 * @param {*} [options.viewEncoding] - The encoding to use for the view hypercore.
 * @returns {Object} An object containing:
 *   @property {Object} config - The integration configuration object with the following methods and properties:
 *     - **apply(updates, view, hostcalls):** Applies updates to the integration by setting the value of applyNode.
 *     - **open(store):** Opens a store, retrieves the view (using the provided viewName and viewEncoding),
 *       sets the viewNode, and returns the view.
 *     - **close():** Completes all reactive nodes (applyNode, viewNode, and viewLatestNode) to trigger cleanup.
 *     - **valueEncoding:** The base encoding used for the hypercore.
 *   @property {ReactiveNode} viewNode - A node that holds the view data from the store.
 *   @property {ReactiveNode} viewLatestNode - A node derived from viewNode that tracks the latest view.
 *   @property {ReactiveNode} applyNode - A node that receives and propagates updates, view, and hostcalls.
 */
const createAutobaseIntegration = ({
                                       viewName = "view",
                                       autobaseConfig,
                                       baseEncoding,
                                       viewEncoding
                                   } = {}) => {
    // Node to capture and propagate apply operations (updates, view, hostcalls)
    const applyNode = createNode();

    // Node to hold the current view retrieved from the store
    const viewNode = createNode();

    // Node that derives the latest view value from the viewNode using hypercoreLatestNode.
    const viewLatestNode = createNode(hypercoreLatestNode, viewNode);

    const config = {
        /**
         * Applies updates to the integration.
         * @param {*} updates - The updates to be applied.
         * @param {*} view - The current view.
         * @param {*} hostcalls - Host-specific calls or actions.
         */
        apply(updates, view, hostcalls) {
            applyNode.set({ updates, view, hostcalls });
        },
        /**
         * Opens a store and retrieves the view.
         * @param {Object} store - The store from which to get the view.
         * @returns {*} The view retrieved from the store.
         */
        open(store) {
            const view = store.get({ name: viewName, valueEncoding: viewEncoding });
            viewNode.set(view);
            return view;
        },
        /**
         * Closes the integration, completing all reactive nodes for proper cleanup.
         */
        close() {
            applyNode.complete();
            viewNode.complete();
            viewLatestNode.complete();
        },
        valueEncoding: baseEncoding,
        ...autobaseConfig
    };

    return { config, viewNode, viewLatestNode, applyNode };
};

export { createAutobaseIntegration };
