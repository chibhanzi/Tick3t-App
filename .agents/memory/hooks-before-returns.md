---
name: React hooks before early returns
description: In Expo/React Native screens, all useState/useEffect/useRef calls must appear before any conditional return (auth guards, loading checks, not-found checks). Violating this causes a silent crash on web and a React error on native.
---

**Rule:** Every hook in a screen component must be called unconditionally at the top of the function body, before the first `if (...) return`.

**Why:** React's Rules of Hooks forbid calling hooks after a conditional branch. On Expo web the component silently renders nothing (white/blank screen). On native it throws a "rendered fewer hooks than expected" error.

**How to apply:** In screens with auth guards or early returns (e.g. `if (!isAuthenticated) return <AuthPrompt/>`), move ALL `useState`, `useRef`, `useCallback`, `useMemo`, `useEffect` calls above the guard block. Only the JSX return itself is conditional.

**Pattern:**
```tsx
export default function ProtectedScreen() {
  const { isAuthenticated } = useAuth();
  // ✅ All hooks BEFORE the guard
  const [filter, setFilter] = useState('upcoming');
  const [modal, setModal] = useState(null);

  if (!isAuthenticated) return <AuthPrompt />;  // ✅ Guard AFTER hooks

  return <MainContent />;
}
```
