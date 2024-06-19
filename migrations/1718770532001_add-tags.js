exports.up = (pgm) => {
  pgm.createTable('tags', {
    name: { type: 'string', notNull: true },
    metatag: { type: 'string' },
    challid: { type: 'string', notNull: true }
  })

  pgm.addConstraint('tags', 'tag_challid_fkey', {
    foreignKeys: {
      columns: 'challid',
      references: 'challenges("id")',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    }
  })
  pgm.addConstraint('tags', 'tag_pkey', {
    primaryKey: ['challid', 'name']
  })
}

exports.down = (pgm) => {
  pgm.dropConstraint('tags', 'tag_challid_fkey')
  pgm.dropConstraint('tags', 'tag_pkey')
  pgm.dropTable('tags')
}
