import { createNode, ensureNode, NO_EMIT } from "dagify";
import { defer, toArray } from "rxjs";

/**
 * Creates a ReactiveNode that retrieves an array of values from a hypercore over a specified range.
 *
 * The node emits the range of values from the hypercore by creating a read stream (with `live: false`)
 * and collecting the output into an array. The range is defined via the `range` property in the configuration.
 *
 * **Reactive Configuration:**
 * - If the supplied configuration is reactive (i.e. `config.isDagifyNode` is true), the hypercore may be
 *   set later on the reactive config.
 * - Otherwise, a hypercore must be supplied immediately via `config.hypercore` (either as a reactive node
 *   or a valid hypercore instance). If not already reactive, it will be wrapped using `ensureNode` with shallow options.
 *
 * **Range Calculation:**
 * - `start` and `end` define the range of indices to read from.
 * - Negative values for `start` or `end` are interpreted as offsets from the current hypercore length.
 * - By default, if `end` is not provided, it defaults to `hypercore.length`.
 *
 * @param {Object} [config={}] - Configuration options.
 * @param {Hypercore|ReactiveNode} [config.hypercore] - The hypercore instance or reactive node wrapping it.
 *   *Required if the configuration is not already reactive.* If omitted in a reactive configuration,
 *   the hypercore may be supplied later.
 * @param {Object} [config.range={}] - An object specifying the range of values to retrieve.
 * @param {number} [config.range.start] - The starting index of the range. If negative, treated as an offset from hypercore.length.
 * @param {number} [config.range.end] - The ending index (exclusive) of the range. If negative, treated as an offset from hypercore.length.
 *   Defaults to hypercore.length.
 * @returns {ReactiveNode} A node that emits an array containing the values from the specified range of the hypercore.
 * @throws {Error} If the configuration is non-reactive and no hypercore is supplied via `config.hypercore`.
 */
const hypercoreRangeNode = (config = {}) => {
    if (!config.isDagifyNode) {
        if (!config.hypercore) {
            throw new Error("A hypercore must be supplied via config.hypercore (either as a reactive node or a valid hypercore instance) to enable hot swapping.");
        }
        if (!config?.hypercore?.isDagifyNode) {
            config.hypercore = ensureNode(config.hypercore, { shallow: true });
        }
    }
    return createNode(({ hypercore, range = {} }) => {
        if (!hypercore) return NO_EMIT;
        let { start, end = hypercore.length } = range;

        // Interpret negative indices as offsets from hypercore.length.
        if (start < 0) {
            start = hypercore.length + start;
        }
        if (end < 0) {
            end = hypercore.length + end;
        }

        return defer(() =>
            hypercore.createReadStream({ ...range, start, end, live: false })
        ).pipe(toArray());
    }, config);
};

export { hypercoreRangeNode };
