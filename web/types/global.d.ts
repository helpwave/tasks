export { }

declare global {
  interface Window {
    __ENV: Record<string, string | undefined>,
  }
}
