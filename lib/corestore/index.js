import {createShallowNode} from "dagify";

const corestore = createShallowNode();
const namespace = name => corestore.value.namespace(name);
const useCorestore = (store) => corestore.set(store);

export { useCorestore, corestore, namespace }