'use client'

import { type NodeData } from '@/stores/nodeStore'

interface NodePreviewProps {
    node: NodeData
}

export function NodePreview({ node }: NodePreviewProps) {
    return (
        <div
            className="rounded-lg bg-blue-500/20 border-2 border-dashed border-blue-500 backdrop-blur-sm"
            style={{
                width: node.size.width,
                height: node.size.height,
            }}
        >
            <div className="flex items-center justify-center h-full text-blue-400 text-sm font-medium">
                {node.type}
            </div>
        </div>
    )
}
