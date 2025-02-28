import {test, solo} from "brittle";
import RAM from "random-access-memory";
import Hypercore from "hypercore";
import {sleep} from "./helpers/sleep.js";
import {hypercoreLatestNode} from "../lib/hypercore/index.js";
import {createNode, createShallowNode, NO_EMIT} from "dagify";
import {hypercoreHeadNode} from "../lib/hypercore/hypercoreHeadNode.js";
import Corestore from "corestore";
import {useCorestore} from "../lib/corestore/index.js";
import {hypercoreNode} from "../lib/hypercore/hypercoreNode.js";
import {hypercoreRangeNode} from "../lib/hypercore/hypercoreRangeNode.js";
import {hypercoreLiveNode} from "../lib/hypercore/hypercoreLiveNode.js";

test("Hypercore latest", async t => {
    // Initialize a hypercore instance in RAM with utf8 encoding.
    const hypercore = new Hypercore(RAM, {valueEncoding: "utf8"});

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
    const hypercore = new Hypercore(RAM, {valueEncoding: "utf8"});

    // Create a reactive node that tracks the latest value from the hypercore,
    // but with an offset of -2. This means the node will only emit a value
    // when there are at least 2 entries in the core, and it will return the (length - 2)th entry.
    const coreNode = hypercoreLatestNode(hypercore, {offset: -2});

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

test("Hypercore head node", async t => {
    const hypercore = new Hypercore(RAM, {valueEncoding: "utf8"});
    await hypercore.append("hello");
    const head = hypercoreHeadNode(hypercore);
    await sleep();
    t.is(head.value, "hello", "head node should be 'hello'");
});

test("Hypercore range", async t => {
    const hypercore = new Hypercore(RAM, {valueEncoding: "utf8"});
    await hypercore.append(["hello", "world", "you", "are", "a", "rockstar"]);

// Create a range node starting at index 2 (i.e. "you") through the end of the hypercore.
    const rangeConfig = createNode({start: 2, end: hypercore.length});
    const range = hypercoreRangeNode(hypercore, rangeConfig);

    await sleep(10);
// Expect the range node to contain: ["you", "are", "a", "rockstar"]
    t.alike(range.value, ["you", "are", "a", "rockstar"], "range node should be ['you', 'are', 'a', 'rockstar']");

// Update the configuration to start at index 4 (i.e. "a").
    rangeConfig.update(config => ({...config, start: 4}));
    await sleep(10);
// Expect the range node to contain: ["a", "rockstar"]
    t.alike(range.value, ["a", "rockstar"], "range node should be ['a', 'rockstar']");
    rangeConfig.set({start: -3, end: -1});
    await sleep(10);
    t.alike(range.value, ["are", "a"], "negative ranges work");
});

test("Create hypercore live node and hotswapping", async t => {
    const hypercore = new Hypercore(RAM, {valueEncoding: "utf8"});
    const coreNode = createShallowNode(hypercore);
    const values = [];
    let completeCalled = false;
    const liveNode = hypercoreLiveNode(coreNode);
    liveNode.subscribe({
        next: value => {
            values.push(value);
        },
        complete: () => {
            completeCalled = true;
        },
        // error: e => t.fail("error occurred")
    });

    await hypercore.append("hello");
    await hypercore.append("world");
    await hypercore.append("!!!");
    await sleep(100);
    await hypercore.update();
    await hypercore.close();
    t.alike(values, ["hello", "world", "!!!"]);
    await sleep(100);
    const newHypercore = new Hypercore(RAM, {valueEncoding: "utf8"});
    coreNode.set(newHypercore);
    await newHypercore.append(["Hey...", "we're", "calling", "about", "your", "auto", "insurance"]);
    await sleep(30);
    liveNode.complete();
    await sleep(30);
    t.ok(completeCalled);
    t.is(liveNode.streamCount, 0);
    t.alike(values, ["hello", "world", "!!!", "Hey...", "we're", "calling", "about", "your", "auto", "insurance"])
    t.teardown(async () => {
        await hypercore.close();
        await newHypercore.close();
    });
});

test("Create hypercore from corestore", async t => {
    const corestore = new Corestore(RAM);
    let completeCalled = false;
    let coresClosed = 0;
    useCorestore(corestore);
    const coreNode = hypercoreNode({name: "hello", valueEncoding: "utf8"});
    coreNode.skip.subscribe({
        next: async core => {
            await core.append("hello");
            await core.append("world");
            core.once("close", () => coresClosed++);
        },
        complete: () => {
            completeCalled = true;
        }
    });
    const latest = hypercoreLatestNode(coreNode);
    await sleep(10);
    t.is(latest.value, "world", "latest node should be 'world'");
    coreNode.complete();
    latest.complete();
    await sleep();
    t.ok(completeCalled, "ensure that node completion also completes the subscriptions.");
    t.is(coresClosed, 1, "Only one core was created and thus closed.");
});

test("Create hypercore from corestore with hotswap", async t => {
    // Create a new corestore instance using an in-memory store.
    const corestore = new Corestore(RAM);

    // Track whether the subscription's complete callback has been called.
    let completeCalled = false;
    // Track the number of cores that have been closed.
    let coresClosed = 0;
    // Array to hold IDs of cores created during the test.
    let coreIds = [];

    // Register the corestore for use (assumes a global or contextual binding).
    useCorestore(corestore);

    // Create an initial configuration node with a name and value encoding.
    const config = createNode({ name: "hello", valueEncoding: "utf8" });

    // Create a hypercore node using the configuration.
    const coreNode = hypercoreNode(config);

    // Subscribe to the skip stream on the coreNode.
    // This subscription will be called for each new core created.
    coreNode.skip.subscribe({
        // For each new core, store its id, append a message, and register a close listener.
        next: async core => {
            coreIds.push(core.id);
            await core.append(`hello world from this core: ${core.id}`);
            // Increment the counter when the core is closed.
            core.once("close", () => coresClosed++);
        },
        // When the subscription completes, set the flag.
        complete: () => completeCalled = true
    });

    // Create a node that provides access to the latest core value.
    const latest = hypercoreLatestNode(coreNode);

    // Wait a bit for the first core to initialize and the message to be appended.
    await sleep(10);

    // Check that the latest value matches the expected message from the first core.
    t.is(latest.value, `hello world from this core: ${coreIds[0]}`, "Initial core value should match appended message.");

    // Update the config to trigger a hotswap (assumes update triggers a new core creation).
    config.update(config => ({ ...config, name: "coolBeans" }));

    // Wait for the new core to be created and processed.
    await sleep();

    // Validate that the latest core now holds the new message from the second core.
    t.is(latest.value, `hello world from this core: ${coreIds[1]}`, "Updated core value should match new appended message.");

    // Complete the core node and the latest node to trigger their cleanup routines.
    coreNode.complete();
    latest.complete();

    // Wait briefly to ensure all cleanup is processed.
    await sleep();

    // Verify that the complete callback in the subscription was called.
    t.ok(completeCalled, "Ensure that node completion also completes the subscriptions.");
    t.is(coresClosed, 2, "Both cores should have been closed. When you close the node responsible for the creation of the hypercore, it closes all of them");
});

