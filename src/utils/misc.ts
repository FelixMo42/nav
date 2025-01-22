export function loop<T>(array: T[], cb: (a: T, b: T) => void) {
    for (let i = 0; i < array.length; i++) {
        cb(array[i], array[(i + 1) % array.length])
    }
}

export function removeItem<T>(arr: T[], item: T) {
    let i = arr.length - 1

    while (i >= 0) {
        if (arr[i] == item) {
            arr[i] = arr[arr.length - 1]
        }

        i--
    }

    return arr.pop()
}

export function nmod<T>(arr: T[], n: number): T {
    return arr[((n % arr.length) + arr.length) % arr.length]
}
