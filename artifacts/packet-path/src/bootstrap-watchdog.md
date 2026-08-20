# Bootstrap watchdog

The watchdog only reports a failure when the static `index.html` loading shell is still present after eight seconds. It also probes `/api/health` so support can distinguish a frontend bootstrap failure from an unavailable API.
