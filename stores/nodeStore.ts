import { create } from 'zustand'

export interface NodeData {
    id: string
    type: 'container' | 'text' | 'image' | 'button' | 'custom'
    props: Record<string, unknown>
    children?: string[]
    parentId?: string
    position: { x: number; y: number }
    size: { width: number; height: number }
}

interface NodeStore {
    nodes: Map<string, NodeData>
    selectedNodeId: string | null

    // Actions
    addNode: (node: Omit<NodeData, 'id'>) => string
    updateNode: (id: string, updates: Partial<NodeData>) => void
    deleteNode: (id: string) => void
    selectNode: (id: string | null) => void
    moveNode: (id: string, position: { x: number; y: number }) => void
    resizeNode: (id: string, size: { width: number; height: number }) => void
    getNode: (id: string) => NodeData | undefined
    getNodes: () => NodeData[]
    clear: () => void
}

export const useNodeStore = create<NodeStore>((set, get) => ({
    nodes: new Map(),
    selectedNodeId: null,

    addNode: (nodeData) => {
        const id = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const node: NodeData = { ...nodeData, id }

        set((state) => {
            const newNodes = new Map(state.nodes)
            newNodes.set(id, node)
            return { nodes: newNodes, selectedNodeId: id }
        })

        return id
    },

    updateNode: (id, updates) => {
        set((state) => {
            const node = state.nodes.get(id)
            if (!node) return state

            const newNodes = new Map(state.nodes)
            newNodes.set(id, { ...node, ...updates })
            return { nodes: newNodes }
        })
    },

    deleteNode: (id) => {
        set((state) => {
            const newNodes = new Map(state.nodes)
            newNodes.delete(id)
            return {
                nodes: newNodes,
                selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
            }
        })
    },

    selectNode: (id) => {
        set({ selectedNodeId: id })
    },

    moveNode: (id, position) => {
        get().updateNode(id, { position })
    },

    resizeNode: (id, size) => {
        get().updateNode(id, { size })
    },

    getNode: (id) => {
        return get().nodes.get(id)
    },

    getNodes: () => {
        return Array.from(get().nodes.values())
    },

    clear: () => {
        set({ nodes: new Map(), selectedNodeId: null })
    },
}))
