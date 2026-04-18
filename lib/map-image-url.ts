import { Block } from 'notion-types'
import { defaultMapImageUrl } from 'react-notion-x'

import { defaultPageIcon, defaultPageCover } from './config'

type DefaultMapImageUrlBlock = Parameters<typeof defaultMapImageUrl>[1]

export const mapImageUrl = (
  url: string,
  block: Block | DefaultMapImageUrlBlock
) => {
  if (url === defaultPageCover || url === defaultPageIcon) {
    return url
  }

  return defaultMapImageUrl(url, block as DefaultMapImageUrlBlock)
}
