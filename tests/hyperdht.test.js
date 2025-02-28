import HyperDHT from "hyperdht";
import { test, solo } from "brittle";
import {createDHTClient, createDHTServer} from "../lib/hyperdht/index.js";
import b4a from "b4a";
import {map, mergeAll, take} from "rxjs";

const testKeys = HyperDHT.keyPair();
//
// solo("Basic", async t => {
//     t.plan(2);
//     const dht = new HyperDHT();
//     const { connections, listening } = createDHTServer(dht, {keyPair: testKeys});
//
//     const sub = connections.pipe(map(({newSockets}) => newSockets), mergeAll(), mergeAll()).subscribe({
//         next: data => {
//             t.is(`${data}`, "Hello");
//             sub.complete();
//         },
//         complete: () => t.pass("Complete was called")
//     });
//
//     await listening;
//
//     const { connection } = createDHTClient(dht, testKeys.publicKey);
//
//     connection.subscribe(stream => {
//         stream.write(b4a.from("Hello"))
//     })
//
//     t.teardown(() => {
//         connections.complete();
//         connection.complete();
//         sub.unsubscribe();
//         dht.destroy();
//     });
// });