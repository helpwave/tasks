type ScrollMetrics = {
  scrollHeight: number,
  scrollTop: number,
  clientHeight: number,
}

export function isNearBottom(element: ScrollMetrics, thresholdPx: number): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight < thresholdPx
}
