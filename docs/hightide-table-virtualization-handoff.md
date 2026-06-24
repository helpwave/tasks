# Handoff: Add row virtualization (windowing) to the hightide `Table`

**Audience:** an agent (or developer) working in **`helpwave/hightide`** with full source + build access.
**Why this exists:** `helpwave/tasks` needs the Patient/Task **table** views to render large, infinitely-scrolled lists without mounting every row to the DOM. The **card** views in tasks are already windowed locally (`web/components/common/VirtualizedCardGrid.tsx` + `web/utils/virtualGrid.ts`), but the tables render through hightide's `TableDisplay`, which has no virtualization seam today. We want the virtualization to live in **hightide** (the design system), not be forked into the app — hence this handoff.

This document was produced **without access to the hightide source** (only the published `@helpwave/hightide@0.10.3` compiled bundle), so paths/imports below are inferred from the bundle and the build comments. Treat the code as a **reference implementation** to adapt to the real source, not a literal patch.

---

## 1. Goal

Add an opt-in **row virtualization** mode to the hightide table so a consumer can do:

```tsx
<TableProvider data={rows} columns={columns} state={...}>
  <TableDisplay virtualized />        {/* only visible rows are in the DOM */}
</TableProvider>
```

Requirements:
- **Only render the visible rows** (plus a small overscan). A 500+ row table should keep the `<tbody>` row count in the low tens.
- **Harmonize with document-scroll infinite scrolling.** In tasks the list scrolls with the **page** (window), and an `InfiniteScrollSentinel` placed *below* the table loads the next page as you approach the bottom. So the default virtualization must track the **window scroll**, not a bounded inner scroll container. (Offer a bounded-container mode too — see §6.)
- **Preserve everything the current table does**: sorting, filtering, column visibility/ordering/sizing, row click, selection, sticky header, the `data-name`/`className` conventions used by the theme CSS.
- **Backward compatible**: `virtualized` defaults to `false`; existing tables are untouched.

---

## 2. How the hightide table is structured (from the 0.10.3 bundle)

Source lives under `src/components/layout/table/` (per build comments: `TableDisplay.tsx`, `TableHeader.tsx`, `TablePagination.tsx`, plus the body/context modules).

- **`TableProvider<T>`** builds the `@tanstack/react-table` instance (`useReactTable`) from `data`, `columns`, `state`, `initialState`, `onRowClick`, etc., and provides several contexts. `TableWithSelectionProvider` wraps it with row selection.
- **Contexts / hooks:**
  - `useTableStateContext<T>()` → `{ table, ... }` — the full table instance (includes column sizing).
  - `useTableStateWithoutSizingContext<T>()` → `{ table, isUsingFillerRows, fillerRowCell, onRowClick, onFillerRowClick, columnVisibility, columnOrder, ... }` — used by the body and header.
  - `useTableContainerContext<T>()` → `{ containerRef }` — the scroll/measure container ref.
- **`TableDisplay`** (the piece we extend) renders, roughly:
  ```tsx
  const { table } = useTableStateContext();
  const { containerRef } = useTableContainerContext();
  return (
    <div {...containerProps} ref={containerRef} data-name="table-container">
      <table {...props} data-name="table"
             style={{ width: Math.floor(Math.max(table.getTotalSize(),
                                                  containerRef.current?.offsetWidth ?? table.getTotalSize())),
                      ...props.style }}>
        {children}
        <TableHeader {...tableHeaderProps} />
        <TableBody />          {/* <- the non-virtualized body, always rendered today */}
      </table>
    </div>
  );
  ```
- **`TableBody` (internally `TableBodyVisual`)** renders the full body:
  ```tsx
  const { table, isUsingFillerRows, fillerRowCell, onRowClick, onFillerRowClick } =
    useTableStateWithoutSizingContext();
  const rows = table.getRowModel().rows;
  return (
    <tbody>
      {rows.map((row) => (
        <tr key={row.id}
            onClick={() => onRowClick?.(row, table)}
            data-clickable={PropsUtil.dataAttributes.bool(!!onRowClick)}
            data-name="table-body-row"
            className={clsx(BagFunctionUtil.resolve(table.options.meta?.bodyRowClassName, row.original))}>
          {row.getVisibleCells().map((cell) => (
            <td key={cell.id} data-name="table-body-cell"
                className={clsx(cell.column.columnDef.meta?.className)}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
      {/* filler rows when isUsingFillerRows: range(pageSize - rows.length) -> empty <tr> */}
    </tbody>
  );
  ```
- **`TableHeader = ({ isSticky = false }) => ...`** renders `<thead>` from `useTableStateWithoutSizingContext()`, handles column resizing, and supports a sticky header. **Reuse it as-is.**
- **Column widths are explicit.** Columns define `size` (consumers set e.g. `size: 60/300/...`), and the `<table>` width is `table.getTotalSize()`. **This is important:** because columns are fixed-width, we can use the **padding-row** technique (below) without column reflow while scrolling.

---

## 3. Recommended API

Add a `virtualized` prop to `TableProvider`-fed display. Minimal surface:

```ts
type TableVirtualizationOptions = {
  /** estimated row height in px; refined by measurement. Default ~48. */
  estimateRowHeight?: number;
  /** rows rendered above/below the viewport. Default 8. */
  overscan?: number;
  /** 'window' (page scroll, default) | 'container' (scroll inside the table container) */
  scroll?: 'window' | 'container';
};

interface TableDisplayProps /* ...extends TableHTMLAttributes */ {
  virtualized?: boolean | TableVirtualizationOptions;
}
```

In `TableDisplay`, swap the body when enabled:

```tsx
{children}
<TableHeader {...tableHeaderProps} isSticky={tableHeaderProps?.isSticky} />
{virtualized
  ? <VirtualizedTableBody {...(typeof virtualized === 'object' ? virtualized : {})} />
  : <TableBody />}
```

Keep `<TableHeader isSticky />` working — with window virtualization the header stays in normal table flow and `position: sticky` continues to pin it to the viewport top, which is what we want.

Add **`@tanstack/react-virtual`** (`^3.13`) to hightide `dependencies` (compatible with `@tanstack/react-table@8.21.3` and the React 19 peer).

---

## 4. Reference implementation — `VirtualizedTableBody.tsx`

Place next to `TableBody` and export it from the package barrel. Adapt the import paths (context hook, `PropsUtil`, `BagFunctionUtil`, `clsx`) to the real source.

```tsx
import { useEffect, useRef, useState } from 'react'
import { flexRender } from '@tanstack/react-table'
import { useWindowVirtualizer, useVirtualizer } from '@tanstack/react-virtual'
import clsx from 'clsx'
import { useTableStateWithoutSizingContext } from './tableContexts' // adapt path
import { useTableContainerContext } from './tableContexts'          // adapt path
import { PropsUtil, BagFunctionUtil } from '../../../util'          // adapt path

export type VirtualizedTableBodyProps = {
  estimateRowHeight?: number
  overscan?: number
  scroll?: 'window' | 'container'
}

export function VirtualizedTableBody({
  estimateRowHeight = 48,
  overscan = 8,
  scroll = 'window',
}: VirtualizedTableBodyProps) {
  const { table, onRowClick } = useTableStateWithoutSizingContext()
  const { containerRef } = useTableContainerContext()
  const rows = table.getRowModel().rows

  const bodyRef = useRef<HTMLTableSectionElement | null>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  // For window-scroll mode, the virtualizer needs the body's offset from the
  // top of the document so it can map window scroll -> row positions.
  useEffect(() => {
    if (scroll !== 'window') return
    const el = bodyRef.current
    if (!el || typeof window === 'undefined') return
    const measure = () => {
      const next = el.getBoundingClientRect().top + window.scrollY
      setScrollMargin((prev) => (Math.abs(prev - next) < 1 ? prev : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [scroll, rows.length])

  const common = {
    count: rows.length,
    estimateSize: () => estimateRowHeight,
    overscan,
    getItemKey: (index: number) => rows[index]?.id ?? index,
  }

  // Hooks must be called unconditionally; pick which result to use by `scroll`.
  const windowVirtualizer = useWindowVirtualizer({ ...common, scrollMargin })
  const containerVirtualizer = useVirtualizer({
    ...common,
    getScrollElement: () => containerRef.current,
  })
  const virtualizer = scroll === 'window' ? windowVirtualizer : containerVirtualizer
  const offset = scroll === 'window' ? scrollMargin : 0

  const items = virtualizer.getVirtualItems()
  const total = virtualizer.getTotalSize()
  const paddingTop = items.length ? items[0].start - offset : 0
  const paddingBottom = items.length ? total - (items[items.length - 1].end - offset) : 0
  const columnCount = table.getVisibleLeafColumns().length

  return (
    <tbody ref={bodyRef}>
      {paddingTop > 0 && (
        <tr aria-hidden="true">
          <td colSpan={columnCount} style={{ height: paddingTop, padding: 0, border: 0 }} />
        </tr>
      )}
      {items.map((vItem) => {
        const row = rows[vItem.index]
        if (!row) return null
        return (
          <tr
            key={vItem.key}
            data-index={vItem.index}
            ref={virtualizer.measureElement}        // dynamic row-height measurement
            onClick={() => onRowClick?.(row, table)}
            data-clickable={PropsUtil.dataAttributes.bool(!!onRowClick)}
            data-name="table-body-row"
            className={clsx(BagFunctionUtil.resolve(table.options.meta?.bodyRowClassName, row.original))}
          >
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                data-name="table-body-cell"
                className={clsx(cell.column.columnDef.meta?.className)}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        )
      })}
      {paddingBottom > 0 && (
        <tr aria-hidden="true">
          <td colSpan={columnCount} style={{ height: paddingBottom, padding: 0, border: 0 }} />
        </tr>
      )}
    </tbody>
  )
}
```

### Why padding rows (not absolute positioning)
A `<tr>`/`<td>` cannot be `position: absolute` without breaking native table column sizing. The padding-row technique keeps rows in normal table flow: a single spacer `<tr>` of height `paddingTop`, the windowed rows, then a spacer of height `paddingBottom`. Column widths stay correct because hightide columns have explicit `size`. `measureElement` + `data-index` still gives accurate per-row heights for variable-height rows.

---

## 5. Important: filler rows
`TableBodyVisual` renders **filler rows** when `isUsingFillerRows` (pads up to `pageSize`). Filler rows are a fixed-page-size affordance and are **incompatible with virtualization** (and unnecessary — virtualization already fills the scroll height). When `virtualized` is on, **ignore `isUsingFillerRows`** (do not render fillers), and consider warning in dev if both are set. Document this in the prop JSDoc.

---

## 6. Scroll modes
- **`window` (default)** — for consumers whose list scrolls with the page and use a sentinel below the table (the tasks case). Uses `useWindowVirtualizer` + a `scrollMargin` equal to the body's document offset (recomputed on resize/row-count change).
- **`container`** — for a bounded, internally-scrolling table. Uses `useVirtualizer({ getScrollElement: () => containerRef.current })`. `TableDisplay`'s container (`data-name="table-container"`) would need `overflow-y: auto` + a height for this mode.

Default to `window` so it drops into the tasks lists with no layout change.

---

## 7. Edge cases / gotchas
- **Stable column widths are a precondition.** Virtualization assumes columns don't reflow as rows enter/leave the window. hightide columns use explicit `size` → fine. If a consumer relies on content-auto-width columns, widths can jitter while scrolling; document that virtualized tables should use defined column sizes (`hightide` already computes `getTotalSize()`).
- **Sticky header:** keep `TableHeader isSticky`. In window mode the `<thead>`'s `position: sticky` pins to the viewport; verify with a tall table.
- **SSR/hydration:** guard `window`/`ResizeObserver` (the `useEffect` already does). `useWindowVirtualizer` is SSR-safe (renders nothing until mounted); ensure the first client render doesn't mismatch — if hightide SSRs tables, render the normal `<TableBody>` until mounted (mirror the `isMounted` gate used in tasks' `VirtualizedCardGrid`).
- **Row selection / expansion / pinning:** all read from the same `table` instance, so they keep working; just make sure selection checkboxes live in column cells (they do).
- **`measureElement` + padding rows:** only the data `<tr>`s carry `data-index` + the `measureElement` ref; spacer rows are ignored by the measurer. Good.
- **Empty state:** `rows.length === 0` → no padding, no items; render any existing empty-state affordance as today.

---

## 8. Consumer adoption in `helpwave/tasks` (after hightide ships)
Once released (e.g. `@helpwave/hightide@0.11.0`), in tasks:
- `web/components/tables/PatientList.tsx` — the table is rendered at ~line 1210: `<TableDisplay className="print-content hw-autosize-table overflow-x-auto hw-touch-scroll" />` → add `virtualized`.
- `web/components/tables/TaskList.tsx` — ~line 1063: `<TableDisplay className="print-content hw-autosize-table w-full overflow-x-auto hw-touch-scroll" />` → add `virtualized`.
- Keep the existing `InfiniteScrollSentinel` + "Load more" *below* the table (window mode harmonizes with it).
- Reference patterns already in tasks: `web/components/common/VirtualizedCardGrid.tsx` (window virtualizer + `isMounted` gate + ResizeObserver scroll-margin) and `web/utils/virtualGrid.ts`.
- Verify the `hw-autosize-table` class doesn't fight fixed column widths under virtualization; if it enables content-auto-sizing, prefer the columns' explicit `size`.

---

## 9. Validation checklist (in hightide)
- [ ] `@tanstack/react-virtual` added to `dependencies`; build/types pass.
- [ ] New `VirtualizedTableBody` + `virtualized` prop on `TableDisplay`; exported from the barrel; `.d.ts` updated.
- [ ] Storybook/example story with 1,000+ rows: DOM has only ~visible rows; smooth scroll; **no column width jitter**; sticky header pins; sorting/filtering/column-show-hide/reorder still work; row click + selection work.
- [ ] Non-virtualized tables unchanged (snapshot/visual).
- [ ] Lint + unit tests; add a test that `getRowModel().rows` beyond the window are not rendered (e.g. assert rendered `tr[data-name="table-body-row"]` count ≪ row count).
- [ ] Changelog + minor version bump.

## 10. PR checklist
- [ ] Branch e.g. `feat/table-row-virtualization`.
- [ ] PR title: `feat(table): opt-in row virtualization (windowing)`.
- [ ] PR body: motivation (large lists in helpwave/tasks), API (`virtualized` prop), scroll modes, filler-row incompatibility note, screenshots/Storybook link.
- [ ] Mention the downstream adoption PR in `helpwave/tasks` (PatientList/TaskList) as a follow-up.

---

### One-line summary for the implementing agent
Add `@tanstack/react-virtual`, create `VirtualizedTableBody` that windows `table.getRowModel().rows` via `useWindowVirtualizer` with top/bottom **padding `<tr>`s** (reusing `flexRender` + the `data-name="table-body-row|cell"` conventions and the existing `TableHeader`), and gate it behind a new `virtualized` prop on `TableDisplay`. Default to window-scroll so it drops into helpwave/tasks' infinitely-scrolled Patient/Task tables unchanged.
