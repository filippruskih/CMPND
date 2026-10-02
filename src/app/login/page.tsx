import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLogoMark } from "@/components/app-logo-mark";

export const metadata = { title: "Log in - CMPND" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <div className="flex min-h-[80vh] flex-1 items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center gap-3 text-center">
          <div
            className="flex size-12 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--chart-5))" }}
          >
            <AppLogoMark className="size-6" />
          </div>
          <div>
            <CardTitle>CMPND</CardTitle>
            <CardDescription>Enter the password to continue.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form method="POST" action="/api/auth/login" className="flex flex-col gap-4">
            <input type="hidden" name="next" value={safeNext} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoFocus
                required
                autoComplete="current-password"
              />
            </div>
            {error === "locked" && (
              <p className="text-sm text-destructive">
                Too many failed attempts. Try again in a few minutes.
              </p>
            )}
            {error && error !== "locked" && (
              <p className="text-sm text-destructive">Incorrect password. Try again.</p>
            )}
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
