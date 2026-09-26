"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, ShieldCheck, X } from "lucide-react";

import { useApp } from "@/components/travello/AppProvider";

/**
 * Inline editor for the public traveller details (name, handle, bio, avatar).
 * Saves through PATCH /api/profile/traveller so Profile, Community and the
 * header all reflect the change after a refresh.
 */
export function ProfileEditor() {
  const { user, updateTraveller } = useApp();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateTraveller({ name, username, bio, avatarUrl });
      setEditing(false);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setEditing(true);
            setSaved(false);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-xs font-bold text-sand-700 transition-colors hover:border-forest-300 hover:text-forest-800"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit profile
        </button>
        {saved && (
          <span
            role="status"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800"
          >
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-3xl border border-sand-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-forest-950">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Edit your traveller profile
        </h2>
        <button
          type="button"
          onClick={() => setEditing(false)}
          aria-label="Cancel editing"
          className="rounded-lg p-1.5 text-sand-500 hover:bg-sand-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-name" className="mb-1 block text-[11px] font-bold tracking-wide text-sand-600 uppercase">
            Full name
          </label>
          <input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="field py-2.5 text-sm"
            maxLength={80}
            required
          />
        </div>
        <div>
          <label htmlFor="profile-username" className="mb-1 block text-[11px] font-bold tracking-wide text-sand-600 uppercase">
            Handle
          </label>
          <input
            id="profile-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="field py-2.5 text-sm"
            maxLength={40}
            placeholder="@yourhandle"
          />
        </div>
      </div>

      <div>
        <label htmlFor="profile-avatar" className="mb-1 block text-[11px] font-bold tracking-wide text-sand-600 uppercase">
          Avatar image URL
        </label>
        <input
          id="profile-avatar"
          type="url"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          className="field py-2.5 text-sm"
          maxLength={500}
          placeholder="https://…"
        />
      </div>

      <div>
        <label htmlFor="profile-bio" className="mb-1 block text-[11px] font-bold tracking-wide text-sand-600 uppercase">
          Bio
        </label>
        <textarea
          id="profile-bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          rows={3}
          maxLength={400}
          className="field resize-none text-sm"
          placeholder="Tell other travellers what you care about…"
        />
      </div>

      {error && (
        <p role="alert" className="text-xs font-semibold text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-forest-800 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-forest-900 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-sand-600 hover:bg-sand-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
