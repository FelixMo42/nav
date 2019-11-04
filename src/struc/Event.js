class EventQueue {
    constructor() {
        
    }

    add(event) {
        
    }

    listener() {
        let position = {}

        return {
            ready: () => {
                return "next" in position
            },
            fetch: () => {
                position = position.next
            }
        }
    }
}

function assert(suc) {
    if ( !suc ) {
        console.log("!!!")
    }
}

function test() {
    let queue = new EventQueue()

    let listener = queue.listener()

    assert( listener.ready() == false )

    queue.add(12)

    assert( listener.ready() == true )

    assert( listener.fetch() == 12 )

    assert( listener.ready() == false )

    queue.add(32)
    queue.add(91)

    assert( listener.fetch() == 32 )
    assert( listener.fetch() == 91 )

    let listener2 = queue.listener()

    assert( listener2.ready() == false )
}

test()