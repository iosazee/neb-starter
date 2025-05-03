import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LoginForm from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="mb-4 flex items-center justify-center">
            <Link href={"/"}>
              <Image
                src="/logo.png"
                alt="NEB Starter Kit Logo"
                width={64}
                height={64}
                className="mb-2"
              />
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm />
        </CardContent>
        <CardFooter className="border-t pt-4">
          <div className="text-center text-sm text-muted-foreground w-full">
            Don&apos;t have an account?{" "}
            <a href="/register" className="underline underline-offset-4 hover:text-primary">
              Create an account
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
