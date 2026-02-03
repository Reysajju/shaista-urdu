'use client'

import { useCallback } from 'react'
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragEndEvent,
    DragStartEvent,
} from '@dnd-kit/core'
import { useNodeStore, type NodeData } from '@/stores/nodeStore'
import { RenderNode } from './RenderNode'
import { NodePreview } from './NodePreview'
import { useState } from 'react'

export function Canvas() {
    const { getNodes, selectedNodeId, selectNode, moveNode } = useNodeStore()
    const [activeNode, setActiveNode] = useState<NodeData | null>(null)
    const nodes = getNodes()

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            const node = nodes.find((n) => n.id === event.active.id)
            if (node) {
                setActiveNode(node)
                selectNode(node.id)
            }
        },
        [nodes, selectNode]
    )

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, delta } = event
            const node = nodes.find((n) => n.id === active.id)

            if (node) {
                moveNode(node.id, {
                    x: node.position.x + delta.x,
                    y: node.position.y + delta.y,
                })
            }

            setActiveNode(null)
        },
        [nodes, moveNode]
    )

    const handleCanvasClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
                selectNode(null)
            }
        },
        [selectNode]
    )

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div
                className="canvas-container relative w-full h-full min-h-[400px] md:min-h-[600px] bg-[#141B2D] overflow-hidden rounded-2xl md:rounded-3xl"
                onClick={handleCanvasClick}
            >
                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: `
              linear-gradient(to right, #A68A56 1px, transparent 1px),
              linear-gradient(to bottom, #A68A56 1px, transparent 1px)
            `,
                        backgroundSize: '32px 32px',
                    }}
                />

                {/* Nodes */}
                {nodes.map((node) => (
                    <RenderNode
                        key={node.id}
                        node={node}
                        isSelected={selectedNodeId === node.id}
                    />
                ))}

                <DragOverlay>
                    {activeNode ? <NodePreview node={activeNode} /> : null}
                </DragOverlay>

                {/* Empty state */}
                {nodes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                        <div className="text-center space-y-4 md:space-y-6 max-w-xs md:max-w-md">
                            <div className="text-4xl md:text-6xl opacity-20 filter grayscale">🏛️</div>
                            <p className="text-[#8A8680] text-sm md:text-lg font-serif font-light leading-relaxed">
                                Curate your masterpiece by adding architectural elements from the workshop.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </DndContext>
    )
}
