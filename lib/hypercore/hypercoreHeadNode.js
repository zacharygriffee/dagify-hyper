import {createNode, ensureNode, NO_EMIT} from "dagify";

/**
 * Creates a ReactiveNode that retrieves a specific value from a hypercore at a given offset.
 *
 * The node obtains a value from the hypercore using the provided offset and any additional options
 * specified in the configuration (passed as `coreConfig`). The hypercore must be supplied via the
 * `config.hypercore` property, either as a reactive node or as a valid hypercore instance. If it is not
 * already reactive, it is wrapped using `ensureNode` with shallow options.
 *
 * **Usage Note:**
 * The offset is used directly in the hypercore's `get` method. For example, an offset of `0` retrieves
 * the first element, while other offsets retrieve the corresponding element from the hypercore.
 *
 * @param {Object} [config={}] - Configuration options for retrieving the hypercore value.
 * @param {Hypercore|ReactiveNode} config.hypercore - The hypercore instance or a reactive node wrapping it.
 *   This property is required. An error is thrown if it is not supplied.
 * @param {number} [config.offset=0] - The offset at which to retrieve the value from the hypercore.
 * @param {Object} [config.coreConfig] - Additional options to pass to the hypercore's `get` method.
 * @returns {ReactiveNode} A node that emits the value obtained from the hypercore at the specified offset.
 * @throws {Error} If no hypercore is supplied via `config.hypercore`.
 */
const hypercoreHeadNode = (config = {}) => {
    if (!config.isDagifyNode) {
        if (!config.hypercore) {
            throw new Error("A hypercore must be supplied via config.hypercore (either as a reactive node or a valid hypercore instance) to enable hot swapping.");
        }
        if (!config?.hypercore?.isDagifyNode) {
            config.hypercore = ensureNode(config.hypercore, {shallow: true});
        }
    }

    return createNode(({hypercore, offset = 0, ...coreConfig} = {}) => {
            if (!hypercore) return NO_EMIT;
            return hypercore.get(offset, coreConfig);
        },
        config
    );
};

export {hypercoreHeadNode};
