import {createNode, ensureNode, NO_EMIT} from "dagify";
import {Subject, defer, concat, of, iif} from "rxjs";
import {takeUntil, switchMap, map} from "rxjs/operators";
import {hypercoreOnAppend} from "./hypercoreOnAppend.js";

/**
 * Creates a reactive node that emits the latest value from a hypercore.
 *
 * This node will not emit any value until a valid hypercore is supplied via the configuration.
 * When a hypercore is provided, the node waits for the hypercore to become ready, then retrieves
 * the last value using `hypercore.get`. It also listens for "append" events via `hypercoreOnAppend`
 * to update the latest value in real time.
 *
 * If the supplied hypercore changes (i.e. a new hypercore is provided), the node stops previous
 * subscriptions (via an internal stop$ subject) before switching to the new hypercore.
 *
 * The configuration object can include:
 * - **hypercore**: A hypercore instance or a reactive node wrapping a hypercore. If not already
 *   reactive, it is wrapped using `ensureNode` with shallow options.
 * - **offset** (default: -1): The offset used to determine which element to retrieve from the hypercore.
 *   A negative offset (e.g. -1) indicates the last element.
 * - **coreConfig**: Additional options to pass to the hypercore triggers.
 *
 * @param {Object} [config={}] - Configuration options.
 * @param {Hypercore|ReactiveNode} [config.hypercore] - The hypercore instance (or reactive wrapper)
 *   to observe. The node will not emit until this property is supplied.
 * @param {number} [config.offset=-1] - The offset for retrieving the latest value.
 * @param {Object} [config.coreConfig] - Additional configuration options for the hypercore get and append triggers.
 * @returns {ReactiveNode} A reactive node that emits the latest value from the hypercore.
 */
const hypercoreLatestNode = (config = {}) => {
    if (!config.isDagifyNode) {
        if (!config.hypercore) {
            throw new Error("A hypercore must be supplied via config.hypercore (either as a reactive node or a valid hypercore instance) to enable hot swapping.");
        }
        if (!config?.hypercore?.isDagifyNode) {
            config.hypercore = ensureNode(config.hypercore, {shallow: true});
        }
    }
    const stop$ = new Subject();
    let lastCore;
    return createNode(
        ({hypercore, offset = -1, ...coreConfig} = {}) => {
            if (!hypercore) return NO_EMIT;
            if (lastCore && lastCore !== hypercore) stop$.next(null);
            lastCore = hypercore;
            return createNode(([value]) => value, [
                concat(
                    defer(() => hypercore.ready()).pipe(
                        takeUntil(stop$),
                        switchMap(() =>
                            iif(
                                () => hypercore.length > 0,
                                defer(() => hypercore.get(hypercore.length + offset, {wait: false, ...coreConfig})),
                                of(null)
                            )
                        ),
                        map((value) => value ?? NO_EMIT)
                    ),
                    hypercoreOnAppend(hypercore, {coreConfig, offset}).pipe(takeUntil(stop$))
                )
            ]);
        },
        config,
        {
            finalize: () => {
                stop$.next(null);
                stop$.complete();
            }
        }
    );
};

export {hypercoreLatestNode};
