interface Meta<T> {
    node: T
    prev?: T
    traveled: number
    heuristic: number
}

export abstract class Pather<T> {
    abstract neighbors(t: T): T[]
    abstract distance(a: T, b: T): number

    path(start: T, target: T) {
        const open = new Set<T>()
        const data = new Map<T, Meta<T>>()

        const add = (node: T, prev?: Meta<T>) => {
            const traveled = (prev?.traveled ?? 0) + 1
            const heuristic = traveled + this.distance(node, target)
    
            if (data.has(node)) {
                const old = data.get(node)!
                if (old.traveled > traveled) {
                    old.traveled = traveled
                    old.heuristic = heuristic
                    old.prev = prev?.node
                    open.add(node)
                }
            } else {
                data.set(node, {
                    node,
                    prev: prev?.node,
                    traveled,
                    heuristic,
                })
                open.add(node)
            }
        }

        add(start)

        while (open.size > 0) {
            // Get the node with the lowest heuristic
            const current = getBestNode(open, data)
    
            // Recreate path
            if (current.node === target) {
                return reconstructPath(data, current)
            }
    
            // Remove current from open
            open.delete(current.node)
    
            // Add neighbors to open
            this.neighbors(current.node).map((n) => add(n, current))
        }
        
        // No path found :(
        return []
    }
}

function getBestNode<T>(open: Set<T>, data: Map<T, Meta<T>>) {
    return data.get(Array.from(open).reduce((a, b) => {
        if (data.get(a)!.heuristic < data.get(b)!.heuristic) {
            return a
        } else {
            return b
        }
    }))!
}

function reconstructPath<T>(data: Map<T, Meta<T>>, node: Meta<T>) {
    const path: T[] = []

    while (node.prev) {
        path.unshift(node.node)
        node = data.get(node.prev)!
    }

    path.unshift(node.node)

    return path
}
