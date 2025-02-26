import {filter, fromEvent, of, switchMap, take, takeUntil} from "rxjs";
import {NO_EMIT} from "dagify";

export const hypercoreOnAppend = (core, config = {}) =>
    fromEvent(core, "append").pipe(
        switchMap(() => {
                const i = core.length + (config.offset ?? -1);
                if (i < 0) return of(NO_EMIT);
                return core.get(
                    i,
                    {wait: false, ...config.coreConfig}
                );
            }
        ),
        filter(o => o != null),
        takeUntil(fromEvent(core, "close").pipe(take(1)))
    );