import * as stopwatch from "./stopwatch";

export interface Record {
    id: number;
    description: string;
    totalElapsed: number;
}

export interface AppState {
    stopwatch: stopwatch.StopwatchState;
    description: string;
    records: Array<Record>;
}

export function initial(): AppState {
    return {
        stopwatch: stopwatch.initial(),
        description: "",
        records: [],
    };
}

export function getElapsed(state: AppState, now: number): number {
    return stopwatch.getElapsed(state.stopwatch, now);
}

export function toggleRunning(state: AppState, now: number): AppState {
    return { ...state, stopwatch: stopwatch.toggle(state.stopwatch, now) };
}

export function reset(state: AppState): AppState {
    return { ...state, stopwatch: stopwatch.reset() };
}

export function setDescription(state: AppState, description: string): AppState {
    return { ...state, description };
}

export function addRecord(state: AppState, now: number): AppState {
    const id = state.records.length + 1;
    const description = state.description.trim();
    return {
        ...initial(),
        records: [
            ...state.records,
            {
                id,
                description: description === "" ? `Record ${id}` : description.slice(0, 64),
                totalElapsed: getElapsed(state, now),
            },
        ],
    };
}

export function renameRecord(state: AppState, id: number, description: string): AppState {
    const name = description.trim().slice(0, 64);
    return {
        ...state,
        records: state.records.map((record) =>
            record.id === id
                ? {
                      ...record,
                      description: name === "" ? `Record ${id}` : name,
                  }
                : record,
        ),
    };
}

export function removeRecord(state: AppState, id: number): AppState {
    const kept = state.records.filter((record) => record.id !== id);
    return {
        ...state,
        records: kept.map((record, index) => ({
            ...record,
            id: index + 1,
        })),
    };
}
