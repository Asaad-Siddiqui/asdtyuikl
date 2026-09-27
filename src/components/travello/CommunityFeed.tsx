"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  ImageIcon,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { useApp } from "@/components/travello/AppProvider";
import { PageHero, heroArt } from "@/components/travello/ui/PageKit";
import { cn } from "@/lib/format";

const FALLBACK_ART =
  "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&h=600&fit=crop&auto=format";

/**
 * Community feed.
 *
 * Unlike the prototype this is server-backed: posts, likes and comments are
 * stored in Postgres and visible to every signed-in traveller. The layout keeps
 * ZIP 2's card design.
 */
export function CommunityFeed() {
  const { user, posts, destinations, completions, challenges, createPost, toggleLike, addComment } =
    useApp();

  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [posting, setPosting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  const completedChallenges = completions
    .filter((completion) => completion.status === "completed")
    .map((completion) => challenges.find((item) => item.id === completion.challengeId))
    .filter((challenge): challenge is NonNullable<typeof challenge> => Boolean(challenge));

  async function handlePost(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) {
      setComposerError("Write something before posting.");
      return;
    }
    setPosting(true);
    setComposerError(null);
    try {
      await createPost({
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
        destinationId: destinationId || undefined,
        challengeId: challengeId || undefined,
      });
      setContent("");
      setImageUrl("");
      setDestinationId("");
      setChallengeId("");
    } catch (error) {
      setComposerError(
        error instanceof Error ? error.message : "Could not publish your post.",
      );
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-5">
      <PageHero
        eyebrow="Traveller stories"
        eyebrowIcon={Users}
        title="Conscious Travellers Community"
        subtitle="Share verified trail journeys, eco-achievements and sustainable travel inspiration — everything you post is saved to your account."
        pills={[
          { icon: Trophy, label: "Verified missions" },
          { icon: Sparkles, label: "Real itineraries" },
        ]}
        image={heroArt(destinations, ["munnar", "goa", "matheran"], FALLBACK_ART)}
        scriptLines={["Share the Trail", "Keep it Wilder"]}
        action={{ href: "/challenges", label: "Earn a badge" }}
      />

      {/* Composer */}
      <form
        onSubmit={handlePost}
        className="space-y-4 rounded-3xl border border-sand-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-forest-700 text-sm font-bold text-white">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              user.displayName.charAt(0)
            )}
          </span>
          <div className="flex-1">
            <label htmlFor="post-content" className="sr-only">
              Share an update
            </label>
            <textarea
              id="post-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={3}
              maxLength={1200}
              placeholder={`Share something, ${user.displayName.split(" ")[0]}…`}
              className="field resize-none"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label
              htmlFor="post-destination"
              className="mb-1 block text-[11px] font-bold tracking-wide text-sand-600 uppercase"
            >
              Tag a destination
            </label>
            <select
              id="post-destination"
              value={destinationId}
              onChange={(event) => setDestinationId(event.target.value)}
              className="field py-2.5 text-sm"
            >
              <option value="">No destination</option>
              {destinations.map((destination) => (
                <option key={destination.id} value={destination.id}>
                  {destination.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="post-challenge"
              className="mb-1 block text-[11px] font-bold tracking-wide text-sand-600 uppercase"
            >
              Celebrate a mission
            </label>
            <select
              id="post-challenge"
              value={challengeId}
              onChange={(event) => setChallengeId(event.target.value)}
              className="field py-2.5 text-sm"
            >
              <option value="">No challenge</option>
              {completedChallenges.map((challenge) => (
                <option key={challenge.id} value={challenge.id}>
                  {challenge.title} (+{challenge.points})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="post-image"
              className="mb-1 block text-[11px] font-bold tracking-wide text-sand-600 uppercase"
            >
              Image URL (optional)
            </label>
            <div className="relative">
              <ImageIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-sand-400" />
              <input
                id="post-image"
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://…"
                className="field py-2.5 pl-9 text-sm"
              />
            </div>
          </div>
        </div>

        {composerError && (
          <p role="alert" className="text-xs font-semibold text-red-600">
            {composerError}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-sand-500">
            Posts are public to signed-in travellers.
          </p>
          <button
            type="submit"
            disabled={posting}
            className="inline-flex items-center gap-2 rounded-xl bg-forest-800 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-forest-900 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </form>

      {/* Feed */}
      {posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-sand-300 bg-white p-12 text-center shadow-sm">
          <Sparkles className="mx-auto h-7 w-7 text-forest-500" />
          <h2 className="mt-3 text-lg font-bold text-forest-900">
            The feed is quiet
          </h2>
          <p className="mt-1 text-sm text-sand-600">
            Be the first to share a lower-impact journey.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between p-5 pb-4">
                <div className="flex items-center gap-3.5">
                  {post.author.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.author.avatar}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-500/20"
                    />
                  ) : (
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-forest-700 text-base font-bold text-white">
                      {post.author.name.charAt(0)}
                    </span>
                  )}
                  <div>
                    <h3 className="text-base leading-snug font-bold text-forest-900">
                      {post.author.name}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-sand-500">
                      {post.destinationName ? (
                        <>
                          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                          {post.destinationName} ·{" "}
                        </>
                      ) : null}
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                  Traveller
                </span>
              </div>

              <div className="px-5 pb-3">
                <p className="text-sm leading-relaxed text-sand-800 sm:text-base">
                  {post.content}
                </p>
              </div>

              {post.challengeTitle && (
                <div className="mx-5 mb-4 flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50 p-3.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
                    <Trophy className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-xs font-black text-emerald-950">
                      Mission Accomplished
                    </span>
                    <span className="block text-xs font-bold text-emerald-800 sm:text-sm">
                      {post.challengeTitle}
                      {post.challengePoints ? ` (+${post.challengePoints} pts)` : ""}
                    </span>
                  </span>
                </div>
              )}

              {post.imageUrl && (
                <div className="relative h-72 overflow-hidden sm:h-96">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="flex items-center justify-between border-t border-sand-100 bg-sand-50/50 p-4 px-5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleLike(post.id)}
                    aria-pressed={post.likedByMe}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all sm:text-sm",
                      post.likedByMe
                        ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                        : "text-sand-700 hover:bg-sand-100 hover:text-red-600",
                    )}
                  >
                    <Heart
                      className={cn("h-4 w-4", post.likedByMe && "fill-current text-red-600")}
                    />
                    {post.likes}
                  </button>

                  <span className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-sand-700 sm:text-sm">
                    <MessageCircle className="h-4 w-4" />
                    {post.comments.length}
                  </span>
                </div>
              </div>

              <PostComments postId={post.id} comments={post.comments} onComment={addComment} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function PostComments({
  postId,
  comments,
  onComment,
}: {
  postId: string;
  comments: { id: string; content: string; createdAt: string; author: { name: string; avatar: string | null } }[];
  onComment: (postId: string, content: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    setSending(true);
    setError(null);
    try {
      await onComment(postId, value.trim());
      setValue("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not post that comment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-sand-100 px-5 py-4">
      {comments.length > 0 && (
        <ul className="space-y-2.5">
          {comments.map((comment) => (
            <li key={comment.id} className="flex items-start gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-sand-200 text-[11px] font-bold text-forest-800">
                {comment.author.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={comment.author.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  comment.author.name.charAt(0)
                )}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-sand-800">
                  <span className="font-bold text-forest-900">{comment.author.name}</span>{" "}
                  {comment.content}
                </p>
                <p className="text-[10px] font-semibold text-sand-400">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="flex items-center gap-2">
        <label htmlFor={`comment-${postId}`} className="sr-only">
          Add a comment
        </label>
        <input
          id={`comment-${postId}`}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Add a comment…"
          className="field py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={sending}
          className="shrink-0 rounded-xl bg-forest-800 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
        >
          {sending ? "…" : "Reply"}
        </button>
      </form>
      {error && (
        <p role="alert" className="text-[11px] font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
