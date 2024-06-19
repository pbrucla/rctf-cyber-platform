import db from './db'
import { Challenge } from '../challenges/types'
import { getAllTagsByChallenge } from './tags'

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

export const createChallenge = ({ id, data }: DatabaseChallenge): Promise<DatabaseChallenge> => {
  return db.query<DatabaseChallenge>('INSERT INTO challenges ($1, $2) RETURNING *',
    [id, data]
  )
    .then(res => res.rows[0])
}

export const removeChallengeById = ({ id }: Pick<DatabaseChallenge, 'id'>): Promise<DatabaseChallenge | undefined> => {
  return db.query<DatabaseChallenge>('DELETE FROM challenges WHERE id = $1 RETURNING *', [id])
    .then(res => res.rows[0])
}

export const upsertChallenge = async ({ id, data }: DatabaseChallenge): Promise<void> => {
  await db.query(`
    INSERT INTO challenges VALUES($1, $2)
      ON CONFLICT (id)
      DO UPDATE SET data = $2
    `,
  [id, data]
  )
}
