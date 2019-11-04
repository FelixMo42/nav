const _    = require("lodash")
const PIXI = require("pixi.js")

module.exports = function(graph, options) {
    let stage = new PIXI.Container()

    options = _.defaults(options, {
        renderNodes: true,
        renderLinks: true,

        nodeRadius: 10,
        nodeColor: 0x00ff00,
        nodeDragable: false,

        linkWidth: 6,
        linkColor: 0x00ff00
    })

    function initNode(node) {
        let sprite = new PIXI.Graphics()
        
        console.log(node)

        sprite.x = node.data.x
        sprite.y = node.data.y

        sprite.beginFill( options.nodeColor )
        sprite.drawCircle(0, 0, options.nodeRadius)
        sprite.endFill()

        if ( options.nodeDragable ) {
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

                graph.fire("changed", {
                    changeType: "move",
                    node: node
                })
            })
        }

        stage.addChild(sprite)
        node.data.sprite = sprite
    }

    function updateNode(node) {
        node.data.sprite.x = node.data.x
        node.data.sprite.y = node.data.y

        graph.forEachLinkedNode(node.id, (to, link) => {
            updateLink(link)
        })
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

        link.data.sprite = sprite
    }

    function updateLink(link) {
        let from = graph.getNode(link.fromId).data
        let to   = graph.getNode(link.toId  ).data

        link.data.sprite.clear()

        sprite.lineStyle(
            options.linkWidth,
            options.linkColor
        )
        sprite.moveTo( from.x , from.y )
        sprite.lineTo( to.x   , to.y   )
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

            if (event.changeType == "move") {
                updateNode(event.node)
            }
        }
    })

    return stage
}