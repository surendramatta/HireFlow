export function applicationStatus(confirmed: boolean) {
  return confirmed ? 'applied' as const : 'ready_to_submit' as const;
}

export function submissionIncrement(confirmed: boolean) {
  return confirmed ? 1 : 0;
}
