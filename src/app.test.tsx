import assert from "node:assert/strict";
import { test } from "node:test";
import { render } from "glimpse-sdk/testing";
import {
    addLap,
    configuredName,
    elapsed,
    formatTime,
    initialStopwatch,
    resetStopwatch,
    splitTime,
    startOrPause,
    // The component is aliased because esbuild's tree shaker can drop a
    // component whose import name equals its exported name when several
    // top-level test() calls bundle together.
    StopwatchApp as SW,
    type Stopwatch,
} from "./app.tsx";

type Node = { id: number; type: string; props: Record<string, unknown>; children?: Node[] };
type Element = Parameters<typeof render>[0];

function find(node: Node, type: string): Node | undefined {
    if (node.type === type) return node;
    for (const child of node.children ?? []) {
        const hit = find(child, type);
        if (hit) return hit;
    }
    return undefined;
}

function findAll(node: Node, type: string, into: Node[] = []): Node[] {
    if (node.type === type) into.push(node);
    for (const child of node.children ?? []) findAll(child, type, into);
    return into;
}

function settle(ms = 10): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Starts the clock and lets a little time pass, so the elapsed time is above zero. */
async function runningStopwatch(): Promise<Stopwatch> {
    const sw = startOrPause(initialStopwatch(), Date.now());
    await settle();
    return sw;
}

test("formats times", () => {
    assert.equal(formatTime(0), "0:00.0");
    assert.equal(formatTime(41_000), "0:41.0");
    assert.equal(formatTime(123_400), "2:03.4");
    assert.equal(formatTime(123_400, false), "2:03");
    assert.equal(formatTime(3_602_345), "1:00:02.3");
    assert.equal(formatTime(-50), "0:00.0");
});

test("splits the readout", () => {
    assert.deepEqual(splitTime(123_400), { value: "2:03", unit: "4" });
    assert.deepEqual(splitTime(0), { value: "0:00", unit: "0" });
});

test("measures elapsed time from the start timestamp", async () => {
    const sw = startOrPause(initialStopwatch(), Date.now());
    await settle(30);
    const shown = elapsed(sw, Date.now());
    assert.equal(sw.state, "running");
    assert.ok(shown >= 15, `elapsed should cover the pause, got ${shown}`);
    assert.ok(shown < 5_000, `elapsed should be small, not wall-clock time, got ${shown}`);
});

test("a paused watch freezes the elapsed time", async () => {
    let sw = startOrPause(initialStopwatch(), Date.now());
    await settle(15);
    sw = startOrPause(sw, Date.now());
    assert.equal(sw.state, "paused");
    assert.equal(elapsed(sw, Date.now()), elapsed(sw, Date.now() + 100));
    assert.ok(elapsed(sw, 0) >= 5);
});

test("resuming counts from the previous total", async () => {
    let sw = startOrPause(initialStopwatch(), Date.now());
    await settle(15);
    sw = startOrPause(sw, Date.now());
    await settle(15);
    sw = startOrPause(sw, Date.now());
    await settle(15);
    sw = startOrPause(sw, Date.now());
    // The first segment counts; the paused gap and the fresh segment are both
    // visible in the total.
    const total = elapsed(sw, Date.now());
    assert.ok(total >= 25, `elapsed should carry the first segment over, got ${total}`);
});

test("laps record splits and totals", async () => {
    const sw = await runningStopwatch();
    const first = addLap(sw, Date.now());
    assert.equal(first.state, "running");
    assert.equal(first.laps.length, 1);
    assert.ok(first.laps[0].total > 0, "the first lap has a positive total");
    await settle(20);
    const second = addLap(first, Date.now());
    assert.equal(second.laps.length, 2);
    assert.ok(second.laps[1].total > second.laps[0].total);
    assert.ok(second.laps[1].split >= 10, `the second lap covers the pause, got ${second.laps[1].split}`);
    assert.equal(second.laps[0].split, second.laps[0].total);
});

test("laps only work while running, reset returns to idle", () => {
    const idle = initialStopwatch();
    assert.equal(addLap(idle, Date.now()).laps.length, 0);
    const after = resetStopwatch();
    assert.equal(after.state, "idle");
    assert.equal(elapsed(after, Date.now()), 0);
    assert.equal(after.laps.length, 0);
});

test("rejects a name option that is not a string and caps its length", () => {
    assert.equal(configuredName({}, "Stopwatch"), "Stopwatch");
    assert.equal(configuredName({ name: 42 }, "Stopwatch"), "Stopwatch");
    assert.equal(configuredName({ name: "   " }, "Stopwatch"), "Stopwatch");
    assert.equal(configuredName({ name: "Chrono" }, "Stopwatch"), "Chrono");
    assert.equal(configuredName({ name: "x".repeat(100) }, "Stopwatch"), "x".repeat(64));
});

test("renders an idle chip with empty laps", async () => {
    const app = await render((<SW />) as Element);
    try {
        const tree = app.tree() as Node;
        const indicators = findAll(tree, "indicator");
        assert.equal(indicators.length, 1);
        assert.ok(!indicators[0].props.text, "the idle chip shows no text");
        assert.equal(find(tree, "placeholder")?.props.title, "No laps");
        const readouts = findAll(tree, "readout");
        assert.equal(readouts.length, 1);
        assert.equal(readouts[0].props.value, "0:00");
        assert.equal(readouts[0].props.unit, "0");
    } finally {
        await app.close();
    }
});

test("start, pause and reset move through the buttons", async () => {
    const app = await render((<SW />) as Element);
    try {
        const startButton = findAll(app.tree() as Node, "button")[0];
        assert.equal(startButton?.props.text, "Start");

        await app.click(startButton.id);
        await settle(15);
        const running = findAll(app.tree() as Node, "button");
        assert.equal(running[0]?.props.text, "Pause");
        assert.ok(!running[3]?.props.sensitive, "Copy laps is insensitive without laps");
        assert.ok(!running[2]?.props.sensitive, "Reset is insensitive while running");

        await app.click(running[0].id);
        await settle(15);
        const paused = findAll(app.tree() as Node, "button");
        assert.equal(paused[0]?.props.text, "Resume");
        assert.ok(paused[2]?.props.sensitive, "Reset is available while paused");

        await app.click(paused[2].id);
        await settle(15);
        const idle = findAll(app.tree() as Node, "button");
        assert.equal(idle[0]?.props.text, "Start");
        assert.ok(!idle[3]?.props.sensitive, "Copy laps stays insensitive after a reset");
    } finally {
        await app.close();
    }
});

test("laps appear in the popover", async () => {
    const app = await render((<SW />) as Element);
    try {
        const startButton = findAll(app.tree() as Node, "button")[0];
        await app.click(startButton.id);
        await settle(15);
        const lapButton = findAll(app.tree() as Node, "button")[1];
        await app.click(lapButton.id);
        await settle(15);
        await app.click(lapButton.id);
        await settle(15);

        const tree = app.tree() as Node;
        assert.equal(findAll(tree, "row").length, 2, "two laps are listed");
        const copyButton = findAll(tree, "button")[3];
        assert.equal(copyButton?.props.text, "Copy laps");
        assert.ok(copyButton?.props.sensitive);

        await app.click(startButton.id);
        await settle(15);
        assert.ok(findAll(app.tree() as Node, "button")[3]?.props.sensitive, "the laps outlive a pause");
    } finally {
        await app.close();
    }
});

test("a configured name replaces the popover title", async () => {
    const app = await render((<SW />) as Element, { options: { name: "Chrono" } });
    try {
        assert.equal(find(app.tree() as Node, "popover")?.props.title, "Chrono");
        await app.setOptions({ name: 42 });
        await settle(5);
        assert.equal(find(app.tree() as Node, "popover")?.props.title, "Stopwatch");
    } finally {
        await app.close();
    }
});
