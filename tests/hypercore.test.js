import { test, solo } from "brittle";
import RAM from "random-access-memory";
import Hypercore from "hypercore";
import {sleep} from "./helpers/sleep.js";
import {hypercoreLatestNode} from "../lib/hypercore/index.js";
import {NO_EMIT} from "dagify";

test("Hypercore latest", async t => {
    // Initialize a hypercore instance in RAM with utf8 encoding.
    const hypercore = new Hypercore(RAM, { valueEncoding: "utf8" });

    // Create a reactive node that tracks the latest value from the hypercore.
    const coreNode = hypercoreLatestNode(hypercore);

    // Append "hello" to the hypercore and allow a tick for propagation.
    await hypercore.append("hello");
    await sleep(0);

    // Verify that the reactive node's value has updated to "hello".
    t.is(coreNode.value, "hello", "coreNode.value should be 'hello' after first append");

    // Append "world" to the hypercore and wait for the update to propagate.
    await hypercore.append("world");
    await sleep(0);

    // Verify that the reactive node's value has updated to "world".
    t.is(coreNode.value, "world", "coreNode.value should be 'world' after second append");

    // Complete the reactive node to trigger cleanup.
    coreNode.complete();

    // Close the hypercore to release resources.
    await hypercore.close();

    // Ensure that no lingering 'append' event listeners remain.
    t.is(hypercore.listenerCount("append"), 0, "Hypercore should have zero 'append' listeners after cleanup");
});

test("Hypercore latest with offset", async t => {
    // Initialize a hypercore instance in RAM with utf8 encoding.
    const hypercore = new Hypercore(RAM, { valueEncoding: "utf8" });

    // Create a reactive node that tracks the latest value from the hypercore,
    // but with an offset of -2. This means the node will only emit a value
    // when there are at least 2 entries in the core, and it will return the (length - 2)th entry.
    const coreNode = hypercoreLatestNode(hypercore, { offset: -2 });

    // Append "hello" to the hypercore. Since the core length is now 1,
    // the offset (-2) cannot be satisfied, so we expect NO_EMIT.
    await hypercore.append("hello");
    await sleep(0);
    t.ok(coreNode.value === NO_EMIT, "With core length 1, offset -2 yields NO_EMIT");

    // Append "world" to the hypercore. The core length is now 2, so the node
    // should emit the value at index: Math.max(0, 2 + (-2)) = 0, which is "hello".
    await hypercore.append("world");
    await sleep(0);
    t.is(coreNode.value, "hello", "With core length 2, offset -2 yields the first entry ('hello')");

    // Complete the reactive node to trigger cleanup.
    coreNode.complete();

    // Close the hypercore to release resources.
    await hypercore.close();

    // Ensure that no lingering 'append' event listeners remain on the hypercore.
    t.is(hypercore.listenerCount("append"), 0, "Hypercore should have zero 'append' listeners after cleanup");
});
