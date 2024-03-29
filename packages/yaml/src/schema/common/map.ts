import { isMap } from '../../nodes/identity.js'
import { YAMLMap } from '../../nodes/YAMLMap.js'
import type { CollectionTag } from '../types.js'

export const map: CollectionTag = {
  collection: 'map',
  default: true,
  nodeClass: YAMLMap,
  tag: 'tag:yaml.org,2002:map',
  resolve(map, onError) {
    if (!isMap(map)) onError('Expected a mapping for this tag')
    return map
  },
  createNode: (schema, obj, ctx) => YAMLMap.from(schema, obj, ctx)
}
