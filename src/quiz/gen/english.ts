import type { Gen, Level } from '../types'
import { shuffle } from '../util'

const L1: [string, string][] = [
  ['abundant', 'existing in large quantities; plentiful'], ['accurate', 'correct and exact'], ['adjust', 'to change slightly to fit'],
  ['ancient', 'very old'], ['apparent', 'clearly visible or understood'], ['brief', 'lasting a short time'],
  ['cautious', 'careful to avoid danger or mistakes'], ['conceal', 'to hide from view'], ['courageous', 'brave'],
  ['decrease', 'to become smaller or fewer'], ['eager', 'strongly wanting to do something'], ['essential', 'absolutely necessary'],
  ['fragile', 'easily broken or damaged'], ['genuine', 'real; authentic'], ['hesitate', 'to pause before acting'],
  ['humble', 'not proud or boastful'], ['immense', 'extremely large'], ['loyal', 'faithful to a person or cause'],
  ['mention', 'to refer to briefly'], ['nervous', 'anxious or uneasy'], ['observe', 'to watch carefully'],
  ['peculiar', 'strange or unusual'], ['rare', 'not often found or seen'], ['reluctant', 'unwilling or hesitant'],
  ['significant', 'important or meaningful'], ['sturdy', 'strongly built'], ['tolerate', 'to put up with'],
  ['vacant', 'empty; not occupied'], ['wander', 'to move about without a fixed goal'], ['rapid', 'happening at great speed'],
]
const L2: [string, string][] = [
  ['ambiguous', 'open to more than one interpretation'], ['arbitrary', 'based on random choice rather than reason'],
  ['candid', 'honest and direct'], ['cogent', 'clear, logical, and convincing'], ['contend', 'to assert or argue'],
  ['diligent', 'showing steady, careful effort'], ['ephemeral', 'lasting a very short time'], ['erroneous', 'incorrect; mistaken'],
  ['exacerbate', 'to make a problem worse'], ['frugal', 'careful with money'], ['impartial', 'treating all sides fairly; unbiased'],
  ['inevitable', 'certain to happen; unavoidable'], ['lucid', 'clearly expressed; easy to understand'],
  ['meticulous', 'showing great attention to detail'], ['mitigate', 'to make less severe'], ['novel', 'new and original'],
  ['obscure', 'not well known; hard to understand'], ['pragmatic', 'dealing with things sensibly and realistically'],
  ['prolific', 'producing a great deal'], ['reticent', 'reluctant to share thoughts or feelings'],
  ['scrutinize', 'to examine closely'], ['substantiate', 'to provide evidence for'], ['superfluous', 'more than is needed'],
  ['tenacious', 'persistent; not giving up'], ['transient', 'lasting only a short time'], ['unanimous', 'agreed upon by everyone'],
  ['verbose', 'using more words than necessary'], ['viable', 'capable of working successfully'],
  ['volatile', 'liable to change rapidly and unpredictably'], ['zealous', 'passionately devoted to a cause'],
  ['benevolent', 'kind and generous'], ['concise', 'brief but complete'], ['elusive', 'difficult to find, catch, or achieve'],
  ['empirical', 'based on observation or experience'], ['innate', 'present from birth; natural'],
]
const L3: [string, string][] = [
  ['aberration', 'a departure from what is normal'], ['acquiesce', 'to accept something without protest'],
  ['alacrity', 'brisk and cheerful readiness'], ['ameliorate', 'to make better'], ['anachronism', 'something out of its proper time period'],
  ['antipathy', 'a deep-seated dislike'], ['assiduous', 'unceasingly diligent'], ['austere', 'severely plain; strict'],
  ['capricious', 'given to sudden, unpredictable changes of mood'], ['circumspect', 'cautious and unwilling to take risks'],
  ['clandestine', 'kept secret, especially for illicit reasons'], ['conundrum', 'a confusing and difficult problem'],
  ['corroborate', 'to confirm with evidence'], ['cursory', 'hasty and not thorough'], ['deleterious', 'causing harm'],
  ['didactic', 'intended to teach, often in an overly moralistic way'], ['ebullient', 'overflowing with enthusiasm'],
  ['enervate', 'to drain of energy or vitality'], ['equivocal', 'deliberately ambiguous; open to two interpretations'],
  ['esoteric', 'understood by only a small, specialized group'], ['fastidious', 'very attentive to detail; hard to please'],
  ['garrulous', 'excessively talkative'], ['iconoclast', 'a person who attacks cherished beliefs'], ['impecunious', 'having little or no money'],
  ['inchoate', 'just begun and not yet fully formed'], ['laconic', 'using very few words'], ['magnanimous', 'generous in forgiving'],
  ['obstreperous', 'noisy and difficult to control'], ['perfunctory', 'carried out with minimal effort'],
  ['pernicious', 'harmful in a gradual, subtle way'], ['perspicacious', 'having keen insight'], ['pugnacious', 'eager to fight or argue'],
  ['quixotic', 'idealistic to an impractical degree'], ['recalcitrant', 'stubbornly resisting authority'], ['sanguine', 'optimistic, especially in difficulty'],
  ['sycophant', 'a person who flatters the powerful for advantage'], ['taciturn', 'reserved or uncommunicative in speech'],
  ['ubiquitous', 'present or found everywhere'], ['vacillate', 'to waver between choices'], ['winsome', 'attractive in a childlike, innocent way'],
]

function vocab(level: Level, list: [string, string][]): Gen {
  return {
    level,
    topic: 'Vocabulary',
    make: rng => {
      const i = Math.floor(rng() * list.length)
      const [word, def] = list[i]
      const others = shuffle(rng, list.filter((_, k) => k !== i))
      if (rng() < 0.55)
        return {
          topic: 'Vocabulary',
          prompt: `Which definition best fits the word “${word}”?`,
          correct: def,
          wrong: others.slice(0, 5).map(o => o[1]),
          hint: 'Think of where you’ve seen the word, or break it into a root and prefix.',
          explanation: `“${word}” means ${def}.`,
        }
      return {
        topic: 'Vocabulary',
        prompt: `Which word means “${def}”?`,
        correct: word,
        wrong: others.slice(0, 5).map(o => o[0]),
        hint: 'Match the meaning; eliminate words you know mean something else.',
        explanation: `“${word}” means ${def}.`,
      }
    },
  }
}

export const english: Gen[] = [vocab(1, L1), vocab(2, L2), vocab(3, L3)]
