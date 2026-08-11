// Keeps a child node visually pinned while a state update changes layout.
// Measures the node's viewport top before/after `mutate()` and compensates
// by adjusting container.scrollTop by the delta.
export async function keepNodeStationary(
  container: HTMLElement,
  node: HTMLElement,
  mutate: () => void | Promise<void>
) {
  if (!container || !node) {
    await Promise.resolve(mutate());
    return;
  }

  const beforeTop = node.getBoundingClientRect().top;

  await Promise.resolve(mutate());

  // wait for layout after state updates
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));

  const afterTop = node.getBoundingClientRect().top;
  const delta = afterTop - beforeTop;

  // if the card grew and shifted up (afterTop < beforeTop), delta is negative,
  // so subtracting delta effectively scrolls down to keep it in place.
  container.scrollTop -= delta;
}
