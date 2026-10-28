"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export interface SaveOptions {
  autosave?: boolean;
  // The tab's own Save button saves even when nothing changed, as it always has
  force?: boolean;
}

type Saver = (options?: SaveOptions) => Promise<unknown>;

interface PostSaveRegistry {
  register: (key: string, saver: Saver | null) => void;
  setDirty: (key: string, dirty: boolean) => void;
}

const PostSaveContext = createContext<PostSaveRegistry | null>(null);
export const PostSaveProvider = PostSaveContext.Provider;

// Owned by the blog editor, so its one Save button (and autosave) covers every tab
export function usePostSaveRegistry() {
  const savers = useRef(new Map<string, Saver>());
  const [dirtyKeys, setDirtyKeys] = useState<ReadonlySet<string>>(new Set());

  const registry = useMemo<PostSaveRegistry>(
    () => ({
      register: (key, saver) => {
        if (saver) savers.current.set(key, saver);
        else savers.current.delete(key);
      },
      setDirty: (key, dirty) =>
        setDirtyKeys((prev) => {
          if (prev.has(key) === dirty) return prev;
          const next = new Set(prev);
          if (dirty) next.add(key);
          else next.delete(key);
          return next;
        }),
    }),
    []
  );

  // Each section skips the request when it has nothing new
  const saveSections = useCallback(
    (options?: SaveOptions) => Promise.all([...savers.current.values()].map((save) => save(options))),
    []
  );

  return { registry, dirtyKeys, saveSections };
}

// For a section tab: tracks unsaved edits against what was last loaded or saved, and lets the
// editor's main Save button save it. Returns the save function for the tab's own button.
export function useSectionSave<T, R = unknown>(
  key: string,
  content: T,
  loaded: boolean,
  persist: (content: T, autosave: boolean) => Promise<R>
) {
  const registry = useContext(PostSaveContext);
  const json = JSON.stringify(content);
  const [savedJson, setSavedJson] = useState<string | null>(null);

  // What the server sent becomes the baseline once loading finishes
  useEffect(() => {
    if (loaded && savedJson === null) setSavedJson(json);
  }, [loaded, savedJson, json]);

  const dirty = savedJson !== null && json !== savedJson;
  useEffect(() => {
    registry?.setDirty(key, dirty);
  }, [registry, key, dirty]);
  useEffect(() => () => registry?.setDirty(key, false), [registry, key]);

  const latest = useRef({ content, json, dirty, persist });
  latest.current = { content, json, dirty, persist };

  const save = useCallback(async ({ autosave = false, force = false }: SaveOptions = {}): Promise<R | undefined> => {
    const { content, json, dirty, persist } = latest.current;
    if (!dirty && !force) return undefined;
    const result = await persist(content, autosave);
    // Edits typed while the request was out stay marked as unsaved
    setSavedJson(json);
    return result;
  }, []);

  useEffect(() => {
    if (!registry) return;
    registry.register(key, save);
    return () => registry.register(key, null);
  }, [registry, key, save]);

  return save;
}

// Shared by the section tabs: upserts one section of a post
export async function saveBlogSection(blogId: string, section: string, content: unknown, autosave: boolean) {
  const res = await fetch(`/api/blog-sections${autosave ? "?autosave=1" : ""}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blogId, section, content }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Couldn't save the ${section} section`);
  return data as { message?: string };
}
