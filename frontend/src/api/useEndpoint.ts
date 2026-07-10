/**
 * Lazily fetch a compute endpoint and expose its loading/error/data state.
 *
 * A tab's panel calls this on mount, so the endpoint fires only once the user actually opens
 * that tab. The fetch re-runs whenever `deps` change (e.g. a new committed threshold), and an
 * in-flight request is cancelled if the inputs change again before it resolves.
 */

import { useEffect, useState } from "react";
import { ApiError } from "./client";
import type { ApiResponse } from "./types";

export interface AsyncState<T> {
  data: T | null;
  busy: boolean;
  error: string | null;
}

export function useEndpoint<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  deps: unknown[],
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, busy: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, busy: true, error: null });
    fetcher()
      .then((res) => {
        if (!cancelled) setState({ data: res.data, busy: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : "Computation failed.";
        setState({ data: null, busy: false, error: message });
      });
    return () => {
      cancelled = true;
    };
    // The fetcher closes over the same values as `deps`; deps is the intended trigger set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
