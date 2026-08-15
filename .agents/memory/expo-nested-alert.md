---
name: Expo web nested Alert bug
description: Alert.alert() called from inside another Alert's button handler silently fails on Expo web (the inner alert closes immediately). Use a Modal instead.
---

**Rule:** Never nest `Alert.alert()` inside another `Alert.alert()` button `onPress` handler in Expo — it only works on native, not web.

**Why:** On Expo web, `Alert.alert` is implemented as a browser dialog. Triggering a second one from inside the first dialog's callback causes the second to immediately close on most browsers (they treat it as a nested blocking call and dismiss it).

**How to apply:** Wherever a button should open a confirmation dialog before performing an async action (e.g. "Buy Now" → confirm → purchase), replace the inner Alert with a proper `<Modal>` bottom-sheet component. The outer auth-check Alert is fine; only the *inner* confirmation Alert causes problems.

**Pattern (broken):**
```tsx
const handleBuy = (listing) => {
  requireAuth(async () => {
    Alert.alert('Confirm', '...', [{ text: 'Buy', onPress: async () => { /* never fires on web */ } }]);
  });
};
```

**Pattern (fixed):**
```tsx
const handleBuy = (listing) => requireAuth(() => setBuyTarget(listing));
// In JSX: <Modal visible={!!buyTarget}> ... <Pressable onPress={confirmBuy}>Buy Now</Pressable> ... </Modal>
```
