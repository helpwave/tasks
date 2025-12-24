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
import { LocationType } from '@/api/gql/generated'
import { useGetLocationsQuery } from '@/api/gql/generated'
import type { TreeNode } from '@/utils/tree'
import { buildTree } from '@/utils/tree'
import {
  MapPin,
  CheckSquare,
  Square,
  ChevronsDown,
  ChevronsUp,
  MinusIcon
} from 'lucide-react'

export type LocationPickerUseCase =
  | 'default'
  | 'clinic'
  | 'position'
  | 'teams'
  | 'root'

interface LocationSelectionDialogProps {
  isOpen: boolean,
  onClose: () => void,
  onSelect: (locations: LocationNodeType[]) => void,
  initialSelectedIds?: string[],
  multiSelect?: boolean,
  useCase?: LocationPickerUseCase,
}

interface LocationTreeItemProps {
  node: TreeNode<LocationNodeType>,
  selectedIds: Set<string>,
  onToggle: (node: LocationNodeType, checked: boolean) => void,
  expandedIds: Set<string>,
  onExpandToggle: (nodeId: string, isOpen: boolean) => void,
  level?: number,
  isSelectable?: boolean,
}

const getKindStyles = (kind: string) => {
  const k = kind.toUpperCase()
  if (k === 'HOSPITAL') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  if (k === 'PRACTICE') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
  if (k === 'CLINIC') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  if (k === 'TEAM') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
  if (k === 'WARD') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  if (k === 'ROOM') return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  if (k === 'BED') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  return 'bg-surface-subdued text-text-tertiary'
}

const LocationTreeItem = ({
  node,
  selectedIds,
  onToggle,
  expandedIds,
  onExpandToggle,
  level = 0,
  isSelectable = true,
}: LocationTreeItemProps) => {
  const isSelected = selectedIds.has(node.id)
  const isExpanded = expandedIds.has(node.id)
  const hasChildren = node.children && node.children.length > 0

  const isIndeterminate = useMemo(() => {
    if (!hasChildren || !isSelectable) return false
    const checkChildren = (n: TreeNode<LocationNodeType>): boolean => {
      return n.children.some(child => selectedIds.has(child.id) || checkChildren(child))
    }
    return !isSelected && checkChildren(node)
  }, [hasChildren, node, selectedIds, isSelected, isSelectable])

  const handleCheck = (checked: boolean) => {
    if (isSelectable) {
      onToggle(node, checked)
    }
  }

  const labelContent = (
    <div
      className={`flex items-center gap-3 w-fit py-2 ${isSelectable ? 'cursor-pointer' : 'cursor-default'} group`}
      onClick={(e) => {
        if (isSelectable) {
          e.stopPropagation()
          handleCheck(!isSelected)
        }
      }}
    >
      {isSelectable && (
        <Checkbox
          checked={isSelected}
          indeterminate={isIndeterminate}
          onCheckedChange={handleCheck}
          className="flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <div className="flex-grow flex items-center gap-2 select-none">
        <span className={`text-text-primary font-medium ${isSelectable ? 'group-hover:text-text-primary' : 'opacity-75'} transition-colors`}>
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
              isSelectable={(child as TreeNode<LocationNodeType> & { isSelectable?: boolean }).isSelectable ?? true}
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
  multiSelect = true,
  useCase = 'default',
}: LocationSelectionDialogProps) => {
  const translation = useTasksTranslation()
  const { data, isLoading } = useGetLocationsQuery(
    {},
    {
      enabled: isOpen,
      refetchInterval: 15000,
      refetchOnWindowFocus: true,
    }
  )

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds))
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const hasInitialized = useRef(false)

  const getAllDescendantIds = useMemo(() => {
    if (!data?.locationNodes) return () => new Set<string>()
    const nodes = data.locationNodes as LocationNodeType[]

    return (nodeId: string): Set<string> => {
      const descendants = new Set<string>()
      const queue = [nodeId]

      while (queue.length > 0) {
        const currentId = queue.shift()!
        const children = nodes.filter(n => n.parentId === currentId)
        children.forEach(child => {
          descendants.add(child.id)
          queue.push(child.id)
        })
      }

      return descendants
    }
  }, [data?.locationNodes])

  const _getAllAncestorIds = useMemo(() => {
    if (!data?.locationNodes) return () => new Set<string>()
    const nodes = data.locationNodes as LocationNodeType[]

    return (nodeId: string): Set<string> => {
      const ancestors = new Set<string>()
      let current: LocationNodeType | undefined = nodes.find(n => n.id === nodeId)

      while (current?.parentId) {
        ancestors.add(current.parentId)
        const parentId = current.parentId
        const parent = nodes.find(n => n.id === parentId)
        if (!parent) break
        current = parent
      }

      return ancestors
    }
  }, [data?.locationNodes])

  const _simplifySelection = useMemo(() => {
    return (ids: string[]): string[] => ids
  }, [])

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(initialSelectedIds))
      setExpandedIds(new Set())
      hasInitialized.current = true
    } else {
      hasInitialized.current = false
    }
  }, [isOpen, initialSelectedIds])

  const matchesFilter = useMemo(() => {
    if (useCase === 'default') {
      return () => true
    }

    if (useCase === 'root') {
      const allowedKinds = new Set<string>([
        LocationType.Hospital,
        LocationType.Practice,
        LocationType.Clinic,
        LocationType.Team,
        'HOSPITAL',
        'PRACTICE',
        'CLINIC',
        'TEAM',
      ])
      return (node: LocationNodeType) => {
        const kindStr = node.kind.toString().toUpperCase()
        return allowedKinds.has(node.kind as LocationType) ||
               allowedKinds.has(kindStr)
      }
    } else if (useCase === 'clinic') {
      return (node: LocationNodeType) => {
        const kindStr = node.kind.toString().toUpperCase()
        return kindStr === 'CLINIC' || node.kind === LocationType.Clinic
      }
    } else if (useCase === 'position') {
      const allowedKinds = new Set<string>([
        LocationType.Clinic,
        LocationType.Ward,
        LocationType.Bed,
        LocationType.Room,
        'PRACTICE',
        'HOSPITAL',
        'CLINIC',
        'WARD',
        'BED',
        'ROOM',
      ])
      return (node: LocationNodeType) => {
        const kindStr = node.kind.toString().toUpperCase()
        return allowedKinds.has(node.kind as LocationType) ||
               allowedKinds.has(kindStr)
      }
    } else if (useCase === 'teams') {
      const allowedKinds = new Set<string>([
        LocationType.Clinic,
        LocationType.Team,
        'PRACTICE',
        'HOSPITAL',
        'CLINIC',
        'TEAM',
      ])
      return (node: LocationNodeType) => {
        const kindStr = node.kind.toString().toUpperCase()
        return allowedKinds.has(node.kind as LocationType) ||
               allowedKinds.has(kindStr)
      }
    }

    return () => true
  }, [useCase])

  const filterTree = useMemo(() => {
    const filterNode = (node: TreeNode<LocationNodeType>): (TreeNode<LocationNodeType> & { isSelectable?: boolean }) | null => {
      const hasChildren = node.children && node.children.length > 0
      const nodeMatchesFilter = matchesFilter(node)

      if (hasChildren) {
        const filteredChildren = node.children
          .map(child => filterNode(child))
          .filter((child): child is TreeNode<LocationNodeType> & { isSelectable?: boolean } => child !== null)

        if (nodeMatchesFilter) {
          return {
            ...node,
            children: filteredChildren,
            isSelectable: true,
          }
        }

        if (filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren,
            isSelectable: false,
          }
        }

        return null
      } else {
        if (nodeMatchesFilter) {
          return {
            ...node,
            children: [],
            isSelectable: true,
          }
        }
        return null
      }
    }

    return filterNode
  }, [matchesFilter])

  const treeData = useMemo(() => {
    if (!data?.locationNodes) return []
    const nodes = data.locationNodes as LocationNodeType[]

    let allNodes = nodes

    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase()
      const searchFiltered = allNodes.filter(n =>
        n.title.toLowerCase().includes(lower) ||
        n.kind.toString().toLowerCase().includes(lower))
      const searchIds = new Set(searchFiltered.map(n => n.id))
      const parentIds = new Set<string>()
      searchFiltered.forEach(n => {
        let current: LocationNodeType | undefined = n
        while (current?.parentId) {
          parentIds.add(current.parentId)
          current = nodes.find(node => node.id === current?.parentId)
        }
      })
      allNodes = allNodes.filter(n => searchIds.has(n.id) || parentIds.has(n.id))
    }

    const fullTree = buildTree(allNodes)

    if (useCase === 'default') {
      return fullTree.map(node => ({ ...node, isSelectable: true })) as Array<TreeNode<LocationNodeType> & { isSelectable: boolean }>
    }

    const filtered = fullTree
      .map(filterTree)
      .filter((node): node is TreeNode<LocationNodeType> & { isSelectable?: boolean } => node !== null)

    return filtered
  }, [data, searchQuery, useCase, filterTree])

  const handleToggleSelect = (node: LocationNodeType, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      if (useCase === 'clinic' || !multiSelect) {
        newSet.clear()
      }


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
    if (selectedIds.size === 0) return
    const nodes = data.locationNodes as LocationNodeType[]

    const finalSelectedIds = Array.from(selectedIds)
    const selectedNodes = nodes.filter(n => finalSelectedIds.includes(n.id))
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
          {useCase === 'clinic' ? translation('pickClinic') :
           useCase === 'position' ? translation('pickPosition') :
           useCase === 'teams' ? translation('pickTeams') :
           useCase === 'root' ? translation('selectRootLocation') :
           translation('selectLocation')}
        </div>
      )}
      description={
        useCase === 'clinic' ? translation('pickClinicDescription') :
        useCase === 'position' ? translation('pickPositionDescription') :
        useCase === 'teams' ? translation('pickTeamsDescription') :
        useCase === 'root' ? translation('selectRootLocationDescription') :
        translation('selectLocationDescription')
      }
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

          {multiSelect && useCase !== 'root' && (
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
                  isSelectable={node.isSelectable ?? true}
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
        <Button
          onClick={handleConfirm}
          disabled={selectedIds.size === 0 || (useCase === 'clinic' && selectedIds.size !== 1)}
        >
          {translation('confirmSelection')} ({selectedIds.size})
        </Button>
      </div>
    </Dialog>
  )
}
