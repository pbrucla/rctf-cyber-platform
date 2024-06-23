import db from './db'
import { Tag } from '../challenges/types'
import { PoolClient } from 'pg'

export interface DatabaseTag {
  name: string,
  metatag: string,
  challid: string
}

export const getAllTags = (): Promise<DatabaseTag[]> => {
  return db.query<DatabaseTag>('SELECT * FROM tags')
    .then(res => res.rows)
}

export const getAllTagsByChallenge = async ({ challid }: {challid: string}, client?: PoolClient): Promise<Tag[]> => {
  let res
  if (client) {
    res = await client.query<DatabaseTag>('SELECT * FROM tags WHERE challid = $1', [challid])
  } else {
    res = await db.query<DatabaseTag>('SELECT * FROM tags WHERE challid = $1', [challid])
  }
  return res.rows.map((tag) => { return { name: tag.name, metatag: tag.metatag } })
}

// export const getAllChallengesByTag = ({ tagname }: {tagname: string}): Promise<DatabaseTag[]> => {
//   return db.query<DatabaseTag>('SELECT * FROM tags WHERE name = $1', [tagname])
//     .then(res => res.rows)
// }

export const setTag = ({ name, challid, metatag }: DatabaseTag, client?: PoolClient): Promise<DatabaseTag[]> => {
  if (client) {
    return client.query<DatabaseTag>('INSERT INTO tags (challid, name, metatag) VALUES ($1, $2, $3) ON CONFLICT (challid, name, metatag) DO NOTHING RETURNING *', [challid, name, metatag])
      .then(res => res.rows)
  } else {
    return db.query<DatabaseTag>('INSERT INTO tags (challid, name, metatag) VALUES ($1, $2, $3) ON CONFLICT (challid, name, metatag) DO NOTHING RETURNING *', [challid, name, metatag])
      .then(res => res.rows)
  }
}

export const removeTagByName = ({ name, challid, metatag }: DatabaseTag, client?: PoolClient): Promise<DatabaseTag[]> => {
  if (client) {
    return client.query<DatabaseTag>('DELETE from tags where name = $1 AND challid = $2 AND metatag = $3 RETURNING *', [name, challid, metatag])
      .then(res => res.rows)
  } else {
    return db.query<DatabaseTag>('DELETE from tags where name = $1 AND challid = $2 AND metatag = $3 RETURNING *', [name, challid, metatag])
      .then(res => res.rows)
  }
}

export const removeTagsByChall = ({ challid }: DatabaseTag): Promise<DatabaseTag[]> => {
  return db.query<DatabaseTag>('DELETE from tags where challid = $1 RETURNING *', [challid])
    .then(res => res.rows)
}
