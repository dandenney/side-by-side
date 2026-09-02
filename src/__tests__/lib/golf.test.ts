import {
  Course,
  Round,
  isPlayed,
  lastRound,
  scoreDifferential,
} from '@/types/golf'

function makeRound(overrides: Partial<Round> = {}): Round {
  return {
    id: 'rd1',
    courseId: 'c1',
    playedOn: new Date('2026-06-01T00:00:00'),
    holesPlayed: 18,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// Minimal course factory — only the fields the derived helpers care about.
function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'c1',
    name: 'Torrey Pines',
    accessType: 'municipal',
    holes: 18,
    par: 72,
    wantsPlay: true,
    rounds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('isPlayed', () => {
  it('is false for a course with no rounds', () => {
    expect(isPlayed(makeCourse())).toBe(false)
  })

  it('is true as soon as there is one round', () => {
    expect(isPlayed(makeCourse({ rounds: [makeRound()] }))).toBe(true)
  })

  // The Bandon case: played and still on the wishlist. The two axes are
  // independent, so wantsPlay must not influence the derived fact.
  it('is independent of wantsPlay', () => {
    const played = makeCourse({ rounds: [makeRound()], wantsPlay: true })
    const done = makeCourse({ rounds: [makeRound()], wantsPlay: false })
    expect(isPlayed(played)).toBe(true)
    expect(isPlayed(done)).toBe(true)
  })
})

describe('lastRound', () => {
  it('is undefined when never played', () => {
    expect(lastRound(makeCourse())).toBeUndefined()
  })

  it('returns the first round, which the mapper sorts newest-first', () => {
    const recent = makeRound({ id: 'new', playedOn: new Date('2026-06-01T00:00:00') })
    const older = makeRound({ id: 'old', playedOn: new Date('2023-02-01T00:00:00') })
    expect(lastRound(makeCourse({ rounds: [recent, older] }))?.id).toBe('new')
  })
})

describe('scoreDifferential', () => {
  it('reads a full round against par', () => {
    const course = makeCourse()
    expect(scoreDifferential(course, makeRound({ score: 82 }))).toBe('+10')
  })

  it('returns E for level par', () => {
    expect(scoreDifferential(makeCourse(), makeRound({ score: 72 }))).toBe('E')
  })

  it('signs a round under par', () => {
    expect(scoreDifferential(makeCourse(), makeRound({ score: 69 }))).toBe('-3')
  })

  // A 41 on a par-72 course is +5 for nine holes, not -31. This is the whole
  // reason holes_played is stored alongside the score.
  it('prorates par for a nine-hole round', () => {
    const round = makeRound({ score: 41, holesPlayed: 9 })
    expect(scoreDifferential(makeCourse(), round)).toBe('+5')
  })

  it('prorates against a nine-hole course too', () => {
    const course = makeCourse({ holes: 9, par: 36 })
    const round = makeRound({ score: 40, holesPlayed: 9 })
    expect(scoreDifferential(course, round)).toBe('+4')
  })

  it('is undefined without a score', () => {
    expect(scoreDifferential(makeCourse(), makeRound())).toBeUndefined()
  })

  // Par is hand-entered and optional, so a score can outlive its context.
  it('is undefined when the course has no par', () => {
    const course = makeCourse({ par: undefined })
    expect(scoreDifferential(course, makeRound({ score: 82 }))).toBeUndefined()
  })
})
