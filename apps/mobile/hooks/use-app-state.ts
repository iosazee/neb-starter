import { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { focusManager } from "@tanstack/react-query";

export function useAppState() {
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (status: AppStateStatus) => {
        focusManager.setFocused(status === "active");
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);
}
