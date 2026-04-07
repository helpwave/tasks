import type { TaskGraphInput, TaskGraphNodeInput, TaskPriority } from '@/api/gql/generated'
import type { SuggestedTaskItem } from '@/types/systemSuggestion'

export type TaskPresetListRow = {
  title: string,
  description: string,
  priority: TaskPriority | null,
  estimatedTime: number | null,
}

export function listRowsToTaskGraphInput(rows: TaskPresetListRow[]): TaskGraphInput {
  const trimmed = rows.map(r => ({
    title: r.title.trim(),
    description: r.description.trim(),
    priority: r.priority,
    estimatedTime: r.estimatedTime,
  })).filter(r => r.title.length > 0)
  const nodes: TaskGraphNodeInput[] = trimmed.map((r, i) => ({
    nodeId: `n${i + 1}`,
    title: r.title,
    description: r.description.length > 0 ? r.description : undefined,
    priority: r.priority ?? undefined,
    estimatedTime: r.estimatedTime ?? undefined,
  }))
  const edges = []
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i]
    const b = nodes[i + 1]
    if (!a || !b) continue
    edges.push({
      fromNodeId: a.nodeId,
      toNodeId: b.nodeId,
    })
  }
  return { nodes, edges }
}

export function graphNodesToListRows(graph: {
  nodes: Array<{
    id: string,
    title: string,
    description?: string | null,
    priority?: string | null,
    estimatedTime?: number | null,
  }>,
}): TaskPresetListRow[] {
  return graph.nodes.map(n => ({
    title: n.title,
    description: n.description ?? '',
    priority: (n.priority as TaskPriority | null) ?? null,
    estimatedTime: n.estimatedTime ?? null,
  }))
}

export function suggestionItemsToTaskGraphInput(items: SuggestedTaskItem[]): TaskGraphInput {
  const nodes: TaskGraphNodeInput[] = items.map((t, i) => ({
    nodeId: `s-${i}-${t.id}`,
    title: t.title,
    description: t.description ?? undefined,
    priority: undefined,
    estimatedTime: undefined,
  }))
  const edges = []
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i]
    const b = nodes[i + 1]
    if (!a || !b) continue
    edges.push({
      fromNodeId: a.nodeId,
      toNodeId: b.nodeId,
    })
  }
  return { nodes, edges }
}
