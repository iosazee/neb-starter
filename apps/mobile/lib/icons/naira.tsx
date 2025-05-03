import React from "react";
import Svg, { Path } from "react-native-svg";
import { useColorScheme } from "~/lib/useColorScheme";

interface NairaSignProps {
  size?: number;
  className?: string;
}

export default function NairaSign({ size = 24, className }: NairaSignProps) {
  const { colorScheme } = useColorScheme();
  const color = colorScheme === "dark" ? "#ffffff" : "#000000";

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M4 5h16" />
      <Path d="M4 19h16" />
      <Path d="M5 12h14" />
      <Path d="M7 5v14" />
      <Path d="M17 5v14" />
    </Svg>
  );
}
