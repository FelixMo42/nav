import { removeItem } from "./misc"

interface Node<T> {
    edges: Edge<T>[],
    data: T
}

interface Edge<T> {
    nodes: [Node<T>, Node<T>],
    data: T
}

export class Graph<T> {
    /**
     * Adds a node with given data to graph.
     */
    addNode(data: T) {
        const node = { data, edges: [] }
        return node
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
    addEdge(from: Node<T>, to: Node<T>, data: T) {
        const edge: Edge<T> = {
            nodes: [from, to],
            data: data
        }

        from.edges.push(edge)
        to.edges.push(edge)

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
