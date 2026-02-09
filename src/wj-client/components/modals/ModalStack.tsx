"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { ZIndex } from "@/lib/utils/z-index";

export interface ModalStackItem {
  id: string;
  component: ReactNode;
  props?: Record<string, any>;
  zIndex?: number;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

interface ModalStackContextType {
  stack: ModalStackItem[];
  push: (item: ModalStackItem) => void;
  pop: () => void;
  remove: (id: string) => void;
  clear: () => void;
  top: ModalStackItem | null;
  count: number;
}

const ModalStackContext = createContext<ModalStackContextType | undefined>(undefined);

const BASE_Z_INDEX = ZIndex.modal;
const Z_INDEX_INCREMENT = 1; // Increment by 1 for each stacked modal
const MAX_STACK_DEPTH = 5; // Maximum modal stack depth to prevent z-index overflow

export function ModalStackProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<ModalStackItem[]>([]);

  const push = useCallback((item: ModalStackItem) => {
    setStack((prev) => {
      // Prevent stacking beyond maximum depth
      if (prev.length >= MAX_STACK_DEPTH) {
        console.warn(`Modal stack depth exceeds maximum of ${MAX_STACK_DEPTH}`);
        return prev;
      }
      // Calculate z-index: start at base, increment by 1 for each level
      const zIndex = BASE_Z_INDEX + prev.length * Z_INDEX_INCREMENT;
      return [...prev, { ...item, zIndex: item.zIndex || zIndex }];
    });
  }, []);

  const pop = useCallback(() => {
    setStack((prev) => prev.slice(0, -1));
  }, []);

  const remove = useCallback((id: string) => {
    setStack((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => {
    setStack([]);
  }, []);

  const top = stack.length > 0 ? stack[stack.length - 1] : null;
  const count = stack.length;

  // Prevent body scroll when any modal is open
  useEffect(() => {
    if (stack.length > 0) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      return () => {
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.width = "";
      };
    }
  }, [stack.length]);

  // Handle ESC key to close top modal
  useEffect(() => {
    if (stack.length === 0) return;

    const topModal = stack[stack.length - 1];
    if (topModal?.closeOnEscape === false) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        pop();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [stack, pop]);

  return (
    <ModalStackContext.Provider value={{ stack, push, pop, remove, clear, top, count }}>
      {children}
    </ModalStackContext.Provider>
  );
}

export function useModalStack() {
  const context = useContext(ModalStackContext);
  if (!context) {
    throw new Error("useModalStack must be used within a ModalStackProvider");
  }
  return context;
}

/**
 * ModalStackRenderer - Renders the modal stack
 * This component should be placed at the root of your app
 */
export function ModalStackRenderer() {
  const { stack } = useModalStack();

  if (stack.length === 0) return null;

  return (
    <>
      {stack.map((item, index) => (
        <div
          key={item.id}
          style={{ zIndex: item.zIndex }}
          className="modal-stack-item"
        >
          {React.cloneElement(item.component as React.ReactElement, {
            ...(item.props || {}),
          } as any)}
        </div>
      ))}
    </>
  );
}

/**
 * Hook to open a modal in the stack
 */
export function useModal() {
  const { push, pop, remove } = useModalStack();

  const openModal = useCallback(
    (id: string, component: ReactNode, props?: Record<string, any>) => {
      push({ id, component, props });
    },
    [push]
  );

  const closeModal = useCallback(() => {
    pop();
  }, [pop]);

  const removeModal = useCallback(
    (id: string) => {
      remove(id);
    },
    [remove]
  );

  return {
    openModal,
    closeModal,
    removeModal,
  };
}

/**
 * Helper function to manage modal state at component level
 * Use this for simpler modal management without the stack
 */
export function useModalState(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  };
}

/**
 * Modal stack utilities
 */
export const ModalStackUtils = {
  /**
   * Check if a modal with given ID is in the stack
   */
  hasModal: (stack: ModalStackItem[], id: string): boolean => {
    return stack.some((item) => item.id === id);
  },

  /**
   * Get a modal by ID
   */
  getModal: (stack: ModalStackItem[], id: string): ModalStackItem | undefined => {
    return stack.find((item) => item.id === id);
  },

  /**
   * Get the index of a modal in the stack
   */
  getModalIndex: (stack: ModalStackItem[], id: string): number => {
    return stack.findIndex((item) => item.id === id);
  },

  /**
   * Check if a modal is the top modal
   */
  isTopModal: (stack: ModalStackItem[], id: string): boolean => {
    return stack.length > 0 && stack[stack.length - 1].id === id;
  },

  /**
   * Get all modals above a given modal
   */
  getModalsAbove: (stack: ModalStackItem[], id: string): ModalStackItem[] => {
    const index = stack.findIndex((item) => item.id === id);
    if (index === -1) return [];
    return stack.slice(index + 1);
  },

  /**
   * Get all modals below a given modal
   */
  getModalsBelow: (stack: ModalStackItem[], id: string): ModalStackItem[] => {
    const index = stack.findIndex((item) => item.id === id);
    if (index === -1) return [];
    return stack.slice(0, index);
  },
};
