import { createNode, ensureNode, NO_EMIT } from "dagify";
import { AsyncSubject, catchError, EMPTY, finalize, from, takeUntil } from "rxjs";

/**
 * Creates a live hypercore node.
 * When the core or configuration changes, if config.hotswap is true (default),
 * the old stream is destroyed and a new stream is created. Otherwise, the old stream(s)
 * remain open until the node itself completes.
 *
 * @param {Hypercore} core - The hypercore instance.
 * @param {Object} [config={}] - Configuration options.
 * @param {boolean} [config.hotswap=true] - Whether to hot swap the stream when the core changes.
 * @param {number} [config.length] - Optional length override for the stream's starting position.
 * @returns {ReactiveNode} A node that emits live data from the hypercore.
 */
const hypercoreLiveNode = (config = {}) => {
    if (!config.isDagifyNode) {
        if (!config.hypercore) {
            throw new Error("A hypercore must be supplied via config.hypercore (either as a reactive node or a valid hypercore instance) to enable hot swapping.");
        }
        if (!config?.hypercore?.isDagifyNode) {
            config.hypercore = ensureNode(config.hypercore, { shallow: true });
        }
    }
    let streamCount = 0;
    let lastCore;
    const cleanups = [];

    const node = createNode(
        // The computed function now receives both core and config as reactive values.
        ({ hypercore, config }) => {
            if (!hypercore) return NO_EMIT;
            // Extract the reactive config option (hotswap) so that if the config changes, it is applied.
            const currentHotswap = config?.hotswap !== false;
            // If the core has changed and hot swapping is enabled in the current config, clean up any existing streams.
            if (lastCore !== hypercore && currentHotswap) {
                cleanups.forEach(fn => fn());
                cleanups.length = 0;
            }
            lastCore = hypercore;
            // Create a new live read stream, using the current config.
            const stream = hypercore.createReadStream({
                ...config,
                live: true,
                start: config?.length ?? hypercore.length
            });
            const close$ = new AsyncSubject();
            cleanups.push(() => {
                close$.next();
                close$.complete();
                stream.destroy();
            });
            streamCount++;
            return from(stream).pipe(
                takeUntil(close$),
                finalize(() => streamCount--),
                catchError(() => EMPTY)
            );
        },
        config,
        {
            skip: 1,
            finalize: () => cleanups.forEach(fn => fn())
        }
    );

    Object.defineProperty(node, "streamCount", {
        get() {
            return streamCount;
        }
    });

    return node;
};

export { hypercoreLiveNode };
