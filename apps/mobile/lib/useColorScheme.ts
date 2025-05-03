import { useColorScheme as useNativewindColorScheme } from "nativewind";
import * as React from "react";
import { Platform, StatusBar } from "react-native";
import { COLORS } from "~/theme/colors";

function useColorScheme() {
  const { colorScheme, setColorScheme: setNativeWindColorScheme } = useNativewindColorScheme();

  async function setColorScheme(colorScheme: "light" | "dark") {
    setNativeWindColorScheme(colorScheme);
    applyColorScheme(colorScheme);
  }

  function toggleColorScheme() {
    return setColorScheme(colorScheme === "light" ? "dark" : "light");
  }

  return {
    colorScheme: colorScheme ?? "light",
    isDarkColorScheme: colorScheme === "dark",
    setColorScheme,
    toggleColorScheme,
    colors: COLORS[colorScheme ?? "light"],
  };
}

function useInitialBarSync() {
  const { colorScheme } = useColorScheme();
  React.useEffect(() => {
    applyColorScheme(colorScheme);
  }, [colorScheme]);
}

function applyColorScheme(colorScheme: "light" | "dark") {
  StatusBar.setBarStyle(colorScheme === "dark" ? "light-content" : "dark-content", true);
  if (Platform.OS === "android") {
    StatusBar.setBackgroundColor(colorScheme === "dark" ? "#000000" : "#ffffff", true);
  }
}

export { useColorScheme, useInitialBarSync };
