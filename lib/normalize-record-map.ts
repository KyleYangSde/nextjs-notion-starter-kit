import { ExtendedRecordMap } from 'notion-types'

function normalizeMapEntries<T extends Record<string, any>>(map?: T): T {
  if (!map) {
    return map
  }

  return Object.fromEntries(
    Object.entries(map).map(([key, entry]) => {
      if (
        entry &&
        typeof entry === 'object' &&
        entry.value &&
        typeof entry.value === 'object' &&
        'value' in entry.value &&
        'role' in entry.value &&
        !('id' in entry.value)
      ) {
        return [
          key,
          {
            ...entry,
            role: entry.role || entry.value.role,
            value: entry.value.value
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
