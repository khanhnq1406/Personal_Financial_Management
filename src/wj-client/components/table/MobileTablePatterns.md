# Mobile Table Action Buttons - UX Patterns

When dealing with action buttons in mobile tables with scrolling, here are the recommended UX patterns:

## Pattern 1: Inline Actions (Default) ✅

**Best for:** Tables with few rows (1-5 items) that fit on one screen

**How it works:** Actions appear at the bottom of each card

```tsx
<MobileTable
  data={transactions}
  columns={columns}
  renderActions={(row) => (
    <>
      <button onClick={() => handleEdit(row.id)}>Edit</button>
      <button onClick={() => handleDelete(row.id)}>Delete</button>
    </>
  )}
  actionsPosition="inline"
/>
```

**Pros:**
- Actions are always visible
- Easy to understand
- Good for multiple actions per row

**Cons:**
- Takes up space in each card
- Can be repetitive with many rows
- Actions scroll away with content

---

## Pattern 2: Swipe Actions (Future Enhancement) 🔜

**Best for:** Lists with primary action (delete, edit)

**How it would work:** Swipe left on a card to reveal actions (like iOS Mail)

```tsx
// Future implementation
<MobileTable
  data={transactions}
  columns={columns}
  swipeActions={{
    left: [
      { icon: 'edit', label: 'Edit', action: handleEdit },
      { icon: 'delete', label: 'Delete', action: handleDelete, variant: 'danger' }
    ]
  }}
/>
```

**Pros:**
- Saves screen space
- Native mobile feel
- Actions only appear when needed

**Cons:**
- Hidden gestures (discoverability issue)
- More complex to implement

---

## Pattern 3: Click Card → Action Sheet ⭐ Recommended

**Best for:** Tables with many rows where the primary action is "View Details"

**How it works:** Tapping the card opens a bottom sheet or modal with all actions

```tsx
// In your component
const [selectedRow, setSelectedRow] = useState<Transaction | null>(null);

<MobileTable
  data={transactions}
  columns={columns}
  getKey={(row) => row.id}
  onCardClick={setSelectedRow}  // Card is clickable
/>

{/* Action Sheet Modal */}
{selectedRow && (
  <ActionSheet onClose={() => setSelectedRow(null)}>
    <button onClick={() => handleViewDetails(selectedRow)}>
      View Details
    </button>
    <button onClick={() => handleEdit(selectedRow.id)}>
      Edit
    </button>
    <button onClick={() => handleDelete(selectedRow.id)} className="text-red">
      Delete
    </button>
  </ActionSheet>
)}
```

**Pros:**
- Clean card appearance
- Multiple actions available
- Works great with scrolling

**Cons:**
- Extra tap to access actions
- Requires modal/sheet component

---

## Pattern 4: Sticky Footer Button

**Best for:** Single-view lists (e.g., viewing investment transactions for one investment)

**How it works:** A sticky button at the bottom for the primary action

```tsx
<MobileTable
  data={transactions}
  columns={columns}
  actionsPosition="sticky"
  stickyActionLabel="View Transaction Details"
  onStickyActionClick={(row) => handleViewDetails(row)}
  maxHeight="45vh"
/>
```

**Note:** Currently implemented but best for single-item contexts. For multiple rows, consider Pattern 3 instead.

---

## Pattern 5: Long Press Menu (Advanced)

**Best for:** Power users, many actions

**How it works:** Long press on card shows context menu

```tsx
// Future implementation
<MobileTable
  data={transactions}
  columns={columns}
  onLongPress={(row) => showContextMenu(row)}
/>
```

**Pros:**
- Card stays clean
- Many actions available
- Native Android feel

**Cons:**
- Hidden interaction
- Not discoverable

---

## Current Implementation Recommendations

### For Transaction Page:
✅ **Keep inline actions** - Users need to quickly edit/delete transactions
```tsx
renderActions={(transaction) => (
  <>
    <button onClick={() => handleEdit(transaction.id)}>Edit</button>
    <button onClick={() => handleDelete(transaction.id)}>Delete</button>
  </>
)}
```

### For Portfolio Page:
✅ **Use Pattern 3 (Click Card)** - Each card opens investment details
```tsx
// Make the entire card clickable
<MobileTable
  data={investments}
  columns={columns}
  onCardClick={(investment) => openInvestmentDetailModal(investment.id)}
/>
```

### For Investment Detail Transactions:
✅ **Remove inline actions** - Transactions are read-only in this view
- If actions needed, add a "View" button that opens details
- Or make cards clickable to show transaction details

---

## Quick Implementation: Make Cards Clickable

To make the entire card clickable (Pattern 3):

```tsx
// Update MobileTable.tsx to add onCardClick prop

export interface MobileTableProps<T> {
  // ... existing props
  onCardClick?: (row: T) => void;
}

// In the component:
<BaseCard
  key={key}
  onClick={() => onCardClick?.(row)}
  className={onCardClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
>
  {/* ... card content */}
</BaseCard>
```

This gives immediate feedback and works perfectly with scrollable tables!
