"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setAuth } from "@/redux/actions";
import { useMutationUpdatePreferences, useQueryGetAuth, EVENT_AuthGetAuth } from "@/utils/generated/hooks";
import { useQueryClient } from "@tanstack/react-query";

interface CurrencyContextType {
  currency: string;
  isConverting: boolean;
  updateCurrency: (newCurrency: string) => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const auth = useSelector((state: any) => state.auth);
  const [isConverting, setIsConverting] = useState(false);

  const currency = auth.preferredCurrency || "VND";

  // Poll user data to check conversion progress
  // Only poll when we expect conversion to be in progress
  const { data: userData, refetch: refetchUserData } = useQueryGetAuth(
    { email: auth.email },
    {
      enabled: !!auth.email && isConverting,
      refetchInterval: isConverting ? 2000 : false, // Poll every 2 seconds during conversion
      refetchOnMount: "always",
    }
  );

  // Update isConverting state based on backend data
  useEffect(() => {
    if (userData?.data?.conversionInProgress !== undefined) {
      const backendIsConverting = userData.data.conversionInProgress;

      // If backend says conversion is done but we thought it was converting
      if (!backendIsConverting && isConverting) {
        setIsConverting(false);
        // Invalidate all queries to refetch with new converted values
        queryClient.invalidateQueries();

        // Update Redux auth state with latest data
        if (userData.data) {
          dispatch(
            setAuth({
              isAuthenticated: true,
              email: userData.data.email,
              fullname: userData.data.name,
              picture: userData.data.picture,
              preferredCurrency: userData.data.preferredCurrency,
            }) as any
          );
        }
      }
    }
  }, [userData, isConverting, queryClient, dispatch]);

  const updatePreferencesMutation = useMutationUpdatePreferences({
    onSuccess: (data) => {
      // Update Redux auth state with new currency
      if (data.data) {
        dispatch(
          setAuth({
            isAuthenticated: true,
            email: auth.email,
            fullname: auth.fullname,
            picture: auth.picture,
            preferredCurrency: data.data.preferredCurrency,
          }) as any // Type assertion for Redux Toolkit compatibility
        );

        // Set converting flag if backend indicates conversion started
        if (data.data.conversionInProgress) {
          setIsConverting(true);
        }
      }

      // Note: Don't invalidate queries yet - wait for conversion to complete
      // The polling mechanism will invalidate once conversion is done
    },
  });

  const updateCurrency = useCallback(
    async (newCurrency: string) => {
      if (newCurrency === currency) {
        return; // No change needed
      }

      // Start conversion process
      await updatePreferencesMutation.mutateAsync({
        preferences: {
          preferredCurrency: newCurrency,
        },
      });
    },
    [currency, updatePreferencesMutation]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        isConverting,
        updateCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
