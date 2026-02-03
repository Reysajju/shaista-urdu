export interface Operation {
    type: 'insert' | 'delete' | 'retain'
    position: number
    text?: string
    length?: number
    priority: number
    userId: string
    timestamp: number
}

export class OTEditor {
    private document: string
    private operations: Operation[] = []
    private version = 0
    private pendingOps: Operation[] = []

    constructor(initialContent = '') {
        this.document = initialContent
    }

    applyOperation(op: Operation): string {
        // Transform against pending operations
        const transformed = this.transform(op, this.pendingOps)

        // Apply the operation
        this.document = this.apply(transformed)
        this.operations.push(transformed)
        this.version++

        return this.document
    }

    private apply(op: Operation): string {
        switch (op.type) {
            case 'insert':
                return (
                    this.document.slice(0, op.position) +
                    (op.text || '') +
                    this.document.slice(op.position)
                )
            case 'delete':
                return (
                    this.document.slice(0, op.position) +
                    this.document.slice(op.position + (op.length || 0))
                )
            case 'retain':
                return this.document
            default:
                return this.document
        }
    }

    transform(op1: Operation, ops: Operation[]): Operation {
        let transformed = { ...op1 }

        for (const op2 of ops) {
            transformed = this.transformPair(transformed, op2)
        }

        return transformed
    }

    private transformPair(op1: Operation, op2: Operation): Operation {
        // Insert vs Insert
        if (op1.type === 'insert' && op2.type === 'insert') {
            if (
                op1.position < op2.position ||
                (op1.position === op2.position && op1.priority > op2.priority)
            ) {
                return op1
            }
            return { ...op1, position: op1.position + (op2.text?.length || 0) }
        }

        // Insert vs Delete
        if (op1.type === 'insert' && op2.type === 'delete') {
            if (op1.position <= op2.position) {
                return op1
            }
            if (op1.position >= op2.position + (op2.length || 0)) {
                return { ...op1, position: op1.position - (op2.length || 0) }
            }
            return { ...op1, position: op2.position }
        }

        // Delete vs Insert
        if (op1.type === 'delete' && op2.type === 'insert') {
            if (op1.position >= op2.position) {
                return { ...op1, position: op1.position + (op2.text?.length || 0) }
            }
            if (op1.position + (op1.length || 0) <= op2.position) {
                return op1
            }
            // Split the delete
            const before = op2.position - op1.position
            return {
                ...op1,
                length: before + (op1.length || 0) - before + (op2.text?.length || 0),
            }
        }

        // Delete vs Delete
        if (op1.type === 'delete' && op2.type === 'delete') {
            if (op1.position >= op2.position + (op2.length || 0)) {
                return { ...op1, position: op1.position - (op2.length || 0) }
            }
            if (op1.position + (op1.length || 0) <= op2.position) {
                return op1
            }
            // Overlapping deletes
            const start = Math.max(op1.position, op2.position)
            const end1 = op1.position + (op1.length || 0)
            const end2 = op2.position + (op2.length || 0)
            const end = Math.min(end1, end2)

            if (op1.position < op2.position) {
                return {
                    ...op1,
                    length: op2.position - op1.position + Math.max(0, end1 - end2),
                }
            }
            return {
                ...op1,
                position: op2.position,
                length: Math.max(0, end1 - end2),
            }
        }

        return op1
    }

    getDocument(): string {
        return this.document
    }

    getVersion(): number {
        return this.version
    }

    createInsertOp(
        position: number,
        text: string,
        userId: string
    ): Operation {
        return {
            type: 'insert',
            position,
            text,
            priority: Math.random(),
            userId,
            timestamp: Date.now(),
        }
    }

    createDeleteOp(
        position: number,
        length: number,
        userId: string
    ): Operation {
        return {
            type: 'delete',
            position,
            length,
            priority: Math.random(),
            userId,
            timestamp: Date.now(),
        }
    }
}
