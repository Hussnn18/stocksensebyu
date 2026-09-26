import { useCallback, useEffect, useState } from 'react';
import { subscribe } from '../api/inventory';

/**
 * Runs an async loader and re-runs it when `deps` change or when any data is saved.
 * While reloading, the previous `data` stays on screen (no flash back to a skeleton).
 */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: undefined, loading: true, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    loader()
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => alive && setState((s) => ({ ...s, loading: false, error })));
    return () => {
      alive = false;
    };
    // Callers pass the loader's inputs as `deps`, so the loader itself is left out on purpose.
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
