import {createNode, createSinkNode} from "dagify";
import {from, fromEvent, take, takeUntil} from "rxjs";

const takeUntilStreamClose = socket => takeUntil(fromEvent(socket, "close").pipe(take(1)));

const streamReceiverNode = (socket, fn, config = {}) =>
    createNode(fn, from(socket).pipe(takeUntilStreamClose(socket)), config)

const streamTransmitterNode = (socket, deps, config = {}) => {
    const node = createSinkNode(x => socket.write(x), deps, config);
    socket.once("close", () => node.complete());
    return node;
}

export {
    streamTransmitterNode,
    streamReceiverNode
}