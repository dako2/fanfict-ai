import { useState, useEffect, useCallback } from 'react'

interface StoryNode {
  id: string
  story_id: string
  content: string
  parent_ids: string[]
  children_ids: string[]
  is_ai_generated: boolean
  created_at: string
  author: string
  likes: number
  dislikes: number
  crossover_universes?: string[]
  theme_tags?: string[]
  story_type?: 'original' | 'crossover' | 'alternate_universe' | 'time_travel'
}

interface StoryTreeVisualizationProps {
  storyId: string
  currentNodeId: string
  onNodeSelect: (nodeId: string) => void
  onKeyboardNodeSelect?: (nodeId: string) => void
  onNodesLoaded?: (nodes: StoryNode[]) => void
  className?: string
}

interface TreeNode {
  node: StoryNode
  level: number
  children: TreeNode[]
}

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000'

export default function StoryTreeVisualization({ 
  storyId, 
  currentNodeId, 
  onNodeSelect, 
  onKeyboardNodeSelect,
  onNodesLoaded,
  className = '' 
}: StoryTreeVisualizationProps) {
  const [treeData, setTreeData] = useState<TreeNode | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState(currentNodeId)
  const [flattenedNodes, setFlattenedNodes] = useState<{ node: StoryNode; level: number }[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const fetchAllStoryNodes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}/nodes`)
      if (!response.ok) return

      const nodes = await response.json()
      
      if (onNodesLoaded) {
        onNodesLoaded(nodes)
      }
      
      const dag = buildDAG(nodes)
      setTreeData(dag)
      
      const flattened = flattenDAG(dag)
      setFlattenedNodes(flattened)
      
      const currentIdx = flattened.findIndex(item => item.node.id === currentNodeId)
      setCurrentIndex(currentIdx >= 0 ? currentIdx : 0)
    } catch (error) {
      console.error('Failed to fetch story nodes:', error)
    }
  }

  const buildDAG = (nodes: StoryNode[]): TreeNode | null => {
    const nodeMap = new Map(nodes.map(node => [node.id, node]))
    const visited = new Set<string>()
    const visiting = new Set<string>()
    
    const rootNodes = nodes.filter(node => node.parent_ids.length === 0)
    if (rootNodes.length === 0) return null
    
    const buildNode = (nodeId: string, level: number): TreeNode | null => {
      if (visiting.has(nodeId)) {
        console.warn(`Cycle detected at node ${nodeId}`)
        return null
      }
      if (visited.has(nodeId)) {
        const node = nodeMap.get(nodeId)
        return node ? { node, level, children: [] } : null
      }
      
      const node = nodeMap.get(nodeId)
      if (!node) return null
      
      visiting.add(nodeId)
      
      const children = node.children_ids
        .map(childId => buildNode(childId, level + 1))
        .filter((child): child is TreeNode => child !== null)
      
      visiting.delete(nodeId)
      visited.add(nodeId)
      
      return { node, level, children }
    }
    
    return buildNode(rootNodes[0].id, 0)
  }

  const flattenDAG = (dag: TreeNode | null): { node: StoryNode; level: number }[] => {
    if (!dag) return []
    
    const result: { node: StoryNode; level: number }[] = []
    const visited = new Set<string>()
    
    const traverse = (treeNode: TreeNode) => {
      if (visited.has(treeNode.node.id)) return
      visited.add(treeNode.node.id)
      
      result.push({ node: treeNode.node, level: treeNode.level })
      treeNode.children.forEach(traverse)
    }
    
    traverse(dag)
    return result
  }

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (flattenedNodes.length === 0) return

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        setCurrentIndex(prev => {
          const newIndex = Math.max(0, prev - 1)
          const newNodeId = flattenedNodes[newIndex].node.id
          setSelectedNodeId(newNodeId)
          if (onKeyboardNodeSelect) {
            onKeyboardNodeSelect(newNodeId)
          } else {
            onNodeSelect(newNodeId)
          }
          return newIndex
        })
        break
      case 'ArrowDown':
        event.preventDefault()
        setCurrentIndex(prev => {
          const newIndex = Math.min(flattenedNodes.length - 1, prev + 1)
          const newNodeId = flattenedNodes[newIndex].node.id
          setSelectedNodeId(newNodeId)
          if (onKeyboardNodeSelect) {
            onKeyboardNodeSelect(newNodeId)
          } else {
            onNodeSelect(newNodeId)
          }
          return newIndex
        })
        break
    }
  }, [flattenedNodes, currentIndex, onNodeSelect, onKeyboardNodeSelect])

  useEffect(() => {
    fetchAllStoryNodes()
  }, [storyId])

  useEffect(() => {
    setSelectedNodeId(currentNodeId)
    const currentIdx = flattenedNodes.findIndex(item => item.node.id === currentNodeId)
    if (currentIdx >= 0) {
      setCurrentIndex(currentIdx)
    }
  }, [currentNodeId, flattenedNodes])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const getNodeIcon = (node: StoryNode) => {
    if (node.story_type === 'crossover') return '🌐'
    if (node.story_type === 'alternate_universe') return '🌍'
    if (node.story_type === 'time_travel') return '⏰'
    return node.is_ai_generated ? '🤖' : '👤'
  }

  const getCrossoverInfo = (node: StoryNode) => {
    if (node.crossover_universes && node.crossover_universes.length > 0) {
      return ` (${node.crossover_universes.join(' × ')})`
    }
    return ''
  }

  const getIndentation = (level: number) => {
    return '  '.repeat(level) + (level > 0 ? '└─ ' : '')
  }

  const truncateContent = (content: string, maxLength: number = 50) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
  }

  if (!treeData || flattenedNodes.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <h3 className="font-semibold text-gray-900 mb-2">Story Map</h3>
        <p className="text-gray-500 text-sm">Loading story structure...</p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Story Map</h3>
        <div className="text-xs text-gray-500">
          Use ↑↓ to navigate
        </div>
      </div>
      
      <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-sm">
        {flattenedNodes.map((item, index) => {
          const isSelected = selectedNodeId === item.node.id
          const isCurrent = currentNodeId === item.node.id
          
          return (
            <div
              key={item.node.id}
              className={`
                px-2 py-1 rounded cursor-pointer transition-colors
                ${isCurrent ? 'bg-blue-100 border border-blue-300' : ''}
                ${isSelected && !isCurrent ? 'bg-gray-100' : ''}
                ${!isSelected && !isCurrent ? 'hover:bg-gray-50' : ''}
              `}
              onClick={() => {
                setSelectedNodeId(item.node.id)
                setCurrentIndex(index)
                onNodeSelect(item.node.id)
              }}
            >
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 whitespace-pre">
                  {getIndentation(item.level)}
                </span>
                <span className="text-lg">
                  {getNodeIcon(item.node)}
                </span>
                <span className={`
                  flex-1 truncate
                  ${isCurrent ? 'font-semibold text-blue-900' : 'text-gray-700'}
                `}>
                  {truncateContent(item.node.content)}
                  {getCrossoverInfo(item.node)}
                </span>
                <div className="flex items-center space-x-1 text-xs">
                  <span className="text-red-500">❤️ {item.node.likes}</span>
                  {item.node.dislikes > 0 && (
                    <span className="text-gray-400">👎 {item.node.dislikes}</span>
                  )}
                </div>
              </div>
              {isCurrent && (
                <div className="text-xs text-blue-600 mt-1 ml-8">
                  ← You are here
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-2">
          <div className="flex items-center space-x-2">
            <span>👤 Human</span>
            <span>🤖 AI</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🌐 Crossover</span>
            <span>🌍 AU</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <span>⏰ Time Travel</span>
          </div>
          <div>
            {currentIndex + 1} / {flattenedNodes.length} nodes
          </div>
        </div>
      </div>
    </div>
  )
}
