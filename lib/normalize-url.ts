function parseUrl(value?: string | null): URL | null {
  if (!value) {
    return null
  }

  const trimmedValue = value.trim()

  try {
    return new URL(trimmedValue)
  } catch {}

  try {
    return new URL(`https://${trimmedValue}`)
  } catch {}

  return null
}

export function normalizeHostname(value: string): string {
  const url = parseUrl(value)

  if (url?.host) {
    return url.host
  }

  return value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

export function getHostname(value?: string | null): string | null {
  return parseUrl(value)?.host ?? null
}
