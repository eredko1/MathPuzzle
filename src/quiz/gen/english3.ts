import type { Gen, Level, Rng, Spec } from '../types'
import { pick, shuffle } from '../util'

const g = (level: Level, topic: string, make: (rng: Rng) => Spec): Gen => ({ level, topic, make })
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

const NAMES = ['Maya', 'Ethan', 'Priya', 'Carlos', 'Aisha', 'Noah', 'Sofia', 'Liam', 'Hana', 'Omar', 'Grace', 'Jin', 'Lucas', 'Zoe', 'Ravi', 'Elena', 'Tariq', 'Mia', 'Felix', 'Nora']
const PLACES = ['library', 'market', 'museum', 'station', 'park', 'gym', 'clinic', 'stadium', 'bakery', 'airport', 'school', 'harbor']

// ---------- agreement with prepositional phrases ----------
const HEADS = ['box', 'list', 'team', 'bouquet', 'collection', 'series', 'pile', 'set', 'group', 'stack', 'bundle', 'row', 'crate', 'album', 'shelf', 'basket']
const PLUR = ['books', 'flowers', 'tickets', 'pencils', 'reports', 'photographs', 'students', 'apples', 'tools', 'letters', 'coins', 'maps', 'toys', 'shells', 'recipes', 'notes']
const FRAMES: [string, string, string[], string][] = [
  ['is', 'are', ['be', 'been'], 'missing from the display.'],
  ['was', 'were', ['be', 'been'], 'left on the table.'],
  ['has', 'have', ['having', 'are having'], 'arrived at the office.'],
  ['is', 'are', ['be', 'been'], 'ready for inspection.'],
  ['was', 'were', ['be', 'been'], 'sold last week.'],
  ['has', 'have', ['having', 'are having'], 'been moved to the new building.'],
]
const agreement = g(2, 'Subject–verb agreement', rng => {
  const [s, p, junk, tail] = pick(rng, FRAMES)
  const head = pick(rng, HEADS), plur = pick(rng, PLUR)
  if (rng() < 0.55)
    return {
      topic: 'Subject–verb agreement',
      prompt: `Choose the verb that agrees with the subject: “The ${head} of ${plur} ___ ${tail}”`,
      correct: s,
      wrong: [p, ...junk],
      hint: `The subject is “${head},” not “${plur}.” The “of” phrase only describes it.`,
      explanation: `“${cap(head)}” is singular, so the verb is “${s}.”`,
    }
  return {
    topic: 'Subject–verb agreement',
    prompt: `Choose the verb that agrees with the subject: “The ${plur} in the ${head} ___ ${tail}”`,
    correct: p,
    wrong: [s, ...junk],
    hint: `The subject is “${plur},” not “${head}.”`,
    explanation: `“${cap(plur)}” is plural, so the verb is “${p}.”`,
  }
})

// ---------- pronoun case & who/whom ----------
const pronouns = g(1, 'Pronouns', rng => {
  const n = pick(rng, NAMES), place = pick(rng, PLACES)
  const mode = pick(rng, ['subj', 'obj', 'who', 'whom'] as const)
  if (mode === 'subj')
    return {
      topic: 'Pronouns',
      prompt: `Choose the correct pronoun: “${n} and ___ walked to the ${place} together.”`,
      correct: 'I',
      wrong: ['me', 'myself', 'us'],
      hint: 'Drop the other person: you would say “___ walked to the ' + place + '.”',
      explanation: 'The pronoun is a subject, so “I” is correct.',
    }
  if (mode === 'obj')
    return {
      topic: 'Pronouns',
      prompt: `Choose the correct pronoun: “The guide showed ${n} and ___ around the ${place}.”`,
      correct: 'me',
      wrong: ['I', 'myself', 'mine'],
      hint: 'Drop the other person: “The guide showed ___ around.”',
      explanation: 'The pronoun is an object of “showed,” so “me.”',
    }
  if (mode === 'who')
    return {
      topic: 'Pronouns',
      prompt: `Choose the correct word: “${n} is the volunteer ___ organized the ${place} cleanup.”`,
      correct: 'who',
      wrong: ['whom', 'whose', 'which'],
      hint: 'Is the missing word the subject of “organized”?',
      explanation: '“Who” is the subject of “organized.”',
    }
  return {
    topic: 'Pronouns',
    prompt: `Choose the correct word: “${n} is the person ___ I met at the ${place}.”`,
    correct: 'whom',
    wrong: ['who', 'whose', 'which'],
    hint: 'Try “I met him/her” — an object form.',
    explanation: '“Whom” is the object of “met.”',
  }
})

// ---------- verb tense ----------
const VERBS: [string, string, string][] = [
  ['write', 'wrote', 'written'], ['take', 'took', 'taken'], ['give', 'gave', 'given'], ['make', 'made', 'made'], ['find', 'found', 'found'],
  ['draw', 'drew', 'drawn'], ['choose', 'chose', 'chosen'], ['send', 'sent', 'sent'], ['build', 'built', 'built'], ['leave', 'left', 'left'],
  ['bring', 'brought', 'brought'], ['hold', 'held', 'held'], ['keep', 'kept', 'kept'], ['buy', 'bought', 'bought'], ['see', 'saw', 'seen'],
  ['finish', 'finished', 'finished'], ['open', 'opened', 'opened'], ['teach', 'taught', 'taught'], ['sell', 'sold', 'sold'],
]
const OBJS = ['report', 'letter', 'package', 'schedule', 'map', 'door', 'speech', 'recipe']
const SING = ['She', 'He', 'The manager', 'My neighbor', 'The pilot', 'Our teacher']
const PLU = ['They', 'The students', 'Our guests', 'The engineers', 'My cousins']
const tense = g(2, 'Verb tense', rng => {
  const [base, past, pp] = pick(rng, VERBS), obj = pick(rng, OBJS)
  if (rng() < 0.5) {
    const marker = pick(rng, ['Yesterday', 'Last week', 'In 2019', 'Two days ago', 'Last night', 'Last year'])
    const subj = pick(rng, [...SING, ...PLU])
    return {
      topic: 'Verb tense',
      prompt: `Choose the correct verb form: “${marker}, ${subj.toLowerCase()} ___ (${base}) the ${obj}.”`,
      correct: past,
      wrong: [pp === past ? `has ${pp}` : pp, base, `will ${base}`, `had ${base}`],
      hint: `“${marker}” points to a finished action in the past.`,
      explanation: `Simple past of “${base}” is “${past}.”`,
    }
  }
  const sing = rng() < 0.5
  const subj = pick(rng, sing ? SING : PLU), have = sing ? 'has' : 'have', other = sing ? 'have' : 'has'
  return {
    topic: 'Verb tense',
    prompt: `Choose the correct verb form: “By now, ${subj.toLowerCase()} ___ (${base}) the ${obj} already.”`,
    correct: `${have} ${pp}`,
    wrong: [`${other} ${pp}`, `will ${base}`, `${have} ${base}`],
    hint: '“By now … already” signals the present perfect: has/have + past participle.',
    explanation: `${cap(have)} ${pp} fits “by now … already.”`,
  }
})

// ---------- plurals & possessives ----------
const NOUNS: [string, string, string, string][] = [
  ['dog', 'dogs', 'dog’s', 'dogs’'], ['child', 'children', 'child’s', 'children’s'], ['teacher', 'teachers', 'teacher’s', 'teachers’'],
  ['woman', 'women', 'woman’s', 'women’s'], ['student', 'students', 'student’s', 'students’'], ['bird', 'birds', 'bird’s', 'birds’'],
  ['man', 'men', 'man’s', 'men’s'], ['nurse', 'nurses', 'nurse’s', 'nurses’'], ['fox', 'foxes', 'fox’s', 'foxes’'], ['mouse', 'mice', 'mouse’s', 'mice’s'],
  ['worker', 'workers', 'worker’s', 'workers’'], ['sister', 'sisters', 'sister’s', 'sisters’'],
]
const THINGS = ['toys', 'coats', 'lunches', 'notebooks', 'tools', 'bikes', 'schedules', 'voices', 'tracks', 'homes']
const possessive = g(1, 'Punctuation', rng => {
  const [s, p, sp, pp] = pick(rng, NOUNS), thing = pick(rng, THINGS)
  const plural = rng() < 0.5
  const correct = plural ? pp : sp
  const wrong = shuffle(rng, [...new Set([plural ? sp : pp, p, s, plural ? `${p}’s` : `${s}s’`])]).filter(x => x !== correct).slice(0, 3)
  return {
    topic: 'Punctuation',
    prompt: `Which form completes the sentence? “The ___ ${thing} were everywhere.” (The ${thing} belong to ${plural ? `several ${p}` : `one ${s}`}.)`,
    correct,
    wrong,
    hint: plural ? 'Plural possessive: if the plural ends in s, add only an apostrophe; otherwise add ’s.' : 'Singular possessive: add ’s.',
    explanation: `The ${thing} belong to ${plural ? `several ${p}` : `one ${s}`}, so “${correct}.”`,
  }
})

// ---------- spelling ----------
const SPELL: [string, string][] = [
  ['necessary', 'needed'], ['separate', 'to divide'], ['definitely', 'certainly'], ['occurrence', 'an event'], ['accommodate', 'to provide room for'],
  ['embarrass', 'to make self-conscious'], ['conscience', 'inner sense of right and wrong'], ['receive', 'to get'], ['weird', 'strange'], ['calendar', 'a chart of dates'],
  ['maintenance', 'upkeep'], ['millennium', 'a thousand years'], ['rhythm', 'a regular beat'], ['privilege', 'a special right'], ['pronunciation', 'how a word is said'],
  ['questionnaire', 'a written set of questions'], ['restaurant', 'a place to dine'], ['schedule', 'a timetable'], ['tomorrow', 'the day after today'], ['vacuum', 'a space with no air'],
  ['government', 'a ruling body'], ['environment', 'surroundings'], ['library', 'a place with books to borrow'], ['February', 'the second month'], ['knowledge', 'what one knows'],
  ['recommend', 'to suggest'], ['neighbor', 'someone living nearby'], ['committee', 'a group chosen for a task'], ['exaggerate', 'to overstate'], ['harass', 'to bother persistently'],
  ['mischievous', 'playfully naughty'], ['occasionally', 'now and then'], ['perseverance', 'steady persistence'], ['supersede', 'to replace'], ['threshold', 'the entrance to a room'],
  ['bureaucracy', 'rule-bound administration'], ['conscientious', 'careful and diligent'], ['liaison', 'a go-between'], ['guarantee', 'a firm promise'], ['independent', 'not relying on others'],
  ['acquaintance', 'someone you know slightly'], ['apparent', 'clearly seen'], ['beginning', 'the start'], ['believe', 'to accept as true'], ['business', 'a commercial enterprise'],
  ['changeable', 'able to change'], ['column', 'a tall vertical support'], ['courteous', 'polite'], ['embarrassment', 'a feeling of awkwardness'], ['foreign', 'from another country'],
]
const mutate = (w: string, rng: Rng): string => {
  const i = 1 + Math.floor(rng() * (w.length - 2)), kind = Math.floor(rng() * 5)
  if (kind === 0) return w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2) // swap
  if (kind === 1) return w.slice(0, i) + w.slice(i + 1) // drop
  if (kind === 2) return w.slice(0, i) + w[i] + w.slice(i) // double
  if (kind === 3) return w.includes('ie') ? w.replace('ie', 'ei') : w.includes('ei') ? w.replace('ei', 'ie') : w.slice(0, i) + w[i] + w.slice(i)
  const V = 'aeiou'
  return w.replace(/[aeiou]/, v => V[(V.indexOf(v) + 1) % 5])
}
const spelling = g(1, 'Spelling', rng => {
  const [w, def] = pick(rng, SPELL)
  const bad = new Set<string>()
  for (let i = 0; i < 40 && bad.size < 3; i++) {
    const m = mutate(w, rng)
    if (m !== w && m.length > 2) bad.add(m)
  }
  return {
    topic: 'Spelling',
    prompt: `Which is the correct spelling of the word meaning “${def}”?`,
    correct: w,
    wrong: [...bad],
    hint: 'Look for the doubled letters and the order of vowels.',
    explanation: `The correct spelling is “${w}.”`,
  }
})

// ---------- synonyms & antonyms ----------
const SYN: [string, string, Level][] = [
  ['big', 'large', 1], ['small', 'tiny', 1], ['happy', 'joyful', 1], ['sad', 'unhappy', 1], ['quick', 'fast', 1], ['begin', 'start', 1], ['end', 'finish', 1], ['smart', 'clever', 1],
  ['difficult', 'hard', 1], ['quiet', 'silent', 1], ['angry', 'furious', 1], ['tired', 'weary', 1], ['brave', 'courageous', 1], ['strange', 'odd', 1], ['rich', 'wealthy', 1],
  ['abundant', 'plentiful', 2], ['candid', 'frank', 2], ['diligent', 'industrious', 2], ['frugal', 'thrifty', 2], ['obstinate', 'stubborn', 2], ['concise', 'brief', 2],
  ['hostile', 'antagonistic', 2], ['lenient', 'merciful', 2], ['prudent', 'cautious', 2], ['vivid', 'striking', 2], ['tranquil', 'serene', 2], ['feeble', 'weak', 2],
  ['gregarious', 'sociable', 2], ['lethargic', 'sluggish', 2], ['meager', 'scant', 2],
  ['ubiquitous', 'omnipresent', 3], ['ephemeral', 'fleeting', 3], ['laconic', 'terse', 3], ['pernicious', 'destructive', 3], ['sagacious', 'wise', 3], ['ostentatious', 'showy', 3],
  ['capricious', 'fickle', 3], ['intransigent', 'uncompromising', 3], ['munificent', 'generous', 3], ['obsequious', 'servile', 3], ['pellucid', 'transparent', 3],
  ['recondite', 'obscure', 3], ['truculent', 'belligerent', 3], ['loquacious', 'talkative', 3], ['parsimonious', 'stingy', 3],
]
const ANT: [string, string, Level][] = [
  ['ancient', 'modern', 1], ['generous', 'stingy', 1], ['expand', 'shrink', 1], ['victory', 'defeat', 1], ['permit', 'forbid', 1], ['bold', 'timid', 1], ['ascend', 'descend', 1],
  ['accept', 'reject', 1], ['arrive', 'depart', 1], ['scarce', 'plentiful', 2], ['transparent', 'opaque', 2], ['optimistic', 'pessimistic', 2], ['voluntary', 'compulsory', 2],
  ['praise', 'criticize', 2], ['vague', 'precise', 2], ['harmony', 'discord', 2], ['benevolent', 'malevolent', 3], ['loquacious', 'taciturn', 3], ['ephemeral', 'permanent', 3],
  ['candid', 'evasive', 3], ['frugal', 'extravagant', 3], ['gregarious', 'reclusive', 3], ['lucid', 'obscure', 3], ['zenith', 'nadir', 3], ['sanguine', 'despondent', 3],
]
const wordGens = ([1, 2, 3] as Level[]).flatMap(level => [
  g(level, 'Synonyms & antonyms', rng => {
    const pool = SYN.filter(x => x[2] === level)
    const [w, s] = pick(rng, pool)
    return {
      topic: 'Synonyms & antonyms',
      prompt: `Which word is closest in meaning to “${w}”?`,
      correct: s,
      wrong: shuffle(rng, pool.filter(x => x[0] !== w)).slice(0, 4).map(x => x[1]),
      hint: 'Pick the word that could replace it in a sentence.',
      explanation: `“${w}” and “${s}” have nearly the same meaning.`,
    }
  }),
  g(level, 'Synonyms & antonyms', rng => {
    const pool = ANT.filter(x => x[2] === level)
    const [w, a] = pick(rng, pool)
    return {
      topic: 'Synonyms & antonyms',
      prompt: `Which word is most nearly the opposite of “${w}”?`,
      correct: a,
      wrong: shuffle(rng, pool.filter(x => x[0] !== w)).slice(0, 4).map(x => x[1]),
      hint: 'Think of what “' + w + '” is not.',
      explanation: `“${a}” is the opposite of “${w}.”`,
    }
  }),
])

export const english3: Gen[] = [agreement, pronouns, tense, possessive, spelling, ...wordGens]
