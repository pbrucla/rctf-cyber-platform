import db from './db'
import { Tag } from '../challenges/types'

export interface DatabaseTag {
  name: string,
  group: string,
  challid: string
}

export const getAllTags = (): Promise<DatabaseTag[]> => {
  return db.query<DatabaseTag>('SELECT * FROM tags')
    .then(res => res.rows)
}

export const getAllTagsByChallenge = async ({ challid }: {challid: string}): Promise<Tag[]> => {
  const res = await db.query<DatabaseTag>('SELECT * FROM tags WHERE challid = $1', [challid])
  return res.rows.map((tag) => { return { name: tag.name, group: tag.group } })
}

// export const getAllChallengesByTag = ({ tagname }: {tagname: string}): Promise<DatabaseTag[]> => {
//   return db.query<DatabaseTag>('SELECT * FROM tags WHERE name = $1', [tagname])
//     .then(res => res.rows)
// }

export const createTag = ({ name, challid, group }: DatabaseTag): Promise<DatabaseTag[]> => {
  return db.query<DatabaseTag>('INSERT INTO tags (challid, name, group) VALUES ($1, $2, $3) ON CONFLICT (challid, name) DO NOTHING RETURNING *', [challid, name, group])
    .then(res => res.rows)
}

export const removeTagByName = ({ name }: DatabaseTag): Promise<DatabaseTag[]> => {
  return db.query<DatabaseTag>('DELETE from tags where name = $1 RETURNING *', [name])
    .then(res => res.rows)
}

export const removeTagsByChall = ({ challid }: DatabaseTag): Promise<DatabaseTag[]> => {
  return db.query<DatabaseTag>('DELETE from tags where challid = $1 RETURNING *', [challid])
    .then(res => res.rows)
}
