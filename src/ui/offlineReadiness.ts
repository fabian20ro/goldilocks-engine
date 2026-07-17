const pendingDurableCommands = new Set<number>();

let shellReady = false;
let latestStateDurable = true;

function publishReadiness(): void {
  document.documentElement.dataset.offlineReady = String(
    shellReady && latestStateDurable && pendingDurableCommands.size === 0,
  );
}

export function setOfflineShellReady(ready: boolean): void {
  shellReady = ready;
  publishReadiness();
}

export function markDurableCommandPending(requestId: number): void {
  pendingDurableCommands.add(requestId);
  publishReadiness();
}

export function acknowledgeDurableState(
  requestId: number | undefined,
  durable: boolean,
): void {
  latestStateDurable = durable;
  if (requestId !== undefined) pendingDurableCommands.delete(requestId);
  publishReadiness();
}

export function resetOfflineReadinessForTest(): void {
  pendingDurableCommands.clear();
  shellReady = false;
  latestStateDurable = true;
  publishReadiness();
}
