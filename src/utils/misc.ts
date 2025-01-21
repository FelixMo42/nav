export function *forEachCirc<T>(array: T[]) {
    let length = array.length
    for (let i = 0; i < length; i++) {
        yield [
            array[i],
            array[ (i + 1) % length ]
        ]
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
