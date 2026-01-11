"use client";

import React, { useState, useRef, useEffect, KeyboardEvent } from "react";

interface Option {
  value: string;
  label: string;
}

interface CreatableSelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  onCreate?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowCreate?: boolean;
}

export const CreatableSelect: React.FC<CreatableSelectProps> = ({
  options,
  value,
  onChange,
  onCreate,
  placeholder = "Select or type to create...",
  className = "",
  disabled = false,
  allowCreate = true,
}) => {
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
    } else if (value === "") {
      setInputValue("");
    }
  }, [value, selectedOption]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const canCreateNew =
    allowCreate &&
    inputValue.trim() !== "" &&
    !filteredOptions.some((opt) => opt.label.toLowerCase() === inputValue.toLowerCase());

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleCreateNew = () => {
    if (canCreateNew && onCreate) {
      onCreate(inputValue.trim());
      onChange(inputValue.trim());
      setInputValue(inputValue.trim());
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const totalItems = filteredOptions.length + (canCreateNew ? 1 : 0);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          if (highlightedIndex < filteredOptions.length) {
            handleSelect(filteredOptions[highlightedIndex].value);
          } else if (canCreateNew) {
            handleCreateNew();
          }
        } else if (filteredOptions.length === 1 && !canCreateNew) {
          handleSelect(filteredOptions[0].value);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case "Tab":
        if (isOpen) {
          setIsOpen(false);
          setHighlightedIndex(-1);
        }
        break;
    }
  };

  const handleFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="p-2 drop-shadow-round rounded-lg w-full pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {/* Dropdown arrow icon */}
      {!disabled && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 pointer-events-none"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length === 0 && !canCreateNew ? (
            <div className="p-2 text-gray-500 text-sm">No options found</div>
          ) : (
            <>
              {filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`px-3 py-2 cursor-pointer text-sm ${
                    highlightedIndex === index
                      ? "bg-hgreen text-white"
                      : "hover:bg-gray-100"
                  } ${value === option.value ? "font-semibold" : ""}`}
                >
                  {option.label}
                  {value === option.value && (
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
              ))}

              {canCreateNew && (
                <div
                  onClick={handleCreateNew}
                  className={`px-3 py-2 cursor-pointer text-sm border-t border-gray-200 ${
                    highlightedIndex === filteredOptions.length
                      ? "bg-hgreen text-white"
                      : "hover:bg-gray-100 text-hgreen font-semibold"
                  }`}
                >
                  + Create &quot;{inputValue.trim()}&quot;
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
