const _    = require("lodash")
const PIXI = require("pixi.js")

module.exports = function(graph, options) {
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

        sprite.x = node.data.x
        sprite.y = node.data.y

        sprite.beginFill( options.nodeColor )
        sprite.drawCircle(0, 0, options.nodeRadius)
        sprite.endFill()

        if ( options.nodeDraggable ) {
            sprite.hitArea = new PIXI.Circle(0, 0, options.nodeRadius)
            sprite.buttonMode = true
            sprite.interactive = true

            sprite.on('mousedown', (event) => {
                sprite.alpha = 0.5
                sprite.dragging = true
                sprite.dragData = event.data
            })
            sprite.on('mousemove', (event) => {
                if (sprite.dragging) {
                    var newPosition = sprite.dragData.getLocalPosition(sprite.parent)
        
                    sprite.x = newPosition.x
                    sprite.y = newPosition.y
                }
            })
            sprite.on('mouseup', (event) => {
                sprite.alpha = 1
                sprite.dragging = false
                sprite.dragData = null
                
                node.data.x = sprite.x
                node.data.y = sprite.y

                graph.fire("changed", [{
                    changeType: "move",
                    node: node
                }])
            })
        }

        stage.addChild(sprite)
        node.data[symbol] = sprite
    }

    function initLink(link) {
        let from = graph.getNode(link.fromId).data
        let to   = graph.getNode(link.toId  ).data

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
        node.data[symbol].x = node.data.x
        node.data[symbol].y = node.data.y
    }

    function updateLink(link) {
        let from = graph.getNode(link.fromId).data
        let to   = graph.getNode(link.toId  ).data

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

    graph.on("changed", (events) => {
        for (let event of events) {
            if (event.changeType == "add") {
                if ("node" in event && options.renderNodes) {
                    initNode(event.node)
                }
                if ("link" in event && options.renderLinks) {
                    initLink(event.link)
                }
            }

            if (event.changeType == "remove") {
                if ("node" in event && options.renderNodes) {
                    removeNode(event.node)
                }
                if ("link" in event && options.renderLinks) {
                    console.log(event)
                    removeLink(event.link)
                }
            }

            if (event.changeType == "move") {
                if (options.renderNodes) {
                    updateNode(event.node)
                }

                if (options.renderLinks) {
                    graph.forEachLinkedNode(event.node.id, (to, link) => {
                        updateLink(link)
                    })
                }
            }

        }
    })

    return stage
}