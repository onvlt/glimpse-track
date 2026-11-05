export type StopwatchState =
    | { type: "running"; startedAt: number; totalElapsed: number }
    | { type: "paused"; totalElapsed: number }
    | { type: "idle" };

export function initial(): StopwatchState {
    return { type: "idle" };
}

export function toggle(state: StopwatchState, now: number): StopwatchState {
    if (state.type === "running") {
        return {
            type: "paused",
            totalElapsed: getElapsed(state, now),
        };
    }
    return {
        type: "running",
        startedAt: now,
        totalElapsed: state.type === "idle" ? 0 : state.totalElapsed,
    };
}

export function reset() {
    return initial();
}

export function getElapsed(state: StopwatchState, now: number): number {
    if (state.type === "running") {
        return state.totalElapsed + (now - state.startedAt);
    }
    if (state.type === "paused") {
        return state.totalElapsed;
    }
    return 0;
}
