const _     = require("lodash")
const PIXI  = require("pixi.js")
const Event = require("./EventMonger")

module.exports = function(navMesh, options) {
    let stage = new PIXI.Container()
    let symbol = Symbol()

    options = _.defaults(options, {
        renderNodes: true,
        renderLinks: true,

        nodeRadius: 10,
        nodeColor: 0x00ff00,
        nodeDraggable: true,

        linkWidth: 6,
        linkColor: 0x00ff00
    })

    stage.interactive = options.nodeDraggable
    stage.buttonMode  = options.nodeDraggable

    function initNode(node) {
        let sprite = new PIXI.Graphics()

        sprite.x = node.x
        sprite.y = node.y

        sprite.beginFill( options.nodeColor )
        sprite.drawCircle(0, 0, options.nodeRadius)
        sprite.endFill()

        if ( options.nodeDraggable ) {
            sprite.hitArea = new PIXI.Circle(0, 0, options.nodeRadius)
            sprite.buttonMode = true
            sprite.interactive = true

            sprite.on("mousedown", (event) => {
                sprite.alpha = 0.5
                sprite.dragging = true
                sprite.dragData = event.data
            })
            sprite.on("mousemove", () => {
                if (sprite.dragging) {
                    var newPosition =
                        sprite.dragData.getLocalPosition(sprite.parent)
        
                    sprite.x = newPosition.x
                    sprite.y = newPosition.y
                }
            })
            sprite.on("mouseup", () => {
                sprite.alpha = 1
                sprite.dragging = false
                sprite.dragData = null

                let newX = sprite.x
                let newY = sprite.y
                
                sprite.x = node.x
                sprite.y = node.y

                navMesh.moveNode(node, newX, newY)
            })
        }

        stage.addChild(sprite)
        node[symbol] = sprite
    }

    function initLink(link) {
        let from = link.nodes[0]
        let to   = link.nodes[1]

        let sprite = new PIXI.Graphics()

        sprite.lineStyle(
            options.linkWidth,
            "color" in link ? link.color : options.linkColor
        )

        sprite.moveTo( from.x , from.y )
        sprite.lineTo( to.x   , to.y   )

        stage.addChild(sprite)
        link[symbol] = sprite
    }

    function updateNode(node) {
        node[symbol].x = node.x
        node[symbol].y = node.y
    }

    function updateLink(link) {
        let from = link.nodes[0]
        let to   = link.nodes[1]

        link[symbol].clear()

        link[symbol].lineStyle(
            options.linkWidth,
            "color" in link ? link.color : options.linkColor
        )

        link[symbol].moveTo( from.x , from.y )
        link[symbol].lineTo( to.x   , to.y   )
    }

    function removeNode(node) {
        node[symbol].clear()
        stage.removeChild( node[symbol] )
    }

    function removeLink(link) {
        if (symbol in link) {
            link[symbol].clear()
            stage.removeChild( link[symbol] )
        }
    }

    function initRoom(room) {
        let sprite = new PIXI.Graphics()

        sprite.x = room.x
        sprite.y = room.y

        sprite.beginFill(options.nodeColor)
        sprite.drawCircle(0, 0, options.nodeRadius)
        sprite.endFill()

        stage.addChild(sprite)
        room[symbol] = sprite
    }

    // function updateRoom(room) {
    //     let sprite = new PIXI.Graphics()

    //     sprite.x = room.x
    //     sprite.y = room.y

    //     sprite.beginFill(options.nodeColor)
    //     sprite.drawCircle(0, 0, options.nodeRadius)
    //     sprite.endFill()

    //     stage.addChild(sprite)
    //     room[symbol] = sprite
    // }

    // node events

    Event.on(navMesh.addNodeEvent,    initNode)
    Event.on(navMesh.updateNodeEvent, updateNode)

    // edge events

    Event.on(navMesh.addEdgeEvent,    initLink)
    Event.on(navMesh.updateEdgeEvent, updateLink)
    Event.on(navMesh.removeEdgeEvent, removeLink)

    // room events

    Event.on(navMesh.addRoomEvent,    initRoom)
    Event.on(navMesh.updateRoomEvent, updateNode)
    Event.on(navMesh.removeRoomEvent, removeNode)

    return stage
}