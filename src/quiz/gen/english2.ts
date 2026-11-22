import type { Gen, Level, Rng, Spec } from '../types'
import { pick, shuffle } from '../util'

const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const others = <T,>(rng: Rng, list: T[], not: (x: T) => boolean, n: number) => shuffle(rng, list.filter(x => !not(x))).slice(0, n)
const g = (level: Level, topic: string, make: (rng: Rng) => Spec): Gen => ({ level, topic, make })

// ---------- Commonly confused words: [sentence, correct, ...wrong] ----------
const CONFUSED: [string, string, string, string, string?][] = [
  ['The new policy will ___ every employee in the company.', 'affect', 'effect', 'affects’'],
  ['The medicine had a calming ___ on the patient.', 'effect', 'affect', 'affected'],
  ['___ is a strong chance of rain this afternoon.', 'There', 'Their', 'They’re'],
  ['The students left ___ backpacks in the hallway.', 'their', 'there', 'they’re'],
  ['If ___ late again, the coach will bench them.', 'they’re', 'their', 'there'],
  ['I think ___ going to love the surprise.', 'you’re', 'your', 'youre'],
  ['Please bring ___ ID to the front desk.', 'your', 'you’re', 'yours’'],
  ['The movie was ___ long, and I fell asleep.', 'too', 'to', 'two'],
  ['She walked ___ the end of the pier.', 'to', 'too', 'two'],
  ['Everyone ___ Mark finished the exam on time.', 'except', 'accept', 'expect'],
  ['Please ___ my apology for being late.', 'accept', 'except', 'expect'],
  ['The school ___ addressed the assembly this morning.', 'principal', 'principle', 'principel'],
  ['Honesty is a guiding ___ of the organization.', 'principle', 'principal', 'principel'],
  ['The dessert was a perfect ___ to the meal.', 'complement', 'compliment', 'complament'],
  ['She gave her teammate a sincere ___ after the game.', 'compliment', 'complement', 'complament'],
  ['I wonder ___ jacket this is.', 'whose', 'who’s', 'whos’'],
  ['___ going to drive us to the airport?', 'Who’s', 'Whose', 'Whos'],
  ['We’ll decide ___ to go depending on the forecast.', 'whether', 'weather', 'wether'],
  ['The ___ was perfect for a hike.', 'weather', 'whether', 'wether'],
  ['I need your ___ about which laptop to buy.', 'advice', 'advise', 'advize'],
  ['Doctors ___ patients to exercise regularly.', 'advise', 'advice', 'advices'],
  ['The runner couldn’t go any ___ without water.', 'farther', 'further', 'father'],
  ['We need to discuss the issue ___ at tomorrow’s meeting.', 'further', 'farther', 'furthest'],
  ['Don’t ___ your keys again!', 'lose', 'loose', 'loss'],
  ['The screw on the hinge is ___.', 'loose', 'lose', 'loss'],
  ['From the evidence, we can ___ that the sample was contaminated.', 'infer', 'imply', 'inferred'],
  ['Her silence seemed to ___ that she disagreed.', 'imply', 'infer', 'implied'],
  ['The car sat ___ at the red light.', 'stationary', 'stationery', 'stationairy'],
  ['She bought new ___ for the wedding invitations.', 'stationery', 'stationary', 'stationairy'],
]
const confused: Gen = g(1, 'Commonly confused words', rng => {
  const [s, c, w1, w2, w3] = pick(rng, CONFUSED)
  return {
    topic: 'Commonly confused words',
    prompt: `Choose the word that correctly completes the sentence: “${s}”`,
    correct: c,
    wrong: [w1, w2, ...(w3 ? [w3] : []), c.endsWith('s') ? c.slice(0, -1) : c + 's'],
    hint: 'Think about the part of speech and the exact meaning each option carries.',
    explanation: `“${c}” is the correct word in “${s.replace('___', c)}”`,
  }
})

// ---------- Irregular verbs: [base, past, participle, past-sentence, participle-sentence] ----------
const VERBS: [string, string, string, string, string][] = [
  ['begin', 'began', 'begun', 'The concert ___ at eight o’clock.', 'The show has already ___.'],
  ['break', 'broke', 'broken', 'Someone ___ the window last night.', 'The vase was ___ by the cat.'],
  ['choose', 'chose', 'chosen', 'She ___ the blue jacket.', 'Have you ___ a topic for your essay?'],
  ['do', 'did', 'done', 'He ___ his homework before dinner.', 'The work is finally ___.'],
  ['draw', 'drew', 'drawn', 'The artist ___ a portrait of the mayor.', 'The curtains were ___ shut.'],
  ['drink', 'drank', 'drunk', 'They ___ all the lemonade.', 'Someone has ___ my coffee.'],
  ['drive', 'drove', 'driven', 'We ___ to the coast last summer.', 'She has ___ across the country twice.'],
  ['eat', 'ate', 'eaten', 'The children ___ all the cookies.', 'Have you ___ lunch yet?'],
  ['fall', 'fell', 'fallen', 'The leaves ___ early this year.', 'The temperature has ___ sharply.'],
  ['fly', 'flew', 'flown', 'The geese ___ south in October.', 'She has ___ to Tokyo three times.'],
  ['forget', 'forgot', 'forgotten', 'I ___ my umbrella this morning.', 'He had ___ her name.'],
  ['give', 'gave', 'given', 'The teacher ___ us extra time.', 'She has ___ generously to the shelter.'],
  ['go', 'went', 'gone', 'We ___ to the museum on Sunday.', 'By the time we arrived, they had already ___.'],
  ['grow', 'grew', 'grown', 'The tomatoes ___ quickly in the sun.', 'The town has ___ rapidly.'],
  ['hide', 'hid', 'hidden', 'The squirrel ___ the acorns under a log.', 'The treasure was ___ for centuries.'],
  ['know', 'knew', 'known', 'She ___ the answer immediately.', 'He has ___ them since childhood.'],
  ['ride', 'rode', 'ridden', 'We ___ our bikes to school.', 'Have you ever ___ a horse?'],
  ['ring', 'rang', 'rung', 'The bell ___ at noon.', 'The church bells have ___ every hour.'],
  ['rise', 'rose', 'risen', 'The sun ___ at six.', 'Prices have ___ steadily.'],
  ['run', 'ran', 'run', 'She ___ a marathon last spring.', 'He has ___ every morning this week.'],
  ['see', 'saw', 'seen', 'We ___ a rainbow after the storm.', 'Have you ___ the new exhibit?'],
  ['shake', 'shook', 'shaken', 'The earthquake ___ the whole building.', 'The bottle was ___ before opening.'],
  ['sing', 'sang', 'sung', 'The choir ___ beautifully.', 'The anthem was ___ before the game.'],
  ['sink', 'sank', 'sunk', 'The old ship ___ in 1912.', 'The boat has ___ to the bottom.'],
  ['speak', 'spoke', 'spoken', 'The mayor ___ for an hour.', 'Have you ___ to your advisor?'],
  ['steal', 'stole', 'stolen', 'A thief ___ my bicycle.', 'The painting was ___ from the museum.'],
  ['swim', 'swam', 'swum', 'We ___ across the lake.', 'She has ___ in this pool for years.'],
  ['take', 'took', 'taken', 'He ___ the earlier train.', 'The seat has been ___.'],
  ['tear', 'tore', 'torn', 'She ___ the letter in half.', 'His jacket was ___ at the sleeve.'],
  ['throw', 'threw', 'thrown', 'The pitcher ___ a fastball.', 'The ball was ___ over the fence.'],
  ['wear', 'wore', 'worn', 'He ___ a tie to the interview.', 'The carpet has been ___ thin.'],
  ['write', 'wrote', 'written', 'Jane Austen ___ six novels.', 'The report was ___ by a committee.'],
  ['freeze', 'froze', 'frozen', 'The pond ___ overnight.', 'The pipes have ___.'],
  ['bite', 'bit', 'bitten', 'The dog ___ the mail carrier.', 'I have been ___ by mosquitoes.'],
  ['blow', 'blew', 'blown', 'The wind ___ the door open.', 'The fuse has ___.'],
]
const verbs: Gen = g(1, 'Irregular verbs', rng => {
  const [base, past, pp, sp, spp] = pick(rng, VERBS)
  const usePast = rng() < 0.5
  const [sentence, correct, swap] = usePast ? [sp, past, pp] : [spp, pp, past]
  const same = correct === swap
  return {
    topic: 'Irregular verbs',
    prompt: `Choose the correct form of “${base}”: “${sentence}”`,
    correct,
    wrong: [same ? base : swap, base, base.endsWith('e') ? `${base}d` : `${base}ed`, `${past}en`.replace(/ee/g, 'e')],
    hint: usePast ? 'A simple past-tense action needs the past form (no helping verb).' : 'After “has/have/had” or “was/were/been,” use the past participle.',
    explanation: `“${sentence.replace('___', correct)}” — principal parts: ${base}, ${past}, ${pp}.`,
  }
})

// ---------- Subject–verb agreement with indefinite pronouns ----------
const SVA: Gen = g(2, 'Subject–verb agreement', rng => {
  const sing = ['each', 'either', 'neither', 'one'], plur = ['both', 'few', 'many', 'several']
  const nouns = ['students', 'books', 'proposals', 'players', 'answers', 'tickets', 'engineers', 'paintings']
  const pairs: [string, string, string][] = [['is', 'are', 'ready for inspection.'], ['has', 'have', 'finished the assignment.'], ['was', 'were', 'late to the meeting.']]
  const [s, p, tail] = pick(rng, pairs)
  const isS = rng() < 0.6, pron = pick(rng, isS ? sing : plur), noun = pick(rng, nouns)
  return {
    topic: 'Subject–verb agreement',
    prompt: `Choose the verb that agrees with the subject: “${cap(pron)} of the ${noun} ___ ${tail}”`,
    correct: isS ? s : p,
    wrong: [isS ? p : s, isS ? `${p}n’t` : `${s}n’t`, 'be'],
    hint: 'Find the real subject — it is the pronoun, not the noun in the “of” phrase. Is it singular or plural?',
    explanation: `“${cap(pron)}” is ${isS ? 'singular' : 'plural'}, so the verb is “${isS ? s : p}.”`,
  }
})

// ---------- Idioms ----------
const IDIOMS: [string, string][] = [
  ['a blessing in disguise', 'something good that seemed bad at first'], ['bite the bullet', 'face a painful situation bravely'],
  ['cost an arm and a leg', 'be very expensive'], ['hit the sack', 'go to bed'], ['let the cat out of the bag', 'reveal a secret by accident'],
  ['once in a blue moon', 'very rarely'], ['a piece of cake', 'very easy'], ['under the weather', 'feeling slightly ill'],
  ['the ball is in your court', 'it is your turn to act'], ['beat around the bush', 'avoid the main point'], ['burn the midnight oil', 'work late into the night'],
  ['cut corners', 'do something cheaply by skipping steps'], ['call it a day', 'stop working for now'], ['get cold feet', 'become nervous about doing something'],
  ['hit the nail on the head', 'say exactly the right thing'], ['jump the gun', 'act too early'], ['kill two birds with one stone', 'accomplish two things with one action'],
  ['miss the boat', 'lose an opportunity'], ['on the fence', 'undecided'], ['pull someone’s leg', 'joke with someone'], ['read between the lines', 'find the hidden meaning'],
  ['steal the show', 'attract the most attention'], ['the last straw', 'the final problem that makes someone lose patience'], ['throw in the towel', 'give up'],
  ['turn a blind eye', 'deliberately ignore something'], ['a wild goose chase', 'a futile search'], ['add insult to injury', 'make a bad situation worse'],
  ['back to square one', 'start over from the beginning'], ['barking up the wrong tree', 'pursuing a mistaken course of action'], ['bury the hatchet', 'make peace after a quarrel'],
  ['cry over spilled milk', 'be upset about something that cannot be changed'], ['the elephant in the room', 'an obvious problem nobody wants to discuss'],
  ['face the music', 'accept the consequences'], ['go the extra mile', 'make an additional effort'], ['in hot water', 'in trouble'], ['keep your chin up', 'stay positive'],
  ['off the cuff', 'without preparation'], ['play it by ear', 'improvise as events unfold'], ['a rule of thumb', 'a rough guideline'],
  ['take it with a grain of salt', 'view it with skepticism'], ['the tip of the iceberg', 'a small visible part of a much larger problem'], ['walking on eggshells', 'being very careful not to upset someone'],
  ['bite off more than you can chew', 'take on more than you can handle'], ['caught red-handed', 'caught in the act'], ['cut to the chase', 'get to the point'],
  ['devil’s advocate', 'someone who argues the opposing side to test an idea'], ['hit the books', 'study hard'], ['let sleeping dogs lie', 'avoid stirring up old trouble'],
  ['spill the beans', 'reveal secret information'], ['the whole nine yards', 'everything; the full extent'],
]
const idioms: Gen = g(1, 'Idioms', rng => {
  const [id, meaning] = pick(rng, IDIOMS)
  return {
    topic: 'Idioms',
    prompt: `What does the idiom “${id}” mean?`,
    correct: meaning,
    wrong: others(rng, IDIOMS, x => x[0] === id, 5).map(x => x[1]),
    hint: 'An idiom’s meaning is figurative, not literal.',
    explanation: `“${cap(id)}” means ${meaning}.`,
  }
})

// ---------- Word roots & affixes ----------
const ROOTS: [string, string, string][] = [
  ['bio', 'life', 'biology'], ['geo', 'earth', 'geology'], ['graph', 'write or draw', 'autograph'], ['phon', 'sound', 'telephone'], ['tele', 'far', 'telescope'],
  ['micro', 'small', 'microscope'], ['photo', 'light', 'photograph'], ['port', 'carry', 'transport'], ['rupt', 'break', 'interrupt'], ['scrib/script', 'write', 'describe'],
  ['spect', 'look', 'inspect'], ['struct', 'build', 'construct'], ['ject', 'throw', 'eject'], ['dict', 'say', 'dictate'], ['aud', 'hear', 'audience'],
  ['vis/vid', 'see', 'visible'], ['anti-', 'against', 'antibiotic'], ['auto-', 'self', 'automobile'], ['circum-', 'around', 'circumference'], ['contra-', 'against', 'contradict'],
  ['inter-', 'between', 'international'], ['mal-', 'bad', 'malfunction'], ['mis-', 'wrongly', 'misunderstand'], ['multi-', 'many', 'multicolored'], ['pre-', 'before', 'preview'],
  ['post-', 'after', 'postpone'], ['sub-', 'under', 'submarine'], ['trans-', 'across', 'transatlantic'], ['mono-', 'one', 'monologue'], ['poly-', 'many', 'polygon'],
  ['omni-', 'all', 'omnivore'], ['hydr', 'water', 'dehydrate'], ['therm', 'heat', 'thermometer'], ['cred', 'believe', 'incredible'], ['mort', 'death', 'mortal'],
  ['path', 'feeling', 'empathy'], ['chron', 'time', 'chronology'], ['loqu', 'speak', 'eloquent'], ['ped', 'foot', 'pedestrian'], ['fract', 'break', 'fracture'],
  ['-phobia', 'fear', 'claustrophobia'], ['-cide', 'killing', 'pesticide'], ['ambul', 'walk', 'ambulance'], ['cogn', 'know', 'recognize'], ['dem', 'people', 'democracy'],
  ['jur', 'law', 'jury'], ['lumin', 'light', 'illuminate'], ['terr', 'earth', 'territory'], ['ven/vent', 'come', 'convention'], ['sym/syn-', 'together', 'synchronize'],
]
const roots: Gen = g(2, 'Word roots', rng => {
  const [r, m, ex] = pick(rng, ROOTS)
  const mode = rng() < 0.5
  if (mode)
    return {
      topic: 'Word roots',
      prompt: `The root or affix “${r}” (as in “${ex}”) most nearly means`,
      correct: m,
      wrong: others(rng, ROOTS, x => x[1] === m, 5).map(x => x[1]),
      hint: `Think about the meaning of “${ex}” and what part of it comes from “${r}.”`,
      explanation: `“${r}” means “${m}” (${ex}).`,
    }
  return {
    topic: 'Word roots',
    prompt: `Which word contains a root or affix meaning “${m}”?`,
    correct: ex,
    wrong: others(rng, ROOTS, x => x[1] === m, 5).map(x => x[2]),
    hint: 'Break each option into its parts.',
    explanation: `“${ex}” contains “${r}” = “${m}.”`,
  }
})

// ---------- Figurative language ----------
const DEVICES = ['simile', 'metaphor', 'personification', 'hyperbole', 'alliteration', 'onomatopoeia', 'oxymoron', 'irony', 'understatement', 'allusion']
const FIG: [string, string][] = [
  ['Her smile was as bright as the sun.', 'simile'], ['Time is a thief.', 'metaphor'], ['The stars danced across the sky.', 'personification'],
  ['I could eat a horse.', 'hyperbole'], ['Peter Piper picked a peck of pickled peppers.', 'alliteration'], ['The bacon sizzled and the bees buzzed.', 'onomatopoeia'],
  ['Jumbo shrimp', 'oxymoron'], ['A fire station burns to the ground.', 'irony'], ['“It’s just a scratch,” said the knight, his arm cut off.', 'understatement'],
  ['After the loss, he met his Waterloo.', 'allusion'], ['The classroom was a zoo.', 'metaphor'], ['She runs like the wind.', 'simile'],
  ['The wind howled angrily at the window.', 'personification'], ['I’ve told you a million times to clean your room.', 'hyperbole'], ['Sally sells seashells by the seashore.', 'alliteration'],
  ['The door creaked, then slammed with a bang.', 'onomatopoeia'], ['bittersweet memories', 'oxymoron'], ['A marriage counselor files for divorce.', 'irony'],
  ['The Grand Canyon is a decent-sized hole in the ground.', 'understatement'], ['He’s a real Romeo with the ladies.', 'allusion'], ['The sun smiled down on the picnic.', 'personification'],
  ['Life is a journey.', 'metaphor'], ['The wind was like a razor against my face.', 'simile'], ['Her suitcase weighed a ton.', 'hyperbole'],
  ['The fridge hummed and the faucet dripped, drip, drip.', 'onomatopoeia'], ['the sound of silence', 'oxymoron'], ['He was a Scrooge about the holiday bonus.', 'allusion'],
  ['The firefighter’s house caught fire from his own cooking.', 'irony'], ['Fate had it in for me.', 'personification'], ['Busy bees buzzed by the blossoms.', 'alliteration'],
]
const fig: Gen = g(1, 'Figurative language', rng => {
  const [ex, d] = pick(rng, FIG)
  return {
    topic: 'Figurative language',
    prompt: `Which literary device is used in this example? “${ex}”`,
    correct: d,
    wrong: DEVICES.filter(x => x !== d && !(d === 'metaphor' && x === 'simile')).concat(d === 'metaphor' ? ['simile'] : []),
    hint: 'Look for comparison words (like/as), human traits given to things, repeated sounds, or deliberate exaggeration.',
    explanation: `This is ${/^[aeiou]/.test(d) ? 'an' : 'a'} ${d}.`,
  }
})

// ---------- Logical fallacies ----------
const FALL: [string, string][] = [
  ['“Everyone is buying this phone, so it must be the best one.”', 'bandwagon'],
  ['“A famous actor uses this vitamin, so it must be good for you.”', 'appeal to false authority'],
  ['“The book is true because it says so on page one.”', 'circular reasoning'],
  ['“I met two rude tourists from Spain; people from Spain must be rude.”', 'hasty generalization'],
  ['“Why worry about pollution when there are people without jobs?”', 'red herring'],
  ['“My opponent wants to cut the budget, so he wants children to go uneducated.”', 'straw man'],
  ['“You’re either with us or against us.”', 'false dilemma'],
  ['“After I wore my lucky socks, we won, so the socks caused the win.”', 'post hoc'],
  ['“If we let them install one speed camera, soon every move we make will be watched.”', 'slippery slope'],
  ['“Don’t listen to her theory; she isn’t even a real scientist.”', 'ad hominem'],
]
const FNAMES = ['bandwagon', 'appeal to false authority', 'circular reasoning', 'hasty generalization', 'red herring', 'straw man', 'false dilemma', 'post hoc', 'slippery slope', 'ad hominem']
const fallacies: Gen = g(3, 'Logical fallacies', rng => {
  const [ex, f] = pick(rng, FALL)
  return {
    topic: 'Logical fallacies',
    prompt: `Which flaw in reasoning does this statement show? ${ex}`,
    correct: f,
    wrong: shuffle(rng, FNAMES.filter(x => x !== f)).slice(0, 5),
    hint: 'Ask: is the conclusion actually supported, or is the argument relying on a trick?',
    explanation: `This is a ${f} fallacy.`,
  }
})

export const english2: Gen[] = [confused, verbs, SVA, idioms, roots, fig, fallacies]
