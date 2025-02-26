import {createNode} from "dagify";
import {hypercoreOnAppend} from "./hypercoreOnAppend.js";
import {hypercoreReadyTrigger} from "./hypercoreReadyTrigger.js";

/**
 * Creates a reactive node that tracks the latest value in a hypercore.
 *
 * This node updates its value when the hypercore emits an "append" event or when the core becomes ready.
 * It retrieves the value from the hypercore based on the specified offset. For example, an offset of -1
 * will retrieve the last appended item.
 *
 * @param {Hypercore} core - The hypercore instance from which to retrieve data.
 * @param {Object} [options={}] - Configuration options.
 * @param {number} [options.offset=-1] - The offset to apply to the hypercore length when retrieving the value.
 *        A negative offset indicates counting from the end (e.g., -1 for the last item).
 * @param {...*} [options.coreConfig] - Additional configuration options to be passed to the hypercoreOnAppend function.
 * @returns {ReactiveNode} A reactive node that emits the latest value from the hypercore.
 */
const hypercoreLatestNode = (core, { offset = -1, ...coreConfig } = {}) =>
    createNode(
        ([value]) => value,
        [
            hypercoreOnAppend(core, { coreConfig, offset }),
            hypercoreReadyTrigger(core)
        ]
    );

export {hypercoreLatestNode};