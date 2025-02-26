import { test } from "brittle";
import RAM from "random-access-memory";
import Corestore from "corestore";
import Autobase from "autobase";
import {createNode} from "dagify";
import {sleep} from "./helpers/sleep.js";
import {createAutobaseIntegration} from "../lib/autobase/index.js";

test("basic", async t => {
    const { config, viewLatestNode, applyNode } = createAutobaseIntegration({viewEncoding: "utf8", baseEncoding: "utf8"})
    const corestore = new Corestore(RAM.reusable());
    const base = new Autobase(corestore, config);

    createNode(
        async ({updates, view, hostcalls}) => {
            for await (const {value} of updates) {
                await view.append(value + " poke");
            }
        },
        applyNode
    );

    await base.append("hello");
    await base.close();
    await sleep(0);
    t.is(viewLatestNode.value, "hello poke");
})