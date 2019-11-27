module.exports = Object.freeze({
    newEvent: () => {
        return []
    },
    fire: (event, data) => {
        event.forEach(callback => callback(data))
    },
    on: (event, callback) => {
        event.push(callback)
    },
    off: (event) => {
        //TODO: deregister callback
    }
})