export type Event<T> = Set<(data: T) => void>

export function Event<T>(): Event<T> {
    return new Set()
}

export function fire<T>(e: Event<T>, t: T) {
    e.forEach(cb => cb(t))
}

export function on<T>(e: Event<T>, cb: (data: T) => void) {
    e.add(cb)
    return () => e.delete(cb)
}
