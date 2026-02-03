'use client'

import { useDraggable } from '@dnd-kit/core'
import { type NodeData } from '@/stores/nodeStore'

interface RenderNodeProps {
    node: NodeData
    isSelected: boolean
}

export function RenderNode({ node, isSelected }: RenderNodeProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: node.id,
    })

    const style: React.CSSProperties = {
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
    }

    const renderContent = () => {
        switch (node.type) {
            case 'container':
                return (
                    <div
                        className="w-full h-full rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                        style={node.props.style as React.CSSProperties}
                    >
                        {node.props.label as string}
                    </div>
                )
            case 'text':
                return (
                    <p
                        className="text-white"
                        style={node.props.style as React.CSSProperties}
                    >
                        {(node.props.content as string) || 'Text'}
                    </p>
                )
            case 'image':
                return (
                    <div className="w-full h-full rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10">
                        <span className="text-4xl">🖼️</span>
                    </div>
                )
            case 'button':
                return (
                    <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity shadow-lg">
                        {(node.props.label as string) || 'Button'}
                    </button>
                )
            case 'custom':
                return (
                    <div className="w-full h-full rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
                        <span className="text-white/60">Custom Component</span>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
        transition-shadow duration-200
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''}
      `}
        >
            {renderContent()}

            {/* Resize handles (shown when selected) */}
            {isSelected && (
                <>
                    <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize" />
                    <div className="absolute -left-1 -bottom-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize" />
                    <div className="absolute -right-1 -top-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize" />
                    <div className="absolute -left-1 -top-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize" />
                </>
            )}
        </div>
    )
}
