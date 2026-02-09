# Fix FormSelect Option Selection Bug

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the bug where users cannot select options in FormSelect when typing to search

**Architecture:** The issue is a timing conflict between the input's `onBlur` event and the option's `onClick` event. When a user clicks an option after typing, the blur fires first and may interfere with click registration. We need to prevent blur from interfering with option clicks by delaying blur handling or checking if the click target is within the dropdown.

**Tech Stack:** React 19, TypeScript, React Hook Form

---

## Problem Analysis

**Root Cause:** In [Select.tsx](src/wj-client/components/select/Select.tsx:336), the `onBlur` event fires immediately when the user clicks outside the input. This sets `isFocused = false`, which triggers the `useEffect` (lines 136-149) to update `inputValue`. If the user clicks an option in the dropdown, the blur may interfere with the click event registration.

**Current Event Sequence:**
1. User types in input → `inputValue` updates, dropdown opens
2. User clicks an option → input `onBlur` fires immediately
3. `handleBlur` sets `isFocused = false`
4. The click event on the option may not register properly due to timing

**Solution:** Use `relatedTarget` from the blur event to detect if the user clicked within the component container. If so, don't mark as blurred.

---

## Task 1: Write Failing Test for Option Selection After Typing

**Files:**
- Create: `src/wj-client/components/select/Select.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Select } from "./Select";

describe("Select - Option Selection After Typing", () => {
  it("should allow selecting an option after typing to filter", async () => {
    const options = [
      { value: "apple", label: "Apple" },
      { value: "banana", label: "Banana" },
      { value: "cherry", label: "Cherry" },
    ];

    const handleChange = jest.fn();
    render(
      <Select
        options={options}
        value=""
        onChange={handleChange}
        placeholder="Select a fruit"
      />
    );

    const input = screen.getByRole("combobox");

    // Type to filter options
    fireEvent.change(input, { target: { value: "ban" } });

    // Wait for dropdown to appear and filter to apply
    await waitFor(() => {
      expect(screen.getByText("Banana")).toBeInTheDocument();
    });

    // Click on the filtered option
    const bananaOption = screen.getByText("Banana");
    fireEvent.click(bananaOption);

    // Verify the selection was made
    expect(handleChange).toHaveBeenCalledWith("banana");
  });

  it("should not interfere with option clicks when blur event fires", async () => {
    const options = [
      { value: "1", label: "Option 1" },
      { value: "2", label: "Option 2" },
    ];

    const handleChange = jest.fn();
    render(
      <Select
        options={options}
        value=""
        onChange={handleChange}
      />
    );

    const input = screen.getByRole("combobox");

    // Focus the input
    input.focus();
    fireEvent.change(input, { target: { value: "Option" } });

    // Wait for options to appear
    await waitFor(() => {
      expect(screen.getByText("Option 1")).toBeInTheDocument();
    });

    // Click option (blur will fire before click)
    const option1 = screen.getByText("Option 1");
    fireEvent.click(option1);

    // Selection should still work
    expect(handleChange).toHaveBeenCalledWith("1");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd src/wj-client && npm test -- Select.test.tsx --no-coverage`

Expected: FAIL - Test will fail because blur interferes with click

**Step 3: (No implementation yet - this is just writing the test)**

---

## Task 2: Fix the Blur Event Handling in Select Component

**Files:**
- Modify: `src/wj-client/components/select/Select.tsx:261-263`

**Step 1: Implement the fix using relatedTarget**

Replace the `handleBlur` function to check if the click target is within the component:

```tsx
const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  // Check if the new focus target is within our container
  // This prevents blur from interfering with option clicks
  const relatedTarget = e.relatedTarget as Node;
  const isClickingInside = containerRef.current?.contains(relatedTarget);

  if (!isClickingInside) {
    setIsFocused(false);
  }
};
```

**Step 2: Run the test**

Run: `cd src/wj-client && npm test -- Select.test.tsx --no-coverage`

Expected: PASS - The option click should now work after typing

**Step 3: Manual verification**

Test in browser:
1. Go to any page with FormSelect (e.g., Transaction page)
2. Click to open the dropdown
3. Type to filter options
4. Click on an option
5. Verify the option is selected

**Step 4: Commit**

```bash
git add src/wj-client/components/select/Select.tsx src/wj-client/components/select/Select.test.tsx
git commit -m "fix(select): fix option selection after typing by checking relatedTarget in blur handler"
```

---

## Task 3: Add Test for FormSelect Integration

**Files:**
- Create: `src/wj-client/components/forms/FormSelect.test.tsx`

**Step 1: Write integration test for FormSelect**

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FormSelect } from "./FormSelect";
import { useForm } from "react-hook-form";

describe("FormSelect - Integration", () => {
  it("should allow selecting options after typing in form context", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      const methods = useForm({
        defaultValues: { fruit: "" },
      });
      return <form>{children}</form>;
    };

    const options = [
      { value: 1, label: "Apple" },
      { value: 2, label: "Banana" },
      { value: 3, label: "Cherry" },
    ];

    const onSubmit = jest.fn();

    const TestComponent = () => {
      const { control, handleSubmit } = useForm({
        defaultValues: { fruit: "" },
      });

      return (
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormSelect
            name="fruit"
            control={control}
            label="Select Fruit"
            options={options}
          />
          <button type="submit">Submit</button>
        </form>
      );
    };

    render(<TestComponent />);

    const input = screen.getByRole("combobox", { name: /select fruit/i });

    // Type to filter
    fireEvent.change(input, { target: { value: "ban" } });

    // Wait for filtered options
    await waitFor(() => {
      expect(screen.getByText("Banana")).toBeInTheDocument();
    });

    // Click the option
    const bananaOption = screen.getByText("Banana");
    fireEvent.click(bananaOption);

    // Submit and verify value
    const submitButton = screen.getByText("Submit");
    fireEvent.click(submitButton);

    // The form should have the selected value
    expect(onSubmit).toHaveBeenCalled();
  });
});
```

**Step 2: Run test**

Run: `cd src/wj-client && npm test -- FormSelect.test.tsx --no-coverage`

Expected: PASS - FormSelect integration works correctly

**Step 3: Commit**

```bash
git add src/wj-client/components/forms/FormSelect.test.tsx
git commit -m"test(formselect): add integration test for option selection after typing"
```

---

## Task 4: Verify Edge Cases

**Files:**
- Test: Manual browser testing
- Verify: `src/wj-client/components/select/Select.tsx`

**Step 1: Test keyboard navigation still works**

Manual test:
1. Open dropdown with keyboard (ArrowDown)
2. Type to filter
3. Use Arrow keys to navigate
4. Press Enter to select
5. Verify selection works

**Step 2: Test click outside still closes dropdown**

Manual test:
1. Type to filter options
2. Click outside the component
3. Verify dropdown closes
4. Verify value resets to last selected or empty

**Step 3: Test Tab key behavior**

Manual test:
1. Type to filter
2. Press Tab
3. Verify dropdown closes and focus moves

**Step 4: Test with disableFilter prop**

Manual test:
1. Use Select with `disableFilter={true}` (like SymbolAutocomplete does)
2. Type to search
3. Click option
4. Verify selection works

**Step 5: Update test coverage if any edge case fails**

Run: `cd src/wj-client && npm test -- --coverage -- Select`

---

## Task 5: Documentation and Final Verification

**Files:**
- Check: All FormSelect usage in codebase
- Update: Component documentation if needed

**Step 1: Search for FormSelect usage**

Run: `grep -r "FormSelect" src/wj-client/app --include="*.tsx" | head -20`

Verify the fix works in all these contexts:
- Transaction form
- Wallet selection
- Investment forms
- Budget forms

**Step 2: Update JSDoc if needed**

If behavior changed, update the Select component's JSDoc comment (lines 74-108 in Select.tsx).

**Step 3: Run all related tests**

Run: `cd src/wj-client && npm test -- --selectProjects=frontend`

**Step 4: Final commit**

```bash
git add .
git commit -m"docs(select): update documentation for blur handling fix"
```

---

## Summary

**Total Tasks:** 5
**Estimated Time:** 30-45 minutes
**Files Modified:**
- `src/wj-client/components/select/Select.tsx` (fix blur handling)
- `src/wj-client/components/select/Select.test.tsx` (new tests)
- `src/wj-client/components/forms/FormSelect.test.tsx` (new integration tests)

**Key Changes:**
1. Check `relatedTarget` in `handleBlur` to prevent interference with option clicks
2. Add comprehensive tests for typing + clicking interaction
3. Verify all edge cases still work

**Testing Strategy:**
1. Unit tests for Select component
2. Integration tests for FormSelect
3. Manual browser testing for edge cases
4. Verify existing usages still work

---

## References

- Related: [SymbolAutocomplete.tsx](src/wj-client/components/forms/SymbolAutocomplete.tsx) - uses Select with disableFilter
- Related: [CreatableSelect.tsx](src/wj-client/components/select/CreatableSelect.tsx) - may have similar issue
- Issue: User cannot select option after typing to search
