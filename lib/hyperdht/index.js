import {createComposite, createNode, createShallowNode, diffOperator} from "dagify";
import b4a from "b4a";
import {map} from "rxjs";

const createDHTServer = (dht, {keyPair, ...config} = {}) => {
    const allConnections = createComposite([]);
    const server = dht.createServer(config, socket => {
        const node = createShallowNode(socket);
        allConnections.addNodes(node);
        socket.once("error", e => node.error(e));
        socket.once("close", () => allConnections.removeNodes(node));
    });
    const listening = server.listen(keyPair)
    server.once("close", () => allConnections.complete());
    return {
        connections: allConnections.pipe(
            diffOperator({initial: false, eq: b4a.equals}),
            map(({new: newSockets, del: disconnectedSockets, same: currentSockets}) => ({newSockets, currentSockets, disconnectedSockets}))
        ),
        close: () => {
            allConnections.complete();
            return server.close()
        },
        server,
        listening
    }
}

const createDHTClient = (dht, publicKey, {nodes, keyPair} = {}) => {
    const client = dht.connect(publicKey, { nodes, keyPair });
    const node = createNode();
    client.once("open", () => node.set(client));
    client.once("error", e => node.error(e));
    client.once("close", () => node.complete());
    return {
        connection: node,
        client,
        close: () => client.close()
    }
}

export { createDHTClient, createDHTServer }