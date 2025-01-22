import { removeItem } from "./misc"

interface Node<T> {
    edges: Edge<T>[],
    data: T
}

interface Edge<T> {
    nodes: [Node<T>, Node<T>],
}

export class Graph<T> {
    $vert = new Map<T, T[]>
    $edge = [] as Array<[T, T]>

    /**
     * Adds a link to the graph
     */
    link(a: T, b: T) {
        this.$get(a).push(b)
        this.$get(b).push(a)

        this.$edge.push([a, b])
    }

    verts() {
        return this.$vert.keys()
    }

    $get(vert: T) {
        if (!this.$vert.has(vert)) {
            this.$vert.set(vert, [])
        }

        return this.$vert.get(vert)
    }

    /**
     * Removes node from graph
     */
    removeNode(node: Node<T>) {
        for (const edge of node.edges) {
            this.removeEdge(edge)
        }
    }

    /**
     * Adds edge to graph
     */
    addEdge(a: Node<T>, b: Node<T>) {
        const edge: Edge<T> = { nodes: [a, b] }

        a.edges.push(edge)
        b.edges.push(edge)

        return edge
    }

    /**
     * Checks if the graph has given edge
     */
    hasEdge(from: Node<T>, to: Node<T>) {
        for (const edge of from.edges) {
            if ( edge.nodes[0] == to || edge.nodes[1] == to ) {
                return true
            }
        }

        return false
    }

    /**
     * Gets the edge between the two nodes
     */
    getEdge(node1: Node<T>, node2: Node<T>) {
        for (const edge of node1.edges) {
            if (edge.nodes[0] == node2 || edge.nodes[1] == node2) {
                return edge
            }
        }
    }

    /**
     * Removes an edge from the graph
     */
    removeEdge(edge: Edge<T>) {
        for (const node of edge.nodes) {
            removeItem(node.edges, edge)
        }
    }
}
