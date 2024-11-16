import { useCallback, useState, useEffect, useMemo } from 'preact/hooks'

import config from '../config'
import withStyles from '../components/jss'
import Problem from '../components/problem'
import NotStarted from '../components/not-started'
import { useToast } from '../components/toast'

import { privateProfile } from '../api/profile'

import { getChallenges } from '../api/challenges'

const loadStates = {
  pending: 0,
  notStarted: 1,
  loaded: 2
}

const serializeTags = (tags) => {
  if (tags === undefined) return
  return Array.from(tags).map(([k, v]) => [k, Array.from(v)])
}

const deserializeTags = (tags) => {
  if (tags === undefined) return
  const outerMap = new Map()
  for (const [metatag, tag] of tags) {
    outerMap.set(metatag, new Map(tag))
  }
  return outerMap
}

const Challenges = ({ classes }) => {
  const challPageState = useMemo(() => JSON.parse(localStorage.getItem('challPageState') || '{}'), [])
  const [problems, setProblems] = useState(null)
  const [categories, setCategories] = useState(challPageState.categories || {})
  const [tags, setTags] = useState(deserializeTags(challPageState.tags) || new Map())
  const [showSolved, setShowSolved] = useState(challPageState.showSolved || false)
  const [solveIDs, setSolveIDs] = useState([])
  const [loadState, setLoadState] = useState(loadStates.pending)
  const { toast } = useToast()

  const setSolved = useCallback(id => {
    setSolveIDs(solveIDs => {
      if (!solveIDs.includes(id)) {
        return [...solveIDs, id]
      }
      return solveIDs
    })
  }, [])

  const handleShowSolvedChange = useCallback(e => {
    setShowSolved(e.target.checked)
  }, [])

  const handleCategoryCheckedChange = useCallback(e => {
    setCategories(categories => ({
      ...categories,
      [e.target.dataset.category]: e.target.checked
    }))
  }, [])

  const handleTagsCheckedChange = useCallback(e => {
    setTags(oldTags => {
      const newTags = new Map(oldTags)
      newTags.get(e.target.dataset.metatag).set(e.target.dataset.tag, e.target.checked)
      return newTags
    })
  }, [])

  useEffect(() => {
    document.title = `Challenges | ${config.ctfName}`
  }, [])

  useEffect(() => {
    const action = async () => {
      if (problems !== null) {
        return
      }
      const { data, error, notStarted } = await getChallenges()
      if (error) {
        toast({ body: error, type: 'error' })
        return
      }

      const { data: profileData, error: profileError } = await privateProfile()
      if (profileError) {
        toast({ body: error, type: 'error' })
        return
      }

      setSolveIDs(profileData.solves.map(solve => solve.id))

      setLoadState(notStarted ? loadStates.notStarted : loadStates.loaded)
      if (notStarted) {
        return
      }

      const newCategories = { ...categories }

      data.forEach(problem => {
        if (newCategories[problem.category] === undefined) {
          newCategories[problem.category] = false
        }
      })
      const newTags = new Map()
      data.forEach(problem => {
        for (const tag of problem.tags) {
          if (!newTags.has(tag.metatag)) {
            newTags.set(tag.metatag, new Map())
          }
          const metatagMap = newTags.get(tag.metatag)
          if (!metatagMap.has(tag.name)) {
            metatagMap.set(tag.name, Boolean(tags.get(tag.metatag)?.get(tag.name)))
          }
        }
      })

      const instancerPlaceholderRegex = new RegExp(/{instancer:([a-zA-Z0-9-]+)}/g)
      if (config.instancerUrl !== '') {
        data.forEach(problem => {
          problem.description = problem.description.replaceAll('{instancer}', `[Deploy challenge](${encodeURI(config.instancerUrl)}/chall/${problem.id}?token=${encodeURIComponent(profileData.instancerToken)})`)
          problem.description = problem.description.replaceAll('{instancer_token}', encodeURIComponent(profileData.instancerToken))
          problem.description = problem.description.replaceAll('{instancer_url}', encodeURI(config.instancerUrl))
          problem.description = problem.description.replaceAll(instancerPlaceholderRegex, `[Deploy challenge](${encodeURI(config.instancerUrl)}/chall/$1?token=${encodeURIComponent(profileData.instancerToken)})`)
        })
      }

      setProblems(data)
      setCategories(newCategories)

      setTags(newTags)
    }
    action()
  }, [toast, categories, tags, problems])

  // useEffect(() => {
  //   const action = async () => {
  //     const { data, error } = await getPrivateSolves()
  //     if (error) {
  //       toast({ body: error, type: 'error' })
  //       return
  //     }

  //     setSolveIDs(data.map(solve => solve.id))
  //   }
  //   action()
  // }, [toast])

  useEffect(() => {
    const newTags = serializeTags(tags)
    localStorage.challPageState = JSON.stringify({ categories, showSolved, tags: newTags })
  }, [categories, showSolved, tags])

  const problemsToDisplay = useMemo(() => {
    if (problems === null) {
      return []
    }
    let filtered = problems
    if (!showSolved) {
      filtered = filtered.filter(problem => !solveIDs.includes(problem.id))
    }
    let filterCategories = false
    Object.entries(categories).forEach(category => {
      console.log(category)
      if (category[1] && problems.some(problem => problem.category === category[0])) filterCategories = true
    })
    if (filterCategories) {
      Object.keys(categories).forEach(category => {
        if (categories[category] === false) {
          // Do not display this category
          filtered = filtered.filter(problem => problem.category !== category)
        }
      })
    }
    for (const [metatag, tag] of tags.entries()) {
      if (Array.from(tag.values()).some(x => x)) {
        const expectedTags = new Set(Array.from(tag.entries()).filter(([_tagName, selected]) => selected).map(([t, s]) => t))
        filtered = filtered.filter((problem) => {
          return problem.tags.some((tag) => tag.metatag === metatag && expectedTags.has(tag.name))
        })
      }
    }

    filtered.sort((a, b) => {
      if (a.points === b.points) {
        if (a.solves === b.solves) {
          const aWeight = a.sortWeight || 0
          const bWeight = b.sortWeight || 0

          return bWeight - aWeight
        }
        return b.solves - a.solves
      }
      return a.points - b.points
    })

    return filtered
  }, [problems, categories, showSolved, solveIDs, tags])

  const { categoryCounts, solvedCount } = useMemo(() => {
    const categoryCounts = new Map()
    let solvedCount = 0
    if (problems !== null) {
      for (const problem of problems) {
        if (!categoryCounts.has(problem.category)) {
          categoryCounts.set(problem.category, {
            total: 0,
            solved: 0
          })
        }

        const solved = solveIDs.includes(problem.id)
        categoryCounts.get(problem.category).total += 1
        if (solved) {
          categoryCounts.get(problem.category).solved += 1
        }

        if (solved) {
          solvedCount += 1
        }
      }
    }
    return { categoryCounts, solvedCount }
  }, [problems, solveIDs])

  if (loadState === loadStates.pending) {
    return null
  }

  if (loadState === loadStates.notStarted) {
    return <NotStarted />
  }

  return (
    <div class={`row ${classes.row}`}>
      <div class='col-3'>
        <div class={`frame ${classes.frame}`}>
          <div class='frame__body'>
            <div class='frame__title title'>Filters</div>
            <div class={classes.showSolved}>
              <div class='form-ext-control form-ext-checkbox'>
                <input id='show-solved' class='form-ext-input' type='checkbox' checked={showSolved} onChange={handleShowSolvedChange} />
                <label for='show-solved' class='form-ext-label'>Show Solved ({solvedCount}/{problems.length} solved)</label>
              </div>
            </div>
          </div>
        </div>
        <div class={`frame ${classes.frame}`}>
          <div class='frame__body'>
            <div class='frame__title title'>Categories</div>
            {
              Array.from(categoryCounts.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([category, { solved, total }]) => {
                return (
                  <div key={category} class='form-ext-control form-ext-checkbox'>
                    <input id={`category-${category}`} data-category={category} class='form-ext-input' type='checkbox' checked={categories[category]} onChange={handleCategoryCheckedChange} />
                    <label for={`category-${category}`} class='form-ext-label'>{category} ({solved}/{total} solved)</label>
                  </div>
                )
              })
            }
          </div>
        </div>
        <div class={`frame ${classes.frame}`}>
          <div class='frame__body'>
            <div class='frame__title title'>Tags</div>
            {
              Array.from(tags.keys()).sort((a, b) => a.localeCompare(b)).map((metatag) => {
                return (<div><h5 class='frame__title title'>{metatag}</h5>
                  {Array.from(tags.get(metatag).entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([tag, checked]) => {
                    return (
                      <div key={`tag-${metatag.length}-${metatag}-${tag}`} class='form-ext-control form-ext-checkbox'>
                        <input id={`tag-${metatag.length}-${metatag}-${tag}`} data-tag={tag} data-metatag={metatag} class='form-ext-input' type='checkbox' checked={checked} onChange={handleTagsCheckedChange} />
                        <label for={`tag-${metatag.length}-${metatag}-${tag}`} class='form-ext-label'>{tag}</label>
                      </div>
                    )
                  })}
                </div>)
              })
            }
          </div>
        </div>
      </div>
      <div class='col-6'>
        {
          problemsToDisplay.length > 0
            ? problemsToDisplay.map(problem => {
              return (
                <Problem
                  key={problem.id}
                  problem={problem}
                  solved={solveIDs.includes(problem.id)}
                  setSolved={setSolved}
                />
              )
            })
            : (<h1 class={classes.noneFound}>No challenges found</h1>)
        }
      </div>

    </div>
  )
}

export default withStyles({
  showSolved: {
    marginBottom: '0.625em'
  },
  frame: {
    marginBottom: '1em',
    paddingBottom: '0.625em',
    background: '#222'
  },
  row: {
    justifyContent: 'center',
    '& .title, & .frame__subtitle': {
      color: '#fff'
    }
  },
  noneFound: {
    margin: '0.5em'
  }
}, Challenges)
