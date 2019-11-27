module.exports = Object.freeze({
    newEvent: () => {
        return []
    },
    fire: (event, data) => {
        event.forEach(callback => callback(data))
    },
    on: (event) => {
        event.push(event)
    },
    off: (event) => {
        //TODO: deregister callback
    }
})