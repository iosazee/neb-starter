"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import * as React from "react";
import { VariantProps } from "class-variance-authority";

interface AuthButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  loginText?: string;
  authenticatedText?: string;
  loginHref?: string;
  authenticatedHref?: string;
  asChild?: boolean;
}

export default function AuthButton({
  loginText = "Get Started",
  authenticatedText = "Dashboard",
  loginHref = "/login",
  authenticatedHref = "/(members)/dashboard",
  size = "default",
  variant = "default",
  className,
  ...props
}: AuthButtonProps) {
  const { data: session } = useSession();
  const isAuthenticated = !!session;

  return (
    <Button asChild size={size} variant={variant} className={className} {...props}>
      <Link href={isAuthenticated ? authenticatedHref : loginHref}>
        {isAuthenticated ? authenticatedText : loginText}
      </Link>
    </Button>
  );
}
