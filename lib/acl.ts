import { PageProps } from './types'
import { getPageRootBlock } from './normalize-record-map'

export async function pageAcl({
  site,
  recordMap,
  pageId
}: PageProps): Promise<PageProps> {
  if (!site) {
    return {
      error: {
        statusCode: 404,
        message: 'Unable to resolve notion site'
      }
    }
  }

  if (!recordMap) {
    return {
      error: {
        statusCode: 404,
        message: `Unable to resolve page for domain "${site.domain}". Notion page "${pageId}" not found.`
      }
    }
  }

  const rootBlock = getPageRootBlock(recordMap)

  if (!rootBlock) {
    return {
      error: {
        statusCode: 404,
        message: `Unable to resolve page for domain "${site.domain}". Notion page "${pageId}" invalid data.`
      }
    }
  }

  const rootSpaceId = rootBlock.space_id

  if (
    rootSpaceId &&
    site.rootNotionSpaceId &&
    rootSpaceId !== site.rootNotionSpaceId
  ) {
    if (process.env.NODE_ENV) {
      return {
        error: {
          statusCode: 404,
          message: `Notion page "${pageId}" doesn't belong to the Notion workspace owned by "${site.domain}".`
        }
      }
    }
  }
}
