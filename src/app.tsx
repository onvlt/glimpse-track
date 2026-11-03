import { Box, Button, Indicator, Placeholder, Popover, Readout, Row, Section, copy } from "glimpse-sdk";
import { useEffect, useOptions, usePlacement, useState } from "glimpse-sdk";

const ICON = "alarm-symbolic";
const NAME = "Stopwatch";

export type StopwatchState = "idle" | "running" | "paused";

export type Lap = {
    /** Number of the lap, starting at 1. */
    id: number;
    /** Time of this lap alone, in milliseconds. */
    split: number;
    /** Total time since the first start, in milliseconds. */
    total: number;
};

export type Stopwatch = {
    state: StopwatchState;
    /** Elapsed time in milliseconds at the moment the clock last stopped. */
    base: number;
    /** Timestamp of the moment the clock last started, or 0 while not running. */
    started: number;
    laps: Lap[];
};

export function initialStopwatch(): Stopwatch {
    return { state: "idle", base: 0, started: 0, laps: [] };
}

/** Elapsed time in milliseconds; `now` only matters while running. */
export function elapsed(sw: Stopwatch, now: number): number {
    return sw.state === "running" ? sw.base + (now - sw.started) : sw.base;
}

export function startOrPause(sw: Stopwatch, now: number): Stopwatch {
    if (sw.state === "running") {
        return { ...sw, state: "paused", base: sw.base + (now - sw.started), started: 0 };
    }
    return { ...sw, state: "running", started: now };
}

export function resetStopwatch(): Stopwatch {
    return initialStopwatch();
}

export function addLap(sw: Stopwatch, now: number): Stopwatch {
    if (sw.state !== "running") return sw;
    const total = elapsed(sw, now);
    const split = total - (sw.laps[sw.laps.length - 1]?.total ?? 0);
    return { ...sw, laps: [...sw.laps, { id: sw.laps.length + 1, split, total }] };
}

/** Format milliseconds as `h:mm:ss.x` once an hour is involved and `m:ss.x` otherwise. */
export function formatTime(ms: number, showFraction = true): string {
    const bounded = Math.max(0, ms);
    const whole = Math.floor(bounded / 1000);
    const fraction = Math.floor((bounded % 1000) / 100);
    const hours = Math.floor(whole / 3600);
    const minutes = Math.floor((whole % 3600) / 60);
    const seconds = whole % 60;
    const pad = (value: number) => String(value).padStart(2, "0");
    const fractionText = showFraction ? `.${fraction}` : "";
    return hours > 0
        ? `${hours}:${pad(minutes)}:${pad(seconds)}${fractionText}`
        : `${minutes}:${pad(seconds)}${fractionText}`;
}

/** The `Readout` split: value without the trailing fraction, unit carrying the fraction digit. */
export function splitTime(ms: number): { value: string; unit: string | undefined } {
    const text = formatTime(ms);
    const dot = text.lastIndexOf(".");
    if (dot === -1) return { value: text, unit: undefined };
    return { value: text.slice(0, dot), unit: text.slice(dot + 1) };
}

/** Options are untrusted input: only accept a string short enough to show. */
export function configuredName(options: Record<string, unknown>, fallback: string): string {
    const value = options.name;
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    return trimmed === "" ? fallback : trimmed.slice(0, 64);
}

/** Re-renders the component five times a second while `running`, and not at all otherwise. */
function useTicker(running: boolean): void {
    const [, setTick] = useState(0);
    useEffect(() => {
        if (!running) return;
        const timer = setInterval(() => setTick((t) => t + 1), 100);
        return () => clearInterval(timer);
    }, [running]);
}

export function StopwatchApp() {
    const options = useOptions();
    const placement = usePlacement();
    const vertical = placement?.orientation === "vertical";
    const title = configuredName(options, NAME);

    const [watch, setWatch] = useState<Stopwatch>(initialStopwatch);

    const running = watch.state === "running";
    useTicker(running);

    const current = elapsed(watch, Date.now());
    const readout = splitTime(current);
    const paused = watch.state === "paused" && watch.base > 0;

    return (
        <>
            <Indicator
                icon={ICON}
                tooltip={running ? `${title}: ${formatTime(current, false)}` : title}
                dot={running ? "#3584e4" : undefined}
            >
                {vertical || watch.state === "idle" ? null : formatTime(current, false)}
            </Indicator>
            <Popover
                icon={ICON}
                title={title}
                subtitle={running ? "Running" : watch.state === "paused" ? "Paused" : "Ready"}
            >
                <Section>
                    <Readout value={readout.value} unit={readout.unit} className="numeric" />
                    <Box spacing={6} halign="center" valign="center">
                        <Button
                            icon={running ? "media-playback-pause-symbolic" : "media-playback-start-symbolic"}
                            text={running ? "Pause" : paused ? "Resume" : "Start"}
                            tooltip={running ? "Pause the stopwatch" : "Start the stopwatch"}
                            onClick={() => setWatch((w) => startOrPause(w, Date.now()))}
                        />
                        <Button
                            icon="emoji-flags-symbolic"
                            text="Lap"
                            tooltip="Record a lap"
                            sensitive={running}
                            onClick={() => setWatch((w) => addLap(w, Date.now()))}
                        />
                        <Button
                            icon="view-refresh-symbolic"
                            text="Reset"
                            tooltip={paused ? "Reset the stopwatch" : "Pause or stop before resetting"}
                            sensitive={paused}
                            onClick={() => setWatch(resetStopwatch)}
                        />
                        <Button
                            icon="edit-copy-symbolic"
                            text="Copy laps"
                            tooltip="Copy every lap split"
                            sensitive={watch.laps.length > 0}
                            onClick={() => copy(watch.laps.map((lap) => formatTime(lap.split)).join("\n"))}
                        />
                    </Box>
                </Section>
                <Section title="Laps" count={String(watch.laps.length)}>
                    {watch.laps.length === 0 ? (
                        <Placeholder icon={ICON} title="No laps" description="Recorded laps show up here" />
                    ) : (
                        [...watch.laps]
                            .reverse()
                            .map((lap) => (
                                <Row
                                    key={lap.id}
                                    title={`Lap ${lap.id}`}
                                    subtitle={formatTime(lap.split)}
                                    value={formatTime(lap.total)}
                                    typography="numeric"
                                />
                            ))
                    )}
                </Section>
            </Popover>
        </>
    );
}
