export type TimeTrackerStatus = "idle" | "running" | "paused";

export interface Record {
    id: number;
    description: string;
    totalElapsed: number;
}

export interface TimeTracker {
    status: TimeTrackerStatus;
    /**
     * Elapsed time in milliseconds at the moment the clock last stopped.
     */
    totalElapsed: number;
    /**
     * Timestamp of the moment the clock last started, or 0 while not running.
     */
    startedAt: number;
    /**
     * Draft description for the next record; empty string when none was typed.
     */
    description: string;
    records: Array<Record>;
}

export function initial(): TimeTracker {
    return {
        status: "idle",
        totalElapsed: 0,
        startedAt: 0,
        description: "",
        records: [],
    };
}

/**
 * Elapsed time in milliseconds; `now` only matters while running.
 */
export function getElapsed(model: TimeTracker, now: number): number {
    return model.status === "running" ? model.totalElapsed + (now - model.startedAt) : model.totalElapsed;
}

export function toggleRunning(model: TimeTracker, now: number): TimeTracker {
    if (model.status === "running") {
        return {
            ...model,
            status: "paused",
            totalElapsed: model.totalElapsed + (now - model.startedAt),
            startedAt: 0,
        };
    }
    return { ...model, status: "running", startedAt: now };
}

export function reset(model: TimeTracker): TimeTracker {
    return {
        ...initial(),
        records: model.records,
    };
}

/**
 * Description is untrusted input: trimmed and capped at the same length as option names.
 */
export function setDescription(model: TimeTracker, description: string): TimeTracker {
    return { ...model, description };
}

export function addRecord(model: TimeTracker, now: number): TimeTracker {
    const id = model.records.length + 1;
    const description = model.description.trim();
    return {
        ...initial(),
        records: [
            ...model.records,
            {
                id,
                description: description === "" ? `Record ${id}` : description.slice(0, 64),
                totalElapsed: getElapsed(model, now),
            },
        ],
    };
}

export function renameRecord(model: TimeTracker, id: number, description: string): TimeTracker {
    const name = description.trim().slice(0, 64);
    return {
        ...model,
        records: model.records.map((record) =>
            record.id === id
                ? {
                      ...record,
                      description: name === "" ? `Record ${id}` : name,
                  }
                : record,
        ),
    };
}

export function removeRecord(model: TimeTracker, id: number): TimeTracker {
    const kept = model.records.filter((record) => record.id !== id);
    return {
        ...model,
        records: kept.map((record, index) => ({
            ...record,
            id: index + 1,
        })),
    };
}
