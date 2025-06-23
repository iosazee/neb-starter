import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SettingsShell } from "@/components/dashboard/settings-shell";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // Get session server-side
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to login if no session
  if (!session?.user) {
    redirect("/login");
  }

  return <SettingsShell user={session.user} />;
}
