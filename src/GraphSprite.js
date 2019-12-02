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
                sprite.dragData = event.data
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
        node.data[symbol] = sprite
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
        link.data[symbol] = sprite
    }

    function updateNode(node) {
        node.data[symbol].x = node.x
        node.data[symbol].y = node.y
    }

    function updateLink(link) {
        let from = link.nodes[0]
        let to   = link.nodes[1]

        link.data[symbol].clear()

        link.data[symbol].lineStyle(
            options.linkWidth,
            options.linkColor
        )
        link.data[symbol].moveTo( from.x , from.y )
        link.data[symbol].lineTo( to.x   , to.y   )
    }

    function removeNode(node) {
        node.data[symbol].clear()
        stage.removeChild( node.data[symbol] )
    }

    function removeLink(link) {
        if (symbol in link.data) { // TODO: this is temperary
            link.data[symbol].clear()
            stage.removeChild( link.data[symbol] )
        }
    }

    Event.on(navMesh.addNodeEvent, (node) => {
        initNode(node)
    })

    Event.on(navMesh.addEdgeEvent, (link) => {
        console.log("hi")
        initLink(link)
    })

    return stage
}