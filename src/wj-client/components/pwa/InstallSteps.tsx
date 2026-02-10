"use client";

import React from "react";
import { Platform } from "@/hooks/usePWAInstall";
import { Button } from "@/components/Button";

interface InstallStepsProps {
  platform: Platform;
  onInstall?: () => void;
}

const IOSSteps = () => (
  <div className="space-y-4">
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-bg rounded-full flex items-center justify-center font-semibold text-sm">
        1
      </div>
      <div className="flex-1 pt-1">
        <p className="text-sm text-gray-700">
          Tap the <span className="inline-flex items-center mx-1 px-1.5 py-0.5 bg-gray-100 rounded font-mono text-xs">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </span> Share button in Safari
        </p>
      </div>
    </div>
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-bg rounded-full flex items-center justify-center font-semibold text-sm">
        2
      </div>
      <div className="flex-1 pt-1">
        <p className="text-sm text-gray-700">
          Scroll down and tap{" "}
          <span className="inline-flex items-center mx-1 px-1.5 py-0.5 bg-gray-100 rounded font-medium text-xs">
            Add to Home Screen
          </span>
        </p>
      </div>
    </div>
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-bg rounded-full flex items-center justify-center font-semibold text-sm">
        3
      </div>
      <div className="flex-1 pt-1">
        <p className="text-sm text-gray-700">
          Tap <span className="font-medium">Add</span> to confirm
        </p>
      </div>
    </div>
  </div>
);

const AndroidSteps = ({ onInstall }: { onInstall?: () => void }) => (
  <div className="space-y-4">
    <p className="text-sm text-gray-600 mb-4">
      You can install WealthJourney directly to your home screen for a native app experience.
    </p>
    {onInstall && (
      <Button
        onClick={onInstall}
        variant="primary"
        fullWidth={true}
      >
        Install WealthJourney
      </Button>
    )}
    <div className="text-xs text-gray-500 text-center">
      Or tap the menu (⋮) and select "Add to Home screen"
    </div>
  </div>
);

export function InstallSteps({ platform, onInstall }: InstallStepsProps) {
  if (platform === "ios") {
    return <IOSSteps />;
  }

  if (platform === "android") {
    return <AndroidSteps onInstall={onInstall} />;
  }

  return (
    <div className="text-sm text-gray-600">
      <p>To install WealthJourney as an app:</p>
      <ol className="list-decimal list-inside space-y-2 mt-3">
        <li>Open this website in Chrome or Safari</li>
        <li>Use the browser menu to add to home screen</li>
      </ol>
    </div>
  );
}
