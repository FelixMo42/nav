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
        nodeDraggable: false,

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
                sprite.dragData = event
            })
            sprite.on("mousemove", () => {
                if (sprite.dragging) {
                    var newPosition = sprite.dragData.getLocalPosition(sprite.parent)
        
                    sprite.x = newPosition.x
                    sprite.y = newPosition.y
                }
            })
            sprite.on("mouseup", () => {
                sprite.alpha = 1
                sprite.dragging = false
                sprite.dragData = null
                
                node.x = sprite.x
                node.y = sprite.y

                // Event.fire("changed", [{
                //     changeType: "move",
                //     node: node
                // }])
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
            options.linkColor
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
            options.linkColor
        )
        link[symbol].moveTo( from.x , from.y )
        link[symbol].lineTo( to.x   , to.y   )
    }

    function removeNode(node) {
        node[symbol].clear()
        stage.removeChild( node[symbol] )
    }

    function removeLink(link) {
        if (symbol in link) { // TODO: this is temperary
            link[symbol].clear()
            stage.removeChild( link[symbol] )
        }
    }

    Event.on(navMesh.addNodeEvent, (node) => {
        initNode(node)
    })

    Event.on(navMesh.addPortEvent, (link) => {
        initLink(link)
    })

    Event.on(navMesh.removePortEvent, (link) => {
        removeLink(link)
    })


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

    Event.on(navMesh.addRoomEvent, (room) => {
        initRoom(room)
    })

    return stage
}