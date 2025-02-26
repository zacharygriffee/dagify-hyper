import {trigger} from "dagify";
import {defer} from "rxjs";

export const hypercoreReadyTrigger = core =>
    trigger(defer(() => core.ready()));