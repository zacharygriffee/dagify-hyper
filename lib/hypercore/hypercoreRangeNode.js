import {createNode, ensureNode} from "dagify";
import {defer, toArray} from "rxjs";


const hypercoreRangeNode = (core, range = {}) =>
    createNode(({ core, range }) => {
        let { start, end = core.length } = range;

        // If start is negative, interpret it as an offset from core.length
        if (start < 0) {
            start = core.length + start;
        }
        // If end is negative, interpret it as an offset from core.length
        if (end < 0) {
            end = core.length + end;
        }

        return defer(() => core.createReadStream({ ...range, start, end, live: false })).pipe(toArray());
    }, {
            core: ensureNode(core),
            range: range
        });

export { hypercoreRangeNode }