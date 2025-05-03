import { cssInterop } from "nativewind";
import * as LucideIcons from "lucide-react-native";
import type { ComponentProps, ForwardRefExoticComponent, RefAttributes } from "react";

// Get the props from any icon in lucide-react-native
type LucideIconProps = ComponentProps<(typeof LucideIcons)["Activity"]>;
type LucideIconComponent = ForwardRefExoticComponent<LucideIconProps & RefAttributes<any>>;

// Helper to type guard
function isLucideIconComponent(component: unknown): component is LucideIconComponent {
  return (
    (typeof component === "function" || typeof component === "object") &&
    component !== null &&
    "displayName" in component
  );
}

// Iterate over icons and apply cssInterop
Object.entries(LucideIcons).forEach(([Icon]) => {
  if (isLucideIconComponent(Icon)) {
    cssInterop(Icon, {
      className: {
        target: "style",
        nativeStyleToProp: {
          color: true,
          opacity: true,
        },
      },
    });
  }
});

export * from "lucide-react-native";
