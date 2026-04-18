import pMemoize from 'p-memoize'
import { PageMap } from 'notion-types'

import { includeNotionIdInUrls } from './config'
import { getNotionPage } from './notion-api'
import { getCanonicalPageId } from './get-canonical-page-id'
import { getRecordMapValue, normalizeRecordMap } from './normalize-record-map'
import * as config from './config'
import * as types from './types'

const uuid = !!includeNotionIdInUrls

export async function getSiteMap(): Promise<types.SiteMap> {
  const partialSiteMap = await getAllPages(
    config.rootNotionPageId,
    config.rootNotionSpaceId
  )

  return {
    site: config.site,
    ...partialSiteMap
  } as types.SiteMap
}

const getAllPages = pMemoize(getAllPagesImpl, {
  cacheKey: (...args) => JSON.stringify(args)
})

export const getRootPageRecordMap = pMemoize(
  async (rootNotionPageId: string) =>
    normalizeRecordMap(await getNotionPage(rootNotionPageId)),
  {
    cacheKey: (...args) => JSON.stringify(args)
  }
)

export const getSitePageIndex = pMemoize(
  async (
    rootNotionPageId: string,
    rootNotionSpaceId: string
  ): Promise<Array<{ pageId: string; block: any }>> => {
    const recordMap = await getRootPageRecordMap(rootNotionPageId)
    const normalizedRootPageId = rootNotionPageId.replace(/-/g, '')

    return Object.entries(recordMap.block || {})
      .map(([pageId, entry]) => ({
        pageId,
        block: getRecordMapValue<any>(entry as any)
      }))
      .filter(({ pageId, block }) => {
        if (!block || block.alive === false) {
          return false
        }

        if (pageId.replace(/-/g, '') === normalizedRootPageId) {
          return false
        }

        if (block.type !== 'page' && block.type !== 'collection_view_page') {
          return false
        }

        if (rootNotionSpaceId && block.space_id && block.space_id !== rootNotionSpaceId) {
          return false
        }

        return true
      })
  },
  {
    cacheKey: (...args) => JSON.stringify(args)
  }
)

async function getAllPagesImpl(
  rootNotionPageId: string,
  rootNotionSpaceId: string
): Promise<Partial<types.SiteMap>> {
  const recordMap = await getRootPageRecordMap(rootNotionPageId)
  const pageIndex = await getSitePageIndex(rootNotionPageId, rootNotionSpaceId)

  const canonicalPageMap = pageIndex.reduce(
    (map, { pageId }) => {
      const canonicalPageId = getCanonicalPageId(pageId, recordMap, {
        uuid
      })

      if (!canonicalPageId) {
        return map
      }

      if (map[canonicalPageId]) {
        console.warn('error duplicate canonical page id', {
          canonicalPageId,
          pageId,
          existingPageId: map[canonicalPageId]
        })

        return map
      } else {
        return {
          ...map,
          [canonicalPageId]: pageId
        }
      }
    },
    {}
  )

  return {
    pageMap: {
      [rootNotionPageId]: recordMap
    } as PageMap,
    canonicalPageMap
  }
}
