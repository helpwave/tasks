export type TreeNode<T> = T & {
  children: TreeNode<T>[],
}

export const buildTree = <T extends { id: string, parentId?: string | null | undefined }>(
  items: T[]
): TreeNode<T>[] => {
  const itemMap = new Map<string, TreeNode<T>>()
  const rootNodes: TreeNode<T>[] = []

  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] })
  })

  items.forEach(item => {
    const node = itemMap.get(item.id)
    if (!node) return

    if (item.parentId && itemMap.has(item.parentId)) {
      const parent = itemMap.get(item.parentId)
      parent?.children.push(node)
    } else {
      rootNodes.push(node)
    }
  })

  return rootNodes
}
