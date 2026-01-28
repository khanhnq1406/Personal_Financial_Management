"use client";

import React, { useState, useRef, useEffect, KeyboardEvent, useCallback } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Option type for the Select component.
 * @template T - The type of the value (defaults to string)
 */
export interface SelectOption<T extends string = string> {
  /** Unique value for the option */
  value: T;
  /** Display label for the option */
  label: string;
  /** Optional custom render function for rich display in dropdown */
  render?: (option: SelectOption<T>) => React.ReactNode;
  /** Optional custom render function for selected value display */
  renderSelected?: (option: SelectOption<T>) => React.ReactNode;
}

/**
 * Props for the Select component
 * @template T - The type of the value (defaults to string)
 */
export interface SelectProps<T extends string = string> {
  /** Available options to select from */
  options: SelectOption<T>[];
  /** Currently selected value */
  value?: T;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Whether the select is in a loading state */
  isLoading?: boolean;
  /** Display value when the selected value is not in options (e.g., remote data) */
  displayValue?: string;
  /** Whether to show a clear button to reset the selection */
  clearable?: boolean;
  /** Custom render function for the dropdown container */
  renderDropdown?: (props: {
    children: React.ReactNode;
    className: string;
  }) => React.ReactNode;
  /** Custom render function for individual option items */
  renderOption?: (
    option: SelectOption<T>,
    props: {
      isSelected: boolean;
      isHighlighted: boolean;
      onSelect: () => void;
    }
  ) => React.ReactNode;
  /** Optional callback when dropdown opens */
  onOpen?: () => void;
  /** Optional callback when dropdown closes */
  onClose?: () => void;
}

/**
 * A reusable Select component with custom render support.
 *
 * Features:
 * - Generic type support for type-safe values
 * - Custom rendering for rich display options
 * - Keyboard navigation (arrow keys, enter, escape, tab)
 * - Loading state support
 * - Clear button support
 * - Click-outside-to-close
 * - Filter options based on input
 * - Highlight states
 * - ARIA attributes for accessibility
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Select
 *   options={[{ value: "apple", label: "Apple" }]}
 *   value={selected}
 *   onChange={setSelected}
 * />
 *
 * // With custom rendering
 * <Select
 *   options={[{
 *     value: "apple",
 *     label: "Apple",
 *     render: (opt) => <div><Icon /> {opt.label}</div>
 *   }]}
 *   value={selected}
 *   onChange={setSelected}
 * />
 * ```
 */
export function Select<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
  isLoading = false,
  displayValue,
  clearable = true,
  renderDropdown,
  renderOption,
  onOpen,
  onClose,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Update input value when selection changes externally
  useEffect(() => {
    if (selectedOption) {
      setInputValue(selectedOption.label);
    } else if (value === "" || value === undefined) {
      setInputValue("");
    } else if (displayValue) {
      setInputValue(displayValue);
    }
  }, [value, selectedOption, displayValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (isOpen) {
          setIsOpen(false);
          setHighlightedIndex(-1);
          onClose?.();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = useCallback(
    (selectedValue: T) => {
      onChange(selectedValue);
      setIsOpen(false);
      setHighlightedIndex(-1);
      setInputValue(options.find((opt) => opt.value === selectedValue)?.label || "");
      onClose?.();
    },
    [onChange, options, onClose]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("" as T);
      setInputValue("");
      inputRef.current?.focus();
    },
    [onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true);
      onOpen?.();
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex].value);
        } else if (filteredOptions.length === 1) {
          handleSelect(filteredOptions[0].value);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        onClose?.();
        break;
      case "Tab":
        if (isOpen) {
          setIsOpen(false);
          setHighlightedIndex(-1);
          onClose?.();
        }
        break;
    }
  };

  const handleFocus = () => {
    if (!disabled && !isOpen) {
      setIsOpen(true);
      onOpen?.();
    }
  };

  const dropdownClassName =
    "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto";

  const defaultRenderOption = (
    option: SelectOption<T>,
    { isSelected, isHighlighted, onSelect }: {
      isSelected: boolean;
      isHighlighted: boolean;
      onSelect: () => void;
    }
  ) => {
    return (
      <div
        key={option.value}
        onClick={onSelect}
        className={cn(
          "px-3 py-2 cursor-pointer text-sm",
          isHighlighted
            ? "bg-hgreen text-white"
            : "hover:bg-gray-100",
          isSelected && "font-semibold"
        )}
      >
        {option.render ? option.render(option) : option.label}
        {isSelected && (
          <span className="ml-2">
            <svg
              className="w-4 h-4 inline"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )}
      </div>
    );
  };

  const dropdownContent = filteredOptions.length === 0 ? (
    <div className="p-2 text-gray-500 text-sm">No options found</div>
  ) : (
    filteredOptions.map((option, index) => {
      const isSelected = value === option.value;
      const isHighlighted = highlightedIndex === index;

      if (renderOption) {
        return renderOption(option, {
          isSelected,
          isHighlighted,
          onSelect: () => handleSelect(option.value),
        });
      }

      return defaultRenderOption(option, {
        isSelected,
        isHighlighted,
        onSelect: () => handleSelect(option.value),
      });
    })
  );

  const defaultDropdown = (
    <div className={dropdownClassName}>
      {dropdownContent}
    </div>
  );

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name="select"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          placeholder={placeholder && placeholder.length > 0 ? `${placeholder}…` : ""}
          autoComplete="off"
          spellCheck={false}
          className="p-2 drop-shadow-round rounded-lg w-full pr-16 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-hgreen focus-visible:ring-offset-2"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-label={placeholder}
        />

        {/* Right side buttons container */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Clear button */}
          {clearable && value && value !== "" && !disabled && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-hgreen rounded-full p-0.5"
              aria-label="Clear selection"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}

          {/* Dropdown arrow icon / Loading spinner */}
          {!disabled && !isLoading && (
            <button
              type="button"
              onClick={() => {
                const newState = !isOpen;
                setIsOpen(newState);
                if (newState) {
                  onOpen?.();
                } else {
                  onClose?.();
                }
                inputRef.current?.focus();
              }}
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-hgreen rounded-full p-0.5"
              aria-label={isOpen ? "Close dropdown" : "Open dropdown"}
              aria-expanded={isOpen}
            >
              <svg
                className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}

          {/* Loading spinner */}
          {isLoading && (
            <div className="pointer-events-none">
              <svg
                className="animate-spin h-4 w-4 text-hgreen"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <>
          {renderDropdown ? (
            renderDropdown({
              children: dropdownContent,
              className: dropdownClassName,
            })
          ) : (
            defaultDropdown
          )}
        </>
      )}
    </div>
  );
}
