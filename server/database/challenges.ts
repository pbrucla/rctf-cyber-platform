import db from './db'
import { Challenge, Tag } from '../challenges/types'
import { getAllTagsByChallenge, setTag, removeTagsByChall, removeTagByName } from './tags'

export interface DatabaseChallenge {
  id: string;
  data: Omit<Challenge, 'id'>;
}

export const getAllChallenges = async (): Promise<DatabaseChallenge[]> => {
  const challs = (await db.query<DatabaseChallenge>('SELECT * FROM challenges')).rows
  return await Promise.all(challs.map(async (chall) => {
    chall.data.tags = await getAllTagsByChallenge({ challid: chall.id })
    return chall
  }))
}

export const getChallengeById = async ({ id }: Pick<DatabaseChallenge, 'id'>): Promise<DatabaseChallenge | undefined> => {
  const chall = (await db.query('SELECT * FROM challenges WHERE id = $1', [id])).rows[0] as DatabaseChallenge | undefined
  if (chall === undefined) return undefined
  chall.data.tags = await getAllTagsByChallenge({ challid: id })
  return chall
}

export const createChallenge = async ({ id, data }: DatabaseChallenge): Promise<DatabaseChallenge> => {
  const ret = await db.query<DatabaseChallenge>('INSERT INTO challenges ($1, $2) RETURNING *',
    [id, data]
  )
  for (const tag of data.tags) {
    await setTag({ ...tag, challid: id })
  }
  return ret.rows[0]
}

export const removeChallengeById = ({ id }: Pick<DatabaseChallenge, 'id'>): Promise<DatabaseChallenge | undefined> => {
  return db.query<DatabaseChallenge>('DELETE FROM challenges WHERE id = $1 RETURNING *', [id])
    .then(res => res.rows[0])
}

export const upsertChallenge = async ({ id, data }: DatabaseChallenge): Promise<void> => {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await db.query(`
      INSERT INTO challenges VALUES($1, $2)
        ON CONFLICT (id)
        DO UPDATE SET data = $2
      `,
    [id, data]
    )
    if (data.tags instanceof Array) {
      const existingTags = await getAllTagsByChallenge({ challid: id }, client)
      for (const existingTag of existingTags) {
        // At this point, data.tags should be an array of Tags
        if (!data.tags.some((t) => { return t.name === existingTag.name && t.metatag === existingTag.metatag })) {
          await removeTagByName({ ...existingTag, challid: id }, client)
        }
      }
      for (const tag of data.tags) {
        await setTag({ ...tag, challid: id }, client)
      }
    }
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}
