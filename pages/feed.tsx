import RSS from 'rss'
import type { GetServerSideProps } from 'next'
import {
  getBlockParentPage,
  getBlockTitle,
  getPageProperty,
  idToUuid
} from 'notion-utils'

import * as config from 'lib/config'
import { getRootPageRecordMap, getSitePageIndex } from 'lib/get-site-map'
import { getCanonicalPageUrl } from 'lib/map-page-url'
import { mapImageUrl } from 'lib/map-image-url'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify({ error: 'method not allowed' }))
    res.end()
    return { props: {} }
  }

  const rootRecordMap = await getRootPageRecordMap(config.rootNotionPageId)
  const sitePageIndex = await getSitePageIndex(
    config.rootNotionPageId,
    config.rootNotionSpaceId
  )
  const ttlMinutes = 10
  const ttlSeconds = ttlMinutes * 60

  const feed = new RSS({
    title: config.name,
    site_url: config.host,
    feed_url: `${config.host}/feed.xml`,
    language: config.language,
    ttl: ttlMinutes
  })

  for (const { pageId, block } of sitePageIndex) {
    const parentPage = getBlockParentPage(block, rootRecordMap)
    const isBlogPost =
      block.type === 'page' &&
      block.parent_table === 'block' &&
      parentPage?.id === idToUuid(config.rootNotionPageId)
    if (!isBlogPost) {
      continue
    }

    const title = getBlockTitle(block, rootRecordMap) || config.name
    const description =
      getPageProperty<string>('Description', block, rootRecordMap) ||
      config.description
    const url = getCanonicalPageUrl(config.site, rootRecordMap)(pageId)
    const lastUpdatedTime = getPageProperty<number>(
      'Last Updated',
      block,
      rootRecordMap
    )
    const publishedTime = getPageProperty<number>(
      'Published',
      block,
      rootRecordMap
    )
    const date = lastUpdatedTime
      ? new Date(lastUpdatedTime)
      : publishedTime
      ? new Date(publishedTime)
      : undefined
    const socialImageUrl = mapImageUrl(
      getPageProperty<string>('Social Image', block, rootRecordMap) ||
        block.format?.page_cover ||
        config.defaultPageCover,
      block
    )

    feed.item({
      title,
      url,
      date,
      description,
      enclosure: socialImageUrl
        ? {
            url: socialImageUrl,
            type: 'image/jpeg'
          }
        : undefined
    })
  }

  const feedText = feed.xml({ indent: true })

  res.setHeader(
    'Cache-Control',
    `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds}`
  )
  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  res.write(feedText)
  res.end()

  return { props: {} }
}

export default () => null
