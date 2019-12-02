module.exports = Object.freeze({
    newEvent: () => {
        return new Set()
    },
    fire: (event, data) => {
        event.forEach(callback => callback(data))
    },
    on: (event, callback) => {
        event.add(callback)
    },
    off: (event) => {
        event.delete(event)
    }
})