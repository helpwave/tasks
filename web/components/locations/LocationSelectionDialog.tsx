import { useMemo, useState, useEffect, useRef } from 'react'
import {
  Dialog,
  Expandable,
  Checkbox,
  Button,
  SearchBar
} from '@helpwave/hightide'
import { useTasksTranslation } from '@/i18n/useTasksTranslation'
import type { LocationNodeType } from '@/api/gql/generated'
import { useGetLocationsQuery } from '@/api/gql/generated'
import type { TreeNode } from '@/utils/tree'
import { buildTree } from '@/utils/tree'
import {
  MapPin,
  CheckSquare,
  Square,
  ChevronsDown,
  ChevronsUp,
  MinusIcon,
} from 'lucide-react'

interface LocationSelectionDialogProps {
  isOpen: boolean,
  onClose: () => void,
  onSelect: (locations: LocationNodeType[]) => void,
  initialSelectedIds?: string[],
  multiSelect?: boolean,
}

interface LocationTreeItemProps {
  node: TreeNode<LocationNodeType>,
  selectedIds: Set<string>,
  onToggle: (node: LocationNodeType, checked: boolean) => void,
  expandedIds: Set<string>,
  onExpandToggle: (nodeId: string, isOpen: boolean) => void,
  level?: number,
}

const getKindStyles = (kind: string) => {
  const k = kind.toUpperCase()
  if (k.includes('CLINIC')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  if (k.includes('WARD')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  if (k.includes('TEAM')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
  if (k.includes('ROOM')) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  if (k.includes('BED')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  return 'bg-surface-subdued text-text-tertiary'
}

const LocationTreeItem = ({
  node,
  selectedIds,
  onToggle,
  expandedIds,
  onExpandToggle,
  level = 0
}: LocationTreeItemProps) => {
  const isSelected = selectedIds.has(node.id)
  const isExpanded = expandedIds.has(node.id)
  const hasChildren = node.children && node.children.length > 0

  const isIndeterminate = useMemo(() => {
    if (!hasChildren) return false
    const checkChildren = (n: TreeNode<LocationNodeType>): boolean => {
      return n.children.some(child => selectedIds.has(child.id) || checkChildren(child))
    }
    return !isSelected && checkChildren(node)
  }, [hasChildren, node, selectedIds, isSelected])

  const handleCheck = (checked: boolean) => {
    onToggle(node, checked)
  }

  const labelContent = (
    <div
      className="flex items-center gap-3 w-fit py-2 cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation()
        handleCheck(!isSelected)
      }}
    >
      <Checkbox
        checked={isSelected}
        indeterminate={isIndeterminate}
        onCheckedChange={handleCheck}
        className="flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-grow flex items-center gap-2 select-none">
        <span className="text-text-primary font-medium group-hover:text-text-primary transition-colors">
          {node.title}
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${getKindStyles(node.kind)}`}>
          {node.kind}
        </span>
      </div>
    </div>
  )

  if (!hasChildren) {
    return (
      <div className="flex-row-2 items-center rounded-lg px-4 py-1 transition-colors hover:bg-surface-hover">
        <MinusIcon className="size-6 text-description" />
        {labelContent}
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Expandable
        label={labelContent}
        clickOnlyOnHeader={true}
        isExpanded={isExpanded}
        onChange={(isOpen) => onExpandToggle(node.id, isOpen)}
        className="!shadow-none !bg-transparent !rounded-none"
        headerClassName="px-2 hover:bg-surface-hover rounded-lg transition-colors !text-text-primary hover:!text-text-primary flex-row-reverse justify-end"
        contentExpandedClassName="!max-h-none !overflow-visible border-l-2 border-divider ml-5 pl-2 pr-0 mt-1"
      >
        <div className="flex flex-col gap-1">
          {node.children.map(child => (
            <LocationTreeItem
              key={child.id}
              node={child}
              selectedIds={selectedIds}
              onToggle={onToggle}
              expandedIds={expandedIds}
              onExpandToggle={onExpandToggle}
              level={level + 1}
            />
          ))}
        </div>
      </Expandable>
    </div>
  )
}

export const LocationSelectionDialog = ({
  isOpen,
  onClose,
  onSelect,
  initialSelectedIds = [],
  multiSelect = true
}: LocationSelectionDialogProps) => {
  const translation = useTasksTranslation()
  const { data, isLoading } = useGetLocationsQuery({}, { enabled: isOpen })

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds))
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const hasInitialized = useRef(false)

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(initialSelectedIds))
      setExpandedIds(new Set())
      hasInitialized.current = true
    } else {
      hasInitialized.current = false
    }
  }, [isOpen, initialSelectedIds])

  const treeData = useMemo(() => {
    if (!data?.locationNodes) return []
    const nodes = data.locationNodes as LocationNodeType[]

    let filtered = nodes
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase()
      filtered = nodes.filter(n =>
        n.title.toLowerCase().includes(lower) ||
        n.kind.toLowerCase().includes(lower))
    }

    return buildTree(filtered)
  }, [data, searchQuery])

  const handleToggleSelect = (node: LocationNodeType, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      if (!multiSelect) newSet.clear()
      newSet.add(node.id)
    } else {
      newSet.delete(node.id)
    }
    setSelectedIds(newSet)
  }

  const handleExpandToggle = (nodeId: string, isOpen: boolean) => {
    const newSet = new Set(expandedIds)
    if (isOpen) {
      newSet.add(nodeId)
    } else {
      newSet.delete(nodeId)
    }
    setExpandedIds(newSet)
  }

  const handleExpandAll = () => {
    if (!data?.locationNodes) return
    const allIds = data.locationNodes.map(n => n.id)
    setExpandedIds(new Set(allIds))
  }

  const handleCollapseAll = () => {
    setExpandedIds(new Set())
  }

  const handleConfirm = () => {
    if (!data?.locationNodes) return
    const nodes = data.locationNodes as LocationNodeType[]
    const selectedNodes = nodes.filter(n => selectedIds.has(n.id))
    onSelect(selectedNodes)
    onClose()
  }

  const handleSelectAll = () => {
    if (!data?.locationNodes) return
    const ids = data.locationNodes.map(n => n.id)
    setSelectedIds(new Set(ids))
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      titleElement={(
        <div className="flex items-center gap-2">
          <MapPin className="size-6 text-primary" />
          {translation('selectLocation')}
        </div>
      )}
      description={translation('selectLocationDescription')}
      className="w-[600px] h-[80vh] flex flex-col max-w-full"
    >
      <div className="flex flex-col gap-4 mt-4 h-full overflow-hidden">
        <div className="flex items-center gap-2 flex-none">
          <div className="flex-grow">
            <SearchBar
              placeholder={translation('searchLocations')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={() => null}
              className="w-full"
            />
          </div>

          <div className="flex gap-1 border-l border-divider pl-2 ml-1">
            <Button layout="icon" size="small" onClick={handleExpandAll} title={translation('expandAll')}>
              <ChevronsDown className="size-4" />
            </Button>
            <Button layout="icon" size="small" onClick={handleCollapseAll} title={translation('collapseAll')}>
              <ChevronsUp className="size-4" />
            </Button>
          </div>

          {multiSelect && (
            <div className="flex gap-1 border-l border-divider pl-2">
              <Button layout="icon" size="small" onClick={handleSelectAll} title={translation('selectAll')}>
                <CheckSquare className="size-4" />
              </Button>
              <Button layout="icon" size="small" onClick={handleDeselectAll} title={translation('deselectAll')}>
                <Square className="size-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex-grow overflow-y-auto min-h-0 border border-divider rounded-lg p-2 bg-surface-subdued">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              Loading...
            </div>
          ) : (
            <div className="flex flex-col gap-1 pb-2">
              {treeData.map(node => (
                <LocationTreeItem
                  key={node.id}
                  node={node}
                  selectedIds={selectedIds}
                  onToggle={handleToggleSelect}
                  expandedIds={expandedIds}
                  onExpandToggle={handleExpandToggle}
                />
              ))}
              {treeData.length === 0 && (
                <div className="text-text-tertiary italic text-center p-8">
                  {translation('noLocationsFound')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-none flex justify-end pt-4 mt-4 border-t border-divider gap-2">
        <Button onClick={onClose} color="neutral">
          {translation('cancel')}
        </Button>
        <Button onClick={handleConfirm}>
          {translation('confirmSelection')} ({selectedIds.size})
        </Button>
      </div>
    </Dialog>
  )
}
