import {createNode, ensureNode} from "dagify";

const hypercoreHeadNode = (core, { offset = 0, ...coreConfig } = {}) =>
    createNode((core) => core.get(offset, coreConfig), ensureNode(core, {shallow: true}));

export { hypercoreHeadNode };