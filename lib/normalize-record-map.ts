import { Block, ExtendedRecordMap } from 'notion-types'

type WrappedValue<T> = {
  role?: unknown
  value: T
}

function isWrappedValue<T>(value: unknown): value is WrappedValue<T> {
  return !!(
    value &&
    typeof value === 'object' &&
    'value' in value &&
    'role' in value &&
    !('id' in value)
  )
}

export function getRecordMapValue<T>(
  entry?: {
    value?: T | WrappedValue<T>
  } | null
): T | undefined {
  const value = entry?.value

  if (isWrappedValue<T>(value)) {
    return value.value
  }

  return value as T | undefined
}

export function getPageRootBlock(recordMap?: ExtendedRecordMap): Block | undefined {
  const firstBlockId = Object.keys(recordMap?.block || {})[0]
  if (!firstBlockId) {
    return undefined
  }

  return getRecordMapValue<Block>(recordMap?.block?.[firstBlockId] as any)
}

function normalizeMapEntries<T extends Record<string, any>>(map?: T): T {
  if (!map) {
    return map
  }

  return Object.fromEntries(
    Object.entries(map).map(([key, entry]) => {
      const value = getRecordMapValue(entry)

      if (value !== undefined && value !== entry?.value) {
        return [
          key,
          {
            ...entry,
            role: entry.role || entry.value.role,
            value
          }
        ]
      }

      return [key, entry]
    })
  ) as T
}

export function normalizeRecordMap(
  recordMap: ExtendedRecordMap
): ExtendedRecordMap {
  if (!recordMap) {
    return recordMap
  }

  return {
    ...recordMap,
    block: normalizeMapEntries(recordMap.block),
    collection: normalizeMapEntries(recordMap.collection),
    collection_view: normalizeMapEntries(recordMap.collection_view),
    notion_user: normalizeMapEntries(recordMap.notion_user)
  }
}
