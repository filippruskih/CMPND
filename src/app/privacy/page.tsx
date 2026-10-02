export const metadata = { title: "Privacy Policy - CMPND" };

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-4 text-sm leading-relaxed">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: [DATE]</p>
      </div>

      <Section title="Who we are">
        <p>
          CMPND (&quot;we&quot;, &quot;us&quot;) is operated by Filipp Ruskih. This policy explains what data we collect through your connected Instagram
          account, how we use it, and how you can request its deletion. Contact us at{" "}
          <a href="mailto:filippruskih@gmail.com" className="underline">
            Support Team
          </a>
          .
        </p>
      </Section>

      <Section title="Data we collect">
        <p>
          When you connect your Instagram Business or Creator account via Instagram&apos;s
          official Business Login (Instagram Graph API), we access and store:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Basic profile info: your Instagram user ID, username, and account type.</li>
          <li>
            Media you&apos;ve posted: reels and feed posts, including captions, thumbnails,
            publish dates, and permalinks.
          </li>
          <li>
            Performance insights for that media: views, likes, comments, shares, saves, reach,
            and engagement rate.
          </li>
          <li>Follower count history, captured each time your data is synced.</li>
        </ul>
        <p>
          We only request the minimum Instagram permissions needed for the features described
          below (<code className="rounded bg-muted px-1 py-0.5">instagram_business_basic</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5">instagram_business_manage_insights</code>
          ). We do not access your DMs, comments, or any data outside your own connected account.
        </p>
      </Section>

      <Section title="How we use it">
        <p>
          Your data is used solely to power your own analytics dashboard: performance charts,
          historical trends, and content organization (e.g. grouping reels into a series). Where
          you opt into AI-generated features (trend summaries, content suggestions, hook/script
          ideas), relevant text from your captions and performance numbers is sent to{" "}
          <strong>Anthropic</strong> (the maker of Claude) to generate that output. Anthropic
          processes this data to fulfill our request and does not use it to train their models
          under our agreement with them. We do not sell your data, and we do not share it with
          any other third party.
        </p>
      </Section>

      <Section title="Where it's stored">
        <p>
          Data is stored in a private database hosted on Railway, and
          access to the application itself is restricted by a password. Your Instagram access
          token is stored so we can keep syncing your data on your behalf, and it is never
          exposed in the application&apos;s user interface.
        </p>
      </Section>

      <Section title="Data retention & deletion" id="data-deletion">
        <p>
          We retain your data for as long as your Instagram account stays connected. You can
          request full deletion of your data - your connected account, synced media, insights
          history, and any AI-generated content - at any time by emailing{" "}
          <a href="mailto:filippruskih@gmail.com" className="underline">
            Support Team
          </a>{" "}
          with the subject line &quot;Data deletion request&quot;. We will confirm your identity,
          permanently delete your data, and reply to confirm once it&apos;s done, within 30 days.
          You can also disconnect your Instagram account at any time from within the app, which
          stops any further syncing immediately.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can request a copy of the data we hold about you, correction of inaccurate data, or
          deletion (see above) at any time by contacting{" "}
          <a href="mailto:filippruskih@gmail.com" className="underline">
            Support Team
          </a>
          .
        </p>
      </Section>

      <Section title="Compliance">
        <p>
          Our use of Instagram data complies with the{" "}
          <a
            href="https://developers.facebook.com/terms"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Meta Platform Terms
          </a>{" "}
          and{" "}
          <a
            href="https://developers.facebook.com/devpolicy"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Instagram Platform Policy
          </a>
          .
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If this policy changes, we&apos;ll update the date at the top of this page and, for
          material changes, notify you directly.
        </p>
      </Section>
    </div>
  );
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
