import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// SSR-safe "has this component hydrated on the client yet" check -
// useSyncExternalStore is the React-recommended replacement for the old
// useEffect(() => setMounted(true), []) pattern (flagged by
// react-hooks/set-state-in-effect): it returns the server snapshot during
// SSR and hydration, then the client snapshot afterward, without a
// setState call inside an effect.
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
