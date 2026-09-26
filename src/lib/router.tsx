"use client";

/**
 * Router compatibility shim.
 *
 * The Travello prototype pages were written against `react-router-dom`.
 * Instead of rewriting every call site, we map that small API surface onto
 * Next.js navigation primitives. Only the pieces the ported pages use are
 * implemented, and each one behaves the same way the prototype expected.
 */

import NextLink from "next/link";
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from "next/navigation";
import type { ComponentProps, MouseEvent, ReactNode } from "react";

type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  to: string;
  children?: ReactNode;
};

export function Link({ to, children, ...rest }: LinkProps) {
  return (
    <NextLink href={to} {...rest}>
      {children}
    </NextLink>
  );
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  const search = searchParams.toString();

  return {
    pathname,
    search: search ? `?${search}` : "",
    hash: "",
    key: pathname,
    state: null as unknown,
  };
}

/** Mirrors `useNavigate`: accepts a path or a history delta (`navigate(-1)`). */
export function useNavigate() {
  const router = useRouter();

  return (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === "number") {
      if (to < 0) router.back();
      else router.forward();
      return;
    }
    if (options?.replace) router.replace(to);
    else router.push(to);
  };
}

export function useParams<T extends Record<string, string | string[]> = Record<string, string>>() {
  return useNextParams() as T;
}

/** Prototype-only helper retained for API compatibility. */
export function useNavigateBack() {
  const router = useRouter();
  return () => router.back();
}

export function stopPropagation(event: MouseEvent) {
  event.stopPropagation();
}
