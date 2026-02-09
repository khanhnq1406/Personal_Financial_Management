# ErrorMessage Component

Enhanced error message component with severity levels according to the UI/UX optimization plan (section 4.3).

## Features

- **Three severity levels**: `error`, `warning`, `info`
- **Visual icons** for each severity level
- **Color-coded styling** using the design system colors
- **Rounded borders** with proper padding for better visual appearance
- **Accessible** with proper ARIA attributes (`role`, `aria-live`)
- **Fully backward compatible** with existing usage

## Props

```typescript
interface ErrorMessageProps {
  id?: string;              // Optional ID for accessibility
  children: React.ReactNode; // Message content
  severity?: "error" | "warning" | "info"; // Message severity (default: "error")
  className?: string;       // Optional additional CSS classes
}
```

## Usage

### Basic Error Message (Default)

```tsx
{errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
```

### Warning Message

```tsx
<ErrorMessage severity="warning">
  This wallet has a low balance. Consider transferring funds.
</ErrorMessage>
```

### Info Message

```tsx
<ErrorMessage severity="info">
  Your market data was last updated 5 minutes ago.
</ErrorMessage>
```

### With ID for Accessibility

```tsx
<ErrorMessage id="email-error" severity="error">
  Invalid email format
</ErrorMessage>
```

### With Custom Styling

```tsx
<ErrorMessage severity="warning" className="mb-6">
  Custom spacing applied
</ErrorMessage>
```

## Visual Appearance

### Error (Red)
- Background: `danger-50` (#FEF2F2)
- Border: `danger-200` (#FECACA)
- Text: `danger-700` (#B91C1C)
- Icon: X in circle

### Warning (Gold)
- Background: `secondary-50` (#FFFBEB)
- Border: `secondary-200` (#FDE68A)
- Text: `secondary-700` (#B45309)
- Icon: Warning triangle

### Info (Blue)
- Background: `primary-50` (#EFF6FF)
- Border: `primary-200` (#BFDBFE)
- Text: `primary-700` (#1D4ED8)
- Icon: Information circle

## Accessibility

- Uses `role="alert"` for errors (high priority)
- Uses `role="status"` for warnings and info (lower priority)
- `aria-live="assertive"` for errors (immediate announcement)
- `aria-live="polite"` for warnings and info (announced when convenient)
- Icons use `aria-hidden="true"` to avoid redundant screen reader announcements

## Examples in Forms

### React Hook Form Integration

```tsx
"use client";

import { useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/forms/ErrorMessage";
import { Button } from "@/components/Button";

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [apiError, setApiError] = useState<string>();

  const onSubmit = async (data) => {
    try {
      await submitData(data);
    } catch (error) {
      setApiError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* API-level error */}
      {apiError && <ErrorMessage>{apiError}</ErrorMessage>}

      {/* Field-level error */}
      <input {...register("email", { required: "Email is required" })} />
      {errors.email && (
        <ErrorMessage id="email-error">
          {errors.email.message}
        </ErrorMessage>
      )}

      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Multiple Severity Levels in One Form

```tsx
export function ComplexForm() {
  const [lowBalance, setLowBalance] = useState(false);
  const [validationError, setValidationError] = useState<string>();
  const [infoMessage, setInfoMessage] = useState<string>();

  return (
    <form>
      {/* Error: Critical issues */}
      {validationError && (
        <ErrorMessage severity="error">
          {validationError}
        </ErrorMessage>
      )}

      {/* Warning: Non-critical issues */}
      {lowBalance && (
        <ErrorMessage severity="warning">
          Your balance is low. Consider adding funds before making large transactions.
        </ErrorMessage>
      )}

      {/* Info: Helpful information */}
      {infoMessage && (
        <ErrorMessage severity="info">
          {infoMessage}
        </ErrorMessage>
      )}

      {/* Form fields */}
    </form>
  );
}
```

## Migration Guide

### Before (Old Style)

```tsx
{error && (
  <div className="text-danger-600 text-sm mt-1" role="alert">
    {error}
  </div>
)}
```

### After (Enhanced)

```tsx
{error && <ErrorMessage>{error}</ErrorMessage>}
```

**No changes required!** The component is fully backward compatible.

To use new severity levels, simply add the `severity` prop:

```tsx
{warning && <ErrorMessage severity="warning">{warning}</ErrorMessage>}
{info && <ErrorMessage severity="info">{info}</ErrorMessage>}
```

## Design System Integration

This component follows the UI/UX Optimization Plan (section 4.3) and uses:

- **Color palette**: Uses design system color tokens (primary, secondary, danger)
- **Spacing**: Responsive padding (`p-3 sm:p-4`)
- **Typography**: Small font size (`text-sm`) with medium weight
- **Border radius**: Rounded (`rounded-lg`)
- **Shadows**: Inherits from design system

## Related Components

- `FormInput` - Uses ErrorMessage for field validation errors
- `FormSelect` - Uses ErrorMessage for field validation errors
- `FormNumberInput` - Uses ErrorMessage for field validation errors
- `FormDateTimePicker` - Uses ErrorMessage for field validation errors

## Testing

Example file: `ErrorMessage.example.tsx` demonstrates all severity levels and usage patterns.

To test visually, render the example component in your application.

## References

- UI/UX Optimization Plan: `/docs/UI_UX_OPTIMIZATION_PLAN.md` (section 4.3)
- Design System: `/src/wj-client/tailwind.config.ts`
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
