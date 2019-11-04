class Heap {
    constructor(priority) {
        this.priority = priority
        this.heap = []
    }

    swap(a, b) {
        [this.heap[a], this.heap[b]] = [this.heap[b], this.heap[a]]
    }

    sortDown(index) {
        let parent = Math.floor(index / 2)

        while (this.heap[index].priority < this.heap[parent].priority) {
            this.swap(index, parent)
            index = parent
            parent = Math.floor(index / 2)
        }
    }

    sortUp(index) {
        while (true) {
            let left = index * 2 + 1
            let right = index * 2 + 2

            let max = index

            if (left < this.heap.length
                && this.heap[left].priority < this.heap[max].priority) {
                max = left
            }
    
            if (right < this.heap.length
                && this.heap[right].priority < this.heap[max].priority) {
                max = right
            }
    
            if (index != max) {
                this.swap(map, index)
                index = max
            } else {
                return
            }
        }
    }

    add(node) {
        this.heap.push({
            data: node,
            priority: this.priority(node)
        })

        this.sortDown( this.heap.length - 1 )
    }

    pop() {
        let node = this.heap[0]
        this.heap[0] = this.heap.pop()
        this.sortUp( 0 )
        return node.data
    }

    update(val) {
        for (let i = 0; i < this.heap.length; i++) {
            if (this.heap[i] === val) {
                this.sortUp(i)
                this.sortDown(i)
                return
            }
        }
    }

    test() {
        let min = this.heap[0].priority

        for (let i = 1; i < i.length; i++) {
            if (min > this.heap[i].priority) {
                return console.warn("HEAP IS BROKEN")
            }
        }
        console.log("heap is working well")

    }
}