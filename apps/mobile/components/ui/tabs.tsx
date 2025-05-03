import * as TabsPrimitive from "@rn-primitives/tabs";
import type { ListProps, TriggerProps } from "@rn-primitives/tabs";
import * as React from "react";
import { Text, View, ScrollView } from "react-native";
import { cn } from "~/lib/cn";
import { TextClassContext } from "~/components/ui/text";

const Tabs = TabsPrimitive.Root;

interface TabsListProps extends ListProps {
  orientation?: "horizontal" | "vertical";
}

const TabsList = React.forwardRef<TabsPrimitive.ListRef, TabsListProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => (
    <View
      className={cn(
        "bg-muted p-1 dark:bg-gray-800",
        orientation === "horizontal" ? "rounded-md" : "rounded-md w-full",
        className
      )}
    >
      {orientation === "horizontal" ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TabsPrimitive.List
            ref={ref}
            className={cn(
              "native:px-1.5",
              "web:inline-flex h-10 native:h-12 flex-row items-center"
            )}
            {...props}
          />
        </ScrollView>
      ) : (
        <TabsPrimitive.List
          ref={ref}
          className={cn("native:px-1.5", "flex-col items-start justify-start w-full")}
          {...props}
        />
      )}
    </View>
  )
);
TabsList.displayName = TabsPrimitive.List.displayName;

interface TabsTriggerProps extends TriggerProps {
  children: React.ReactNode;
  orientation?: "horizontal" | "vertical";
}

const TabsTrigger = React.forwardRef<TabsPrimitive.TriggerRef, TabsTriggerProps>(
  ({ className, children, orientation = "horizontal", ...props }, ref) => {
    const { value } = TabsPrimitive.useRootContext();
    return (
      <TextClassContext.Provider
        value={cn(
          "text-sm native:text-base font-medium text-muted-foreground web:transition-all",
          value === props.value && "text-foreground font-semibold"
        )}
      >
        <TabsPrimitive.Trigger
          ref={ref}
          className={cn(
            "inline-flex items-center justify-center shadow-none web:whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium web:ring-offset-background web:transition-all web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2",
            orientation === "vertical" && "justify-start w-full",
            props.disabled && "web:pointer-events-none opacity-50",
            props.value === value && "bg-background shadow-lg shadow-foreground/10 dark:bg-card",
            className
          )}
          {...props}
        >
          {typeof children === "string" ? (
            <Text className="dark:text-white">{children}</Text>
          ) : (
            children
          )}
        </TabsPrimitive.Trigger>
      </TextClassContext.Provider>
    );
  }
);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<TabsPrimitive.ContentRef, TabsPrimitive.ContentProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-2 p-4 bg-muted/30 rounded-md dark:bg-gray-700/50",
        "web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
