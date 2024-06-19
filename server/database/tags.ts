import db from './db'

export interface DatabaseTag {
  name: string,
  challid: string
}

export const getAllTags = (): Promise<string[]> => {
  return db.query<DatabaseTag>('SELECT * FROM tags')
    .then(res => res.rows)
    .then(rows => rows.flatMap((row) => [row.name]))
}

export const getAllTagsByChallenge = ({ challid }: {challid: string}): Promise<string[]> => {
  return db.query<DatabaseTag>('SELECT * FROM tags WHERE challid = $1', [challid])
    .then(res => res.rows)
    .then(rows => rows.flatMap((row) => [row.name]))
}

export const getAllChallengesByTag = ({ tagname }: {tagname: string}): Promise<string[]> => {
  return db.query<DatabaseTag>('SELECT * FROM tags WHERE name = $1', [tagname])
    .then(res => res.rows)
    .then(rows => rows.flatMap((row) => [row.challid]))
}

export const createTag = ({ name, challid }: DatabaseTag): Promise<DatabaseTag[]> => {
  return db.query<DatabaseTag>('INSERT INTO tags (challid, name) VALUES ($1, $2) ON CONFLICT (challid, name) DO NOTHING RETURNING *', [challid, name])
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

// export const getAllTagsByChallenge = ({ challid }): Promise<string[]> => {
//   return db.query<string[]>('SELECT name FROM tags WHERE challid = $1', [challid])
//     .then(res => res.rows)
// }

// export const getChallengeById = ({ id }: Pick<DatabaseChallenge, 'id'>): Promise<DatabaseChallenge | undefined> => {
//   return db.query<DatabaseChallenge>('SELECT * FROM challenges WHERE id = $1', [id])
//     .then(res => res.rows[0])
// }

// export const createChallenge = ({ id, data }: DatabaseChallenge): Promise<DatabaseChallenge> => {
//   return db.query<DatabaseChallenge>('INSERT INTO challenges ($1, $2) RETURNING *',
//     [id, data]
//   )
//     .then(res => res.rows[0])
// }

// export const removeChallengeById = ({ id }: Pick<DatabaseChallenge, 'id'>): Promise<DatabaseChallenge | undefined> => {
//   return db.query<DatabaseChallenge>('DELETE FROM challenges WHERE id = $1 RETURNING *', [id])
//     .then(res => res.rows[0])
// }

// export const upsertChallenge = async ({ id, data }: DatabaseChallenge): Promise<void> => {
//   await db.query(`
//     INSERT INTO challenges VALUES($1, $2)
//       ON CONFLICT (id)
//       DO UPDATE SET data = $2
//     `,
//   [id, data]
//   )
// }
