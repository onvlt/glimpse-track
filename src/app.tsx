import {
    ActionRow,
    Box,
    Button,
    EntryRow,
    ExpanderRow,
    Indicator,
    Placeholder,
    Popover,
    Readout,
    Section,
    usePersistentState,
} from "glimpse-sdk";
import { useEffect, useOptions, usePlacement, useState } from "glimpse-sdk";
import * as model from "./state";

const ICON = "alarm-symbolic";
const NAME = "Stopwatch";

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
export function splitTime(ms: number): {
    value: string;
    unit: string | undefined;
} {
    const text = formatTime(ms);
    const dot = text.lastIndexOf(".");
    if (dot === -1) return { value: text, unit: undefined };
    return { value: text.slice(0, dot), unit: text.slice(dot + 1) };
}

/** Options are untrusted input: only accept a string short enough to show. */
export function configuredName(
    options: Record<string, unknown>,
    fallback: string,
): string {
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

    const [watch, setWatch] = usePersistentState<model.Stopwatch>(
        "stopwatch",
        model.initial(),
    );

    const running = watch.state === "running";
    useTicker(running);

    const current = model.getElapsed(watch, Date.now());
    const readout = splitTime(current);
    const paused = watch.state === "paused" && watch.totalElapsed > 0;
    const canAddRecord =
        watch.state === "running" ||
        (watch.state === "paused" && watch.totalElapsed > 0);

    return (
        <>
            <Indicator
                icon={ICON}
                tooltip={
                    running ? `${title}: ${formatTime(current, false)}` : title
                }
                dot={running ? "#3584e4" : undefined}
            >
                {vertical || watch.state === "idle"
                    ? null
                    : formatTime(current, false)}
            </Indicator>
            <Popover
                icon={ICON}
                title={title}
                subtitle={
                    running
                        ? "Running"
                        : watch.state === "paused"
                          ? "Paused"
                          : "Ready"
                }
            >
                <Section>
                    <Box valign="fill" spacing={6}>
                        <Readout
                            value={readout.value}
                            unit={readout.unit}
                            className="numeric"
                        />
                        <Box spacing={6} halign="end" valign="center" hexpand>
                            <Button
                                icon={
                                    running
                                        ? "media-playback-pause-symbolic"
                                        : "media-playback-start-symbolic"
                                }
                                text={
                                    running
                                        ? "Pause"
                                        : paused
                                          ? "Resume"
                                          : "Start"
                                }
                                tooltip={
                                    running
                                        ? "Pause the stopwatch"
                                        : "Start the stopwatch"
                                }
                                onClick={() =>
                                    setWatch((w) =>
                                        model.toggleRunning(w, Date.now()),
                                    )
                                }
                            />
                            <Button
                                icon="view-refresh-symbolic"
                                text="Reset"
                                tooltip={
                                    paused
                                        ? "Reset the stopwatch"
                                        : "Pause or stop before resetting"
                                }
                                sensitive={paused}
                                onClick={() => setWatch(model.reset)}
                            />

                            <Button
                                icon="plus-symbolic"
                                tooltip="Add record"
                                sensitive={canAddRecord}
                                onClick={() =>
                                    setWatch((w) =>
                                        model.addRecord(w, Date.now()),
                                    )
                                }
                            />
                        </Box>
                    </Box>
                    <EntryRow
                        placeholder="What are you working on?"
                        value={watch.description ?? ""}
                        onChange={(value) =>
                            setWatch((w) => model.setDescription(w, value))
                        }
                        onSubmit={() => {
                            if (canAddRecord) {
                                setWatch((w) => model.addRecord(w, Date.now()));
                            }
                        }}
                    ></EntryRow>
                </Section>
                <Section title="Records" count={String(watch.records.length)}>
                    {watch.records.length === 0 ? (
                        <Placeholder
                            icon={ICON}
                            title="Records"
                            description="Time records show up here"
                        />
                    ) : (
                        [...watch.records].reverse().map((record) => (
                            <ExpanderRow
                                key={record.id}
                                title={record.description}
                                subtitle={formatTime(record.totalElapsed)}
                                value={formatTime(record.totalElapsed)}
                                typography="numeric"
                            >
                                <ActionRow
                                    icon="document-edit-symbolic"
                                    title="Rename"
                                    tooltip="Rename record"
                                    onActivate={() =>
                                        setWatch((w) =>
                                            model.removeRecord(w, record.id),
                                        )
                                    }
                                />
                                <ActionRow
                                    icon="user-trash-symbolic"
                                    title="Remove"
                                    tooltip="Remove record"
                                    onActivate={() =>
                                        setWatch((w) =>
                                            model.removeRecord(w, record.id),
                                        )
                                    }
                                />
                            </ExpanderRow>
                        ))
                    )}
                </Section>
            </Popover>
        </>
    );
}
