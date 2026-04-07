# Adding New Queries or Mutations (Frontend)

This guide describes how to add a new GraphQL query or mutation on the frontend: define the operation in a `.graphql` file, generate typed code, and expose it via a hook in `data/hooks/`.

## 1. Define the operation in a `.graphql` file

- Place `.graphql` files under `api/graphql/`.
- Naming: `Get*.graphql` for queries, `*Mutations.graphql` or domain-specific files for mutations.
- Use the same operation and variable names as the backend schema.

**Example query** (`api/graphql/GetTask.graphql`):

```graphql
query GetTask($id: ID!) {
  task(id: $id) {
    id
    title
    description
    done
    dueDate
    priority
    estimatedTime
    checksum
    patient { id name }
    assignee { id name avatarUrl lastOnline isOnline }
    assigneeTeam { id title kind }
    properties { ... }
  }
}
```

**Example mutation** (e.g. in `api/graphql/TaskMutations.graphql`):

```graphql
mutation UpdateTask($id: ID!, $data: UpdateTaskInput!) {
  updateTask(id: $id, data: $data) {
    id
    title
    description
    done
    dueDate
    priority
    estimatedTime
    updateDate
    checksum
    patient { id name }
    assignee { id name avatarUrl lastOnline isOnline }
    properties { ... }
  }
}
```

## 2. Generate typed code

From the `web/` directory run:

```bash
npm run generate-graphql
```

This uses `codegen.ts` (GraphQL Codegen with `typescript` and `typescript-operations`) to:

- Read the schema from the configured GraphQL endpoint
- Scan `api/graphql/**/*.graphql`
- Emit types and document strings into `api/gql/generated.ts`

You get:

- `GetTaskDocument` / `UpdateTaskDocument` (string representation of the operation)
- `GetTaskQuery`, `GetTaskQueryVariables`
- `UpdateTaskMutation`, `UpdateTaskMutationVariables`
- Input types such as `UpdateTaskInput`

**Workspace rule:** After changing any `*.graphql` file, run `npm run generate-graphql` (and optionally `npm run build-intl` if you touch `*.arb`).

## 3. Add a query hook

- Use `useQueryWhenReady` from `data/hooks/queryHelpers.ts` with the generated document and variable types.
- Export a small hook that forwards variables and returns `{ data, loading, error, refetch }` (and optionally a narrowed `data` field).

**Example** (`data/hooks/useTask.ts`):

```ts
import {
  GetTaskDocument,
  type GetTaskQuery,
  type GetTaskQueryVariables
} from '@/api/gql/generated'
import { useQueryWhenReady } from './queryHelpers'

export type UseTaskResult = {
  data: GetTaskQuery['task'] | undefined
  loading: boolean
  error: Error | undefined
  refetch: () => void
}

export function useTask(id: string, options?: { skip?: boolean }): UseTaskResult {
  const result = useQueryWhenReady<GetTaskQuery, GetTaskQueryVariables>(
    GetTaskDocument,
    { id },
    options
  )
  return {
    ...result,
    data: result.data?.task,
  }
}
```

Then export the hook from `data/hooks/index.ts`.

## 4. Add a mutation hook

- Use `useMutateOptimistic` from `hooks/useMutateOptimistic.ts` and pass the parsed document via `getParsedDocument` from `data/hooks/queryHelpers.ts`.
- For mutations that should update the UI immediately and support conflict handling, add an **optimistic plan** (see step 5).
- Return a stable `mutate` function and `{ loading, error }` (and optional `data`).

**Example** (`data/hooks/useUpdateTask.ts`):

```ts
import { useCallback, useState } from 'react'
import {
  UpdateTaskDocument,
  type UpdateTaskMutation,
  type UpdateTaskMutationVariables
} from '@/api/gql/generated'
import { updateTaskOptimisticPlan, updateTaskOptimisticPlanKey } from '@/api/mutations/tasks/updateTask.plan'
import { getParsedDocument } from './queryHelpers'
import { useMutateOptimistic } from '@/hooks/useMutateOptimistic'
import { useConflictOnConflict } from '@/providers/ConflictProvider'

type MutateOptions = {
  variables: UpdateTaskMutationVariables
  onCompleted?: (data: UpdateTaskMutation['updateTask']) => void
  onError?: (error: Error) => void
}

export function useUpdateTask() {
  const mutateOptimisticFn = useMutateOptimistic()
  const onConflict = useConflictOnConflict()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (options: MutateOptions): Promise<UpdateTaskMutation['updateTask'] | undefined> => {
      setError(null)
      setLoading(true)
      try {
        const data = await mutateOptimisticFn<UpdateTaskMutation, UpdateTaskMutationVariables>({
          document: getParsedDocument(UpdateTaskDocument),
          variables: options.variables,
          optimisticPlan: updateTaskOptimisticPlan,
          optimisticPlanKey: updateTaskOptimisticPlanKey,
          onSuccess: (d) => options.onCompleted?.(d.updateTask),
          onError: (err) => {
            setError(err)
            options.onError?.(err)
          },
          onConflict: onConflict ?? undefined,
        })
        return data?.updateTask
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e))
        setError(err)
        options.onError?.(err)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [mutateOptimisticFn, onConflict]
  )

  return [mutate, { loading, error, data: undefined }] as const
}
```

Export the hook from `data/hooks/index.ts`.

## 5. Optional: optimistic plan for mutations

For mutations that modify a single entity and should reflect immediately in the UI (and integrate with subscriptions and conflict resolution), add a plan under `api/mutations/<domain>/`.

- **File:** `api/mutations/tasks/updateTask.plan.ts` (or `patients/`, etc.)
- **Content:** Define an `OptimisticPlan<TVariables>` with `getPatches(variables)` returning an array of `{ apply(cache, vars), rollback(cache, vars) }`. In `apply`, read the current entity from the cache (e.g. via the query used on the detail page), then `cache.modify` the entity with the mutation variables. In `rollback`, restore the previous snapshot with `cache.writeQuery`.
- **Registration:** Call `registerOptimisticPlan(planKey, plan)` so the mutation runner can find it by `optimisticPlanKey`.
- **Entity type:** For patient mutations, pass `entityType: 'Patient'` in the options to `mutateOptimisticFn`; otherwise the default is `'Task'`.

Types and registry:

- `data/mutations/types.ts`: `OptimisticPlan`, `OptimisticPatch`, `MutateOptimisticOptions`
- `data/mutations/registry.ts`: `registerOptimisticPlan`, `getOptimisticPlan`

The mutation hook then imports the plan and plan key and passes them into `mutateOptimisticFn`.

## 6. Checklist

1. Add or edit `api/graphql/**/*.graphql`.
2. Run `npm run generate-graphql`.
3. Implement a query hook with `useQueryWhenReady` and the generated document/types, or a mutation hook with `useMutateOptimistic` and `getParsedDocument`.
4. If the mutation should be optimistic and conflict-aware, add a plan in `api/mutations/<domain>/*.plan.ts` and register it; pass `entityType: 'Patient'` for patient mutations where applicable.
5. Export the new hook from `data/hooks/index.ts`.
