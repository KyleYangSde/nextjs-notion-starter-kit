import { NotionAPI } from 'notion-client'

export const notion = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL
})

const maxPageLoadAttempts = 4

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getNotionPage(
  ...args: Parameters<NotionAPI['getPage']>
): Promise<Awaited<ReturnType<NotionAPI['getPage']>>> {
  for (let attempt = 0; attempt < maxPageLoadAttempts; attempt += 1) {
    try {
      return await notion.getPage(...args)
    } catch (error: any) {
      const isLastAttempt = attempt === maxPageLoadAttempts - 1

      if (error?.statusCode !== 429 || isLastAttempt) {
        throw error
      }

      await sleep(750 * (attempt + 1))
    }
  }

  throw new Error('Unable to load Notion page')
}
