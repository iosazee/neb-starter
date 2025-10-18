import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/general/mood-toggle";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="absolute top-8 right-8">
        <ModeToggle />
      </div>
      <div className="text-center space-y-6 max-w-xl">
        <h1 className="text-6xl font-bold tracking-tight text-foreground">404</h1>
        <p className="text-xl text-muted-foreground">
          Oops! The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button size="lg" asChild>
          <Link href="/">Go back to home</Link>
        </Button>
      </div>
    </div>
  );
}
