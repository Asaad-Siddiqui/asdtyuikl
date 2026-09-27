/**
 * Real-world social signals.
 *
 * Pulls publicly available traveller chatter related to a weather event from two
 * keyless sources:
 *   • Reddit search JSON   (`reddit.com/search.json`)
 *   • Mastodon public tag timeline (`mastodon.social/api/v1/timelines/tag/...`)
 *
 * Signals feed the Digital Twin's *observed* state — "what are people on the
 * ground saying right now". Every call is time-boxed and the whole module falls
 * back to a clearly-labelled sample feed, so the twin always has something to
 * show even when a datacenter IP is rate-limited.
 *
 * Nothing here is authenticated and no secrets are used.
 */

export type SocialSource = "reddit" | "mastodon" | "sample";

export type SocialSignal = {
  id: string;
  source: SocialSource;
  title: string;
  text: string;
  url: string;
  author: string;
  createdAt: string;
  tags: string[];
  sentiment: "negative" | "neutral" | "positive";
  /** Which weather keywords matched — why this signal matters to the twin. */
  weatherRelevance: string[];
};

const TIMEOUT_MS = 3500;

/* ------------------------------------------------------------------ */
/* Relevance + sentiment                                               */
/* ------------------------------------------------------------------ */

const NEGATIVE_TERMS = [
  "flood",
  "flooded",
  "landslide",
  "cancelled",
  "canceled",
  "delayed",
  "stuck",
  "closed",
  "blocked",
  "washed out",
  "no water",
  "power cut",
  "storm",
  "cyclone",
  "unsafe",
  "damage",
];

const POSITIVE_TERMS = [
  "clear",
  "sunny",
  "beautiful",
  "gorgeous",
  "pleasant",
  "open",
  "amazing",
  "perfect weather",
  "cool breeze",
];

const WEATHER_TERMS = [
  "rain",
  "rainfall",
  "monsoon",
  "heat",
  "heatwave",
  "storm",
  "cyclone",
  "flood",
  "landslide",
  "cold",
  "fog",
  "hail",
  "wind",
  "snow",
];

function analyze(text: string): {
  sentiment: SocialSignal["sentiment"];
  weatherRelevance: string[];
} {
  const lower = text.toLowerCase();
  const negative = NEGATIVE_TERMS.some((term) => lower.includes(term));
  const positive = POSITIVE_TERMS.some((term) => lower.includes(term));
  const weatherRelevance = WEATHER_TERMS.filter((term) => lower.includes(term));

  return {
    sentiment: negative ? "negative" : positive ? "positive" : "neutral",
    weatherRelevance,
  };
}

function withAnalysis(
  signal: Omit<SocialSignal, "sentiment" | "weatherRelevance">,
): SocialSignal {
  return { ...signal, ...analyze(`${signal.title} ${signal.text}`) };
}

/* ------------------------------------------------------------------ */
/* Sources                                                             */
/* ------------------------------------------------------------------ */

async function fetchReddit(query: string): Promise<SocialSignal[]> {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(
    query,
  )}&sort=new&limit=12&type=link`;
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      // Reddit asks for a descriptive UA; a real one lowers 429/403 rates.
      "user-agent": "TravelloDigitalTwin/1.0 (prototype; contact: demo@travello.app)",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`reddit ${response.status}`);
  const data = (await response.json()) as {
    data?: { children?: { data?: Record<string, unknown> }[] };
  };
  const children = data.data?.children ?? [];

  return children
    .map((child) => child.data ?? {})
    .filter((post) => post.title)
    .map((post) =>
      withAnalysis({
        id: `reddit-${String(post.id ?? Math.random())}`,
        source: "reddit",
        title: String(post.title ?? "").slice(0, 160),
        text: String(post.selftext ?? "").slice(0, 400),
        url: `https://www.reddit.com${String(post.permalink ?? "")}`,
        author: String(post.author ?? "reddit user"),
        createdAt: new Date(
          Number(post.created_utc ?? Date.now() / 1000) * 1000,
        ).toISOString(),
        tags: ["reddit", String(post.subreddit ?? "")].filter(Boolean),
      }),
    );
}

async function fetchMastodon(tag: string): Promise<SocialSignal[]> {
  const url = `https://mastodon.social/api/v1/timelines/tag/${encodeURIComponent(
    tag,
  )}?limit=12`;
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`mastodon ${response.status}`);
  const posts = (await response.json()) as Record<string, unknown>[];

  return posts.map((post) => {
    const account = (post.account ?? {}) as Record<string, unknown>;
    return withAnalysis({
      id: `mastodon-${String(post.id ?? Math.random())}`,
      source: "mastodon",
      title: `#${tag}`,
      text: String(post.content ?? "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 400),
      url: String(post.url ?? "https://mastodon.social/tags/" + tag),
      author: String(account.display_name ?? account.username ?? "mastodon user"),
      createdAt: String(post.created_at ?? new Date().toISOString()),
      tags: [`#${tag}`],
    });
  });
}

/* ------------------------------------------------------------------ */
/* Fallback feed                                                       */
/* ------------------------------------------------------------------ */

function sampleSignals(query: string): SocialSignal[] {
  const now = Date.now();
  const at = (hoursAgo: number) =>
    new Date(now - hoursAgo * 3_600_000).toISOString();

  return [
    withAnalysis({
      id: "sample-1",
      source: "sample",
      title: `Heavy rain reported near ${query}`,
      text: `Steady rain since morning around ${query}. Trails are slushy and a few viewpoints are fogged in — locals advise early starts or indoor options today.`,
      url: "#",
      author: "on-the-ground traveller",
      createdAt: at(2),
      tags: ["#weather", "#traveller"],
    }),
    withAnalysis({
      id: "sample-2",
      source: "sample",
      title: "Roads fine but slow",
      text: "Main roads are open, just slow with the rain. Shared cabs are still running; ferries were paused briefly this morning.",
      url: "#",
      author: "local guide",
      createdAt: at(5),
      tags: ["#transport"],
    }),
    withAnalysis({
      id: "sample-3",
      source: "sample",
      title: "Clear window tomorrow morning",
      text: "Forecast looks clearer before noon tomorrow — good window for the outdoor viewpoints if you go early.",
      url: "#",
      author: "weekend visitor",
      createdAt: at(9),
      tags: ["#forecast"],
    }),
  ];
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export type SocialSignalResult = {
  source: "live" | "sample";
  query: string;
  fetchedAt: string;
  note?: string;
  signals: SocialSignal[];
};

/**
 * Fetches signals from both sources in parallel and merges them, newest first.
 * Never throws: falls back to the labelled sample feed if both fail.
 */
export async function fetchSocialSignals(
  query: string,
  tag = "monsoon",
): Promise<SocialSignalResult> {
  const [reddit, mastodon] = await Promise.allSettled([
    fetchReddit(query),
    fetchMastodon(tag),
  ]);

  const merged: SocialSignal[] = [
    ...(reddit.status === "fulfilled" ? reddit.value : []),
    ...(mastodon.status === "fulfilled" ? mastodon.value : []),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12);

  if (merged.length === 0) {
    console.warn("[social] no live signals; using sample feed", {
      reddit: reddit.status,
      mastodon: mastodon.status,
    });
    return {
      source: "sample",
      query,
      fetchedAt: new Date().toISOString(),
      note: "Live social sources unreachable — showing a sample traveller feed.",
      signals: sampleSignals(query),
    };
  }

  return {
    source: "live",
    query,
    fetchedAt: new Date().toISOString(),
    signals: merged,
  };
}
