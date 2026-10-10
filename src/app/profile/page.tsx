import Link from "next/link";
import { CheckCircle2, ExternalLink, Film, Image as ImageIcon, LogOut, User, Users, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { instagramConfig } from "@/lib/instagram/config";
import { isAuthEnabled } from "@/lib/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/stat-tile";
import { SyncButton } from "@/components/settings/sync-button";
import { formatCompactNumber } from "@/lib/format";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { connected, error } = await searchParams;
  const [account, reelCount, postCount, latestSnapshot] = await Promise.all([
    db.account.findFirst(),
    db.reel.count(),
    db.post.count(),
    db.followerSnapshot.findFirst({ orderBy: { capturedAt: "desc" } }),
  ]);
  const configured = instagramConfig.isConfigured();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        icon={User}
        color="blue"
        title="Profile"
        description="Connect your Instagram account and manage sync."
      />

      {account && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile
            label="Followers"
            icon={Users}
            color="blue"
            value={latestSnapshot ? formatCompactNumber(latestSnapshot.followerCount) : "-"}
          />
          <StatTile label="Reels synced" icon={Film} color="orange" value={String(reelCount)} />
          <StatTile label="Posts synced" icon={ImageIcon} color="magenta" value={String(postCount)} />
        </div>
      )}

      {connected && (
        <Alert>
          <CheckCircle2 />
          <AlertTitle>Connected</AlertTitle>
          <AlertDescription>Successfully connected @{connected}.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <XCircle />
          <AlertTitle>Connection failed</AlertTitle>
          <AlertDescription>
            {error === "invalid_oauth_state"
              ? "The connection request expired or was tampered with. Try connecting again."
              : "Something went wrong exchanging the token with Instagram. Check the server logs."}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Instagram connection</CardTitle>
          <CardDescription>
            Uses the official Instagram Graph API (Business Login) - your own account only, no
            scraping.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {account ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Connected</Badge>
                <span className="font-medium">@{account.username}</span>
                {account.accountType && (
                  <span className="text-sm text-muted-foreground">{account.accountType}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Access token valid until{" "}
                {account.tokenExpiresAt.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                . It refreshes automatically on sync.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <SyncButton />
                <Button asChild variant="outline" size="sm">
                  <Link href="/api/instagram/authorize">Reconnect Instagram</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Reconnect if you&apos;ve just enabled a new permission (like DMs) - this
                re-authorizes without disconnecting anything.
              </p>
            </div>
          ) : configured ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                No Instagram account connected yet.
              </p>
              <Button asChild className="w-fit">
                <Link href="/api/instagram/authorize">Connect Instagram</Link>
              </Button>
            </div>
          ) : (
            <SetupInstructions />
          )}
        </CardContent>
      </Card>

      {isAuthEnabled() && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session</CardTitle>
          </CardHeader>
          <CardContent>
            <form action="/api/auth/logout" method="POST">
              <Button type="submit" variant="outline" size="sm">
                <LogOut />
                Log out
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SetupInstructions() {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <p className="text-muted-foreground">
        Before you can connect, create a Meta app and generate credentials. This uses Meta&apos;s
        <strong> Business Login for Instagram</strong> flow - for your own account, this needs no
        Meta App Review.
      </p>
      <Separator />
      <ol className="flex flex-col gap-3">
        <Step n={1} title="Make your Instagram account a Business or Creator account">
          In the Instagram app: Settings → Account type and tools → switch to Professional
          account.
        </Step>
        <Step n={2} title="Create a Meta app">
          Go to{" "}
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline"
          >
            developers.facebook.com/apps <ExternalLink className="size-3" />
          </a>{" "}
          → Create App. Meta&apos;s exact screens shift over time - if asked what you want your
          app to do, pick <strong>APIs</strong> (not &quot;Sharing&quot;), then{" "}
          <strong>Instagram Graph API</strong> (not &quot;Instagram Basic Display API&quot;, which
          Meta retired). This lands you on{" "}
          <strong>Instagram → API setup with Instagram Login</strong> in your app&apos;s sidebar -
          steps 3–5 below all happen on that one page.
        </Step>
        <Step n={3} title="Add yourself as a tester">
          On the &quot;API setup with Instagram Login&quot; page, add your own Instagram account
          (Add account / Instagram testers) and accept the invite in the Instagram app if
          prompted - this lets you authorize the app without Meta App Review.
        </Step>
        <Step n={4} title="Set the redirect URI - must be HTTPS">
          Same page, under &quot;Set up Instagram business login&quot; → Business login settings,
          add{" "}
          <code className="rounded bg-muted px-1 py-0.5">
            https://localhost:3000/api/instagram/callback
          </code>{" "}
          as a valid OAuth redirect URI. Instagram rejects plain <code>http://</code> here, even
          for localhost - it must be <code>https://</code>. It will also ask for a deauthorize
          callback URL and a data deletion URL; any reachable URL (e.g. your local site root)
          works as a placeholder for local development.
        </Step>
        <Step n={5} title="Copy your App ID and App Secret">
          Use the <strong>Instagram App ID</strong> and <strong>Instagram App secret</strong>{" "}
          shown on that same &quot;API setup with Instagram Login&quot; page - not the generic
          App ID/Secret on the app&apos;s Basic Settings page, which are for a different login
          flow and won&apos;t work here.
        </Step>
        <Step n={6} title="Add them to .env.local">
          Copy <code className="rounded bg-muted px-1 py-0.5">.env.local.example</code> to{" "}
          <code className="rounded bg-muted px-1 py-0.5">.env.local</code> (never edit the{" "}
          <code>.example</code> file itself with real values - it&apos;s committed to git) and
          fill in <code className="rounded bg-muted px-1 py-0.5">IG_APP_ID</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5">IG_APP_SECRET</code>, and{" "}
          <code className="rounded bg-muted px-1 py-0.5">IG_REDIRECT_URI</code> (the{" "}
          <code>https://</code> URL from step 4).
        </Step>
        <Step n={7} title="Run the dev server with HTTPS">
          Stop the dev server if it&apos;s running, then start it with{" "}
          <code className="rounded bg-muted px-1 py-0.5">npm run dev:https</code> instead of{" "}
          <code>npm run dev</code> - plain HTTP won&apos;t satisfy the redirect URI you just
          registered. The first time, your browser will warn about the self-signed certificate at{" "}
          <code>https://localhost:3000</code>; click through (&quot;Advanced&quot; → &quot;Proceed
          to localhost&quot;) - that&apos;s expected for local dev. Regular{" "}
          <code>npm run dev</code> is fine again afterwards for everyday use, once connected.
        </Step>
      </ol>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
        {n}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}
