import type { BankItem, Gen, Level } from '../types'
import { shuffle } from '../util'
import { englishBank } from '../bank/english'
import { rows, type Row } from '../bank/rows'

/** Which SAT Reading & Writing domain each topic belongs to. */
export const SAT_RW_DOMAIN: Record<string, string> = {
  'Vocabulary in context': 'Craft & Structure', 'Words in context': 'Craft & Structure', 'Text structure & purpose': 'Craft & Structure',
  'Cross-text connections': 'Craft & Structure', Tone: 'Craft & Structure', 'Author’s purpose': 'Craft & Structure', 'Passage structure': 'Craft & Structure',
  'Nuance in word choice': 'Craft & Structure', 'Word choice': 'Craft & Structure', Poetry: 'Craft & Structure', 'Tone & irony': 'Craft & Structure',
  'Reading comprehension': 'Information & Ideas', 'Central ideas': 'Information & Ideas', Inference: 'Information & Ideas', Evidence: 'Information & Ideas',
  'Quantitative evidence': 'Information & Ideas', 'Logical completion': 'Information & Ideas', 'Argument analysis': 'Information & Ideas',
  'Subject–verb agreement': 'Standard English Conventions', Punctuation: 'Standard English Conventions', Modifiers: 'Standard English Conventions',
  'Parallel structure': 'Standard English Conventions', Comparisons: 'Standard English Conventions', Pronouns: 'Standard English Conventions',
  'Verb tense': 'Standard English Conventions', 'Mood & verbs': 'Standard English Conventions', Semicolons: 'Standard English Conventions',
  'Relative clauses': 'Standard English Conventions', Hyphens: 'Standard English Conventions', 'Double negatives': 'Standard English Conventions',
  'Sentence boundaries': 'Standard English Conventions', 'Irregular verbs': 'Standard English Conventions', 'Idioms & prepositions': 'Standard English Conventions',
  Transitions: 'Expression of Ideas', 'Rhetorical synthesis': 'Expression of Ideas', Concision: 'Expression of Ideas', Rhetoric: 'Expression of Ideas', Redundancy: 'Expression of Ideas',
}

const Q1 = 'Which choice completes the text with the most logical and precise word or phrase?'
const Q2 = 'Which choice completes the text so that it conforms to the conventions of Standard English?'

const NEW: Row[] = [
  // ----- Easy -----
  ['Words in context', 1, `The museum’s new exhibit is meant to ___ visitors’ curiosity about ocean life and encourage them to ask questions.\n\n${Q1}`, 'stimulate', ['dismiss', 'satisfy completely', 'conceal'], 'Which word fits the goal of encouraging questions?', 'To “stimulate” curiosity is to arouse it.'],
  ['Words in context', 1, `The trail was so ___ that hikers had to use both hands to climb over the boulders.\n\n${Q1}`, 'rugged', ['smooth', 'short', 'crowded'], 'Climbing over boulders suggests rough terrain.', '“Rugged” means rough and uneven.'],
  ['Words in context', 1, `Her ___ answer, given without hesitation, impressed the interviewers.\n\n${Q1}`, 'prompt', ['vague', 'delayed', 'uncertain'], '“Without hesitation” points to speed and confidence.', 'A “prompt” answer is immediate.'],
  ['Central ideas', 1, 'Sea otters sometimes float on their backs and use a flat rock as an anvil to crack open shellfish. Scientists consider this tool use remarkable because it is rare among animals that are not primates.\n\nWhich choice best states the main idea of the text?', 'Sea otters’ use of tools is unusual among non-primate animals.', ['Sea otters eat only shellfish.', 'Primates are better tool users than sea otters.', 'Rocks are common on ocean floors.'], 'What is the passage mostly about?', 'The text highlights otter tool use and why scientists find it notable.'],
  ['Inference', 1, 'After the library extended its weekend hours, the number of visitors on Saturdays and Sundays more than doubled. Librarians noted that many new visitors were families with young children.\n\nWhich choice most logically follows from the text?', 'The longer weekend hours made it easier for families to visit.', ['Children no longer read books at home.', 'The library cut its weekday hours.', 'Most visitors were unhappy with the change.'], 'Connect the change to the result.', 'More weekend hours coincided with more family visits.'],
  ['Subject–verb agreement', 1, `The group of researchers ___ planning to publish its results next month.\n\n${Q2}`, 'is', ['are', 'were', 'have been'], 'Is the subject “researchers” or “group”?', 'The subject “group” is singular, so the verb is “is.”'],
  ['Punctuation', 1, `Several ___ nests were hidden in the tall grass near the pond.\n\n${Q2}`, 'birds’', ['bird’s', 'birds', 'birds’s'], 'More than one bird owns the nests.', 'Plural possessive: birds’.'],
  ['Verb tense', 1, `Last summer, Dana volunteered at an animal shelter, where she ___ dozens of dogs.\n\n${Q2}`, 'walked', ['walks', 'will walk', 'has been walking'], 'Match the past-tense setting.', 'The sentence is in the past, so “walked.”'],
  ['Sentence boundaries', 1, `The storm knocked out power for several hours ___ residents used candles and flashlights.\n\n${Q2}`, ', so', ['so', '; so', ': so'], 'Two complete sentences joined by a coordinating conjunction need a comma.', 'Use a comma before “so” joining two independent clauses.'],
  ['Text structure & purpose', 1, 'Maria’s bakery opens at five every morning. By six, the first customers line up for warm bread, and by noon the shelves are empty. “I never know how much to bake,” Maria says, “because it always sells out.”\n\nWhich choice best states the main purpose of the text?', 'To describe how popular a local bakery is', ['To explain how to bake bread', 'To argue that bakeries should open later', 'To compare two bakeries'], 'What impression does the passage build?', 'The details show the bakery’s popularity.'],
  ['Quantitative evidence', 1, 'A student claims that more students bike to school in spring than in winter. A survey found that 12% of students biked in winter and 31% biked in spring.\n\nWhich choice most effectively uses the data to support the student’s claim?', 'The survey found that 31% of students biked in spring compared with 12% in winter.', ['The survey asked students about winter and spring.', 'Many students bike because it is good exercise.', 'Winter has fewer daylight hours than spring.'], 'Pick the choice that actually compares the two numbers.', 'Only the first choice cites both figures to make the comparison.'],
  ['Rhetorical synthesis', 1, 'While researching a topic, a student takes these notes:\n• The Blue Ridge Trail is 12 miles long.\n• It passes three waterfalls.\n• It is rated “moderate.”\n\nThe student wants to introduce the trail to readers who have never hiked it. Which choice best does this?', 'The Blue Ridge Trail, a moderate 12-mile route, passes three waterfalls.', ['The Blue Ridge Trail is rated moderate.', 'Waterfalls are popular with hikers.', 'Twelve miles is a long way to walk.'], 'The best choice gives the key facts together.', 'It combines length, difficulty, and the main feature.'],
  ['Words in context', 1, `Because the instructions were ___, even a beginner could assemble the shelf in ten minutes.\n\n${Q1}`, 'clear', ['confusing', 'missing', 'lengthy'], 'What would let a beginner finish quickly?', '“Clear” instructions are easy to follow.'],
  ['Pronouns', 1, `The committee presented ___ findings to the board on Tuesday.\n\n${Q2}`, 'its', ['their’s', 'it’s', 'they’re'], 'The committee is a single group.', '“Its” is the singular possessive pronoun.'],

  // ----- Medium -----
  ['Words in context', 2, `Although the novel received ___ reviews when it was first published, later critics reappraised it as a masterpiece.\n\n${Q1}`, 'lukewarm', ['glowing', 'unanimous', 'enthusiastic'], '“Although … later reappraised as a masterpiece” signals an initially weak reception.', '“Lukewarm” means unenthusiastic.'],
  ['Words in context', 2, `The mayor’s remarks were deliberately ___: listeners could interpret them as support for the plan or as criticism of it.\n\n${Q1}`, 'ambiguous', ['emphatic', 'candid', 'repetitive'], 'Two opposite readings are possible.', '“Ambiguous” means open to more than one interpretation.'],
  ['Central ideas', 2, 'Lichens are sensitive to air pollution: species that tolerate sulfur dioxide are common near factories, while delicate species disappear. Because of this predictable response, ecologists survey lichens to gauge air quality without costly equipment.\n\nWhich choice best states the main idea of the text?', 'Lichens can serve as inexpensive indicators of air quality.', ['Factories deliberately grow lichens.', 'Sulfur dioxide is harmless to most organisms.', 'Ecologists prefer costly equipment.'], 'Look for the claim that ties the examples together.', 'The passage explains how lichens indicate pollution.'],
  ['Inference', 2, 'In an experiment, plants watered with a mineral solution grew an average of 14 cm in four weeks. Plants in a control group, watered with plain water, grew an average of 9 cm.\n\nWhich choice is best supported by the data?', 'The mineral solution may have promoted growth.', ['Plain water stunts plant growth.', 'The control group received too much light.', 'Plants cannot grow without minerals.'], 'Be careful not to overstate what the data show.', 'The difference suggests (but does not prove) a growth benefit.'],
  ['Text structure & purpose', 2, 'Many people assume that the Great Wall of China is visible from space. In reality, astronauts report that the wall is far too narrow to pick out with the naked eye from orbit; highways and cities are easier to spot.\n\nWhich choice best describes the function of the text?', 'It challenges a common belief with evidence.', ['It praises the wall’s engineering.', 'It describes how astronauts train.', 'It proposes a new wall design.'], 'Notice “many assume … In reality.”', 'The text introduces a myth and corrects it.'],
  ['Cross-text connections', 2, 'Text 1: Cities should replace parking lots with parks because green space improves residents’ health and lowers summer temperatures.\n\nText 2: A planner notes that downtown businesses depend on parking for customers, so removing lots could hurt local shops.\n\nBased on the texts, how would the planner in Text 2 most likely respond to the claim in Text 1?', 'By cautioning that the plan could harm local businesses', ['By agreeing that parks are unnecessary', 'By proposing to build more parking lots in parks', 'By denying that green space affects health'], 'The planner’s concern is economic.', 'Text 2 introduces a cost that Text 1 does not address.'],
  ['Quantitative evidence', 2, 'A researcher claims that a new fertilizer increases crop yield. In a trial, fields using the fertilizer produced an average of 48 bushels per acre, while fields without it produced 39.\n\nWhich choice most effectively uses the data to support the claim?', 'Fields with the fertilizer averaged 48 bushels per acre, 9 more than the 39 produced without it.', ['The trial included many fields.', 'Fertilizer is widely used by farmers.', 'Yields were measured in bushels per acre.'], 'Evidence should compare the two groups directly.', 'The difference of 9 bushels per acre supports the claim.'],
  ['Punctuation', 2, `The experiment required three materials ___ a beaker, a thermometer, and a heat source.\n\n${Q2}`, ':', [';', ',', 'no punctuation'], 'A complete clause introduces a list.', 'A colon introduces a list after an independent clause.'],
  ['Parallel structure', 2, `The program helps students build résumés, practice interviewing, and ___.\n\n${Q2}`, 'connect with employers', ['connecting with employers', 'employers who they can connect with', 'to connect with employers'], 'Keep the verb forms parallel.', 'All three items begin with a base-form verb.'],
  ['Modifiers', 2, `Having reviewed the data for several weeks, ___\n\n${Q2}`, 'the researchers submitted their report.', ['the report was submitted by the researchers.', 'their report was submitted.', 'a submission was made.'], 'Who reviewed the data?', 'The subject right after the modifier must be the people who reviewed.'],
  ['Logical completion', 2, `While supporters argue that the policy will cut costs, critics note that the projected savings ___.\n\n${Q1}`, 'could be offset by new expenses', ['are already guaranteed', 'prove the policy’s success', 'have no relevance'], '“While … critics note” signals a counterpoint.', 'The critics’ counterpoint is that savings might be offset.'],
  ['Rhetorical synthesis', 2, 'A student takes these notes:\n• Hummingbirds can hover in place.\n• They can also fly backward.\n• Few other birds can do either.\n\nThe student wants to emphasize what makes hummingbirds unusual. Which choice best does this?', 'Unlike most birds, hummingbirds can both hover in place and fly backward.', ['Hummingbirds are small birds.', 'Birds fly in many different ways.', 'Hummingbirds can hover.'], 'Choose the sentence that makes the contrast explicit.', 'It highlights the unusual abilities relative to other birds.'],
  ['Concision', 2, 'Which choice most effectively states the idea without redundancy?', 'The committee agreed to postpone the vote.', ['The committee unanimously agreed together to postpone the vote until a later date.', 'The committee came to an agreement to postpone the vote until a later time.', 'The committee, in agreement, decided to postpone and delay the vote.'], 'Remove words that repeat the same idea.', 'The first choice is clear and concise.'],
  ['Tone', 2, '“Our neighborhood has changed,” the author writes. “The corner store with its creaking screen door is gone, and so are the evenings when neighbors lingered on porches. I miss them more than I expected.”\n\nWhich choice best describes the tone of the text?', 'Nostalgic', ['Indignant', 'Amused', 'Clinical'], 'The author reflects on a lost past.', '“I miss them more than I expected” signals nostalgia.'],

  // ----- Hard -----
  ['Words in context', 3, `The architect’s design was praised for its ___: every element served a purpose, and nothing was superfluous.\n\n${Q1}`, 'economy', ['opulence', 'ornamentation', 'complexity'], '“Nothing superfluous” points to efficiency.', '“Economy” means efficient use of resources.'],
  ['Words in context', 3, `Rather than undermining the theory, the anomalous data ironically ___ it, since the model had predicted just such deviations.\n\n${Q1}`, 'corroborated', ['contradicted', 'obscured', 'trivialized'], 'The model predicted the anomalies.', 'Predicted anomalies support the theory: “corroborated.”'],
  ['Inference', 3, 'Economists have long observed that wages in a declining industry often stay flat even as profits shrink. One explanation is that workers, anticipating layoffs, accept stagnant pay to protect their jobs; another is that firms cut hours rather than pay. Neither account alone explains why wages in some sectors have risen.\n\nWhich choice best describes a conclusion supported by the text?', 'The wage patterns in declining industries are likely driven by more than one factor.', ['Wages always fall when profits fall.', 'Firms never reduce hours.', 'Layoffs have no effect on pay.'], 'The text offers two partial explanations and notes a gap.', 'Multiple factors seem to be at work.'],
  ['Cross-text connections', 3, 'Text 1: Historian Alvarez argues that the printing press alone ignited the Reformation by spreading Luther’s ideas rapidly.\n\nText 2: Historian Chen notes that Luther’s ideas spread only where local rulers already resented church authority; the press, she argues, amplified but did not originate the movement.\n\nWhich choice best describes the relationship between the texts?', 'Text 2 qualifies the claim in Text 1 by adding a necessary condition.', ['Text 2 repeats the claim in Text 1.', 'Text 2 refutes the evidence in Text 1 with statistics.', 'Text 2 shifts the topic to a different century.'], 'Does Text 2 reject the press’s role or limit it?', 'Text 2 does not deny the press’s role but says it needed receptive rulers.'],
  ['Text structure & purpose', 3, 'The so-called “paradox of choice” holds that more options make consumers less satisfied. Yet several large replications have found the effect to be small and inconsistent, suggesting that the original finding may owe more to specific experimental conditions than to a general law of behavior.\n\nWhich choice best describes the function of the phrase “so-called”?', 'It signals the author’s skepticism about the claim.', ['It shows that the term is widely accepted.', 'It introduces a technical definition.', 'It emphasizes the claim’s importance.'], 'Think about what “so-called” usually implies.', '“So-called” distances the author from the term.'],
  ['Quantitative evidence', 3, 'A graph shows that between 2010 and 2020, the share of households with broadband rose from 62% to 88% in urban areas but from 41% to 61% in rural areas. A student claims that although both areas improved, the gap between them widened.\n\nWhich choice most effectively uses data to support the claim?', 'The urban–rural gap grew from 21 percentage points in 2010 to 27 in 2020.', ['Broadband access rose in both areas.', 'Urban areas had higher access than rural areas in 2020.', 'Rural access reached 61% in 2020.'], 'Compute the gap in each year.', '62 − 41 = 21 in 2010 and 88 − 61 = 27 in 2020.'],
  ['Punctuation', 3, `Marie Tharp ___ helped reveal the rift valley running along the floor of the Atlantic Ocean.\n\n${Q2}`, ', a geologist and cartographer,', ['; a geologist and cartographer,', ': a geologist and cartographer', ' a geologist and cartographer,'], 'A nonessential appositive is set off on both sides.', 'The appositive “a geologist and cartographer” is nonessential, so it takes a comma before and after.'],
  ['Pronouns', 3, `The scientist ___ the committee praised for her careful methodology has been invited to speak.\n\n${Q2}`, 'whom', ['who', 'whose', 'which'], 'The committee praised “her/him.”', '“Whom” is the object of “praised.”'],
  ['Punctuation', 3, `The study—which surveyed 3,000 adults over a decade ___ found that regular walking was associated with longer life.\n\n${Q2}`, '—', [',', ';', ':'], 'The phrase opened with a dash must close with a matching mark.', 'A dash opens the interruption, so a dash must close it.'],
  ['Verb tense', 3, `By the time the data were verified, the journal ___ the article.\n\n${Q2}`, 'had already published', ['has already published', 'already published', 'is already publishing'], 'One past event precedes another.', 'Past perfect shows the earlier of two past events.'],
  ['Evidence', 3, 'A biologist hypothesizes that bumblebees prefer blue flowers because blue petals reflect more ultraviolet light, which bees see well.\n\nWhich finding, if true, would most directly support the hypothesis?', 'Bees visited blue petals less often after the petals were treated to reflect less ultraviolet light.', ['Bumblebees visit blue and yellow flowers at similar rates.', 'Blue flowers bloom later in the season.', 'Ultraviolet light is invisible to humans.'], 'Look for evidence that links the preference to ultraviolet reflection.', 'If dimming ultraviolet reflection reduces visits, ultraviolet reflection plausibly drives the preference.'],
  ['Poetry', 3, '“I celebrate myself, and sing myself, / And what I assume you shall assume, / For every atom belonging to me as good belongs to you.”\n\nWhich choice best describes the speaker’s stance in these lines?', 'The speaker asserts a bold individuality while insisting on a shared human bond.', ['The speaker mocks the reader’s ambitions.', 'The speaker laments being isolated from others.', 'The speaker describes a scientific experiment.'], 'Notice both “myself” and “belongs to you.”', 'Whitman pairs self-celebration with universal kinship.'],
  ['Transitions', 3, 'The city’s population has fallen by nearly a third since 1960. ___ it has lost more than 100,000 residents.\n\nWhich choice completes the text with the most logical transition?', 'In other words,', ['Nevertheless,', 'For example,', 'Previously,'], 'The second sentence restates the first in concrete terms.', '“In other words” introduces a restatement.'],
  ['Argument analysis', 3, 'A school claims that its new tutoring program raised math scores because scores increased after the program began. Which finding would most weaken the claim?', 'Math scores also rose at schools that did not offer the program.', ['Students enjoyed the program.', 'The program cost less than expected.', 'More students signed up each month.'], 'Look for an alternative explanation.', 'If scores rose elsewhere, the program may not be the cause.'],
]

export const satRwBank: BankItem[] = rows(NEW)

/** Existing English bank items that match SAT Reading & Writing skills. */
const REUSED_TOPICS = new Set(Object.keys(SAT_RW_DOMAIN))
const reused: BankItem[] = englishBank.filter(b => REUSED_TOPICS.has(b.t) && !(b.l === 1 && b.t === 'Punctuation' && b.q.includes('capital')))
export const SAT_RW_BANK: BankItem[] = [...satRwBank, ...reused]

// ---------- Transitions generator ----------
type Fam = 'contrast' | 'cause' | 'example' | 'add' | 'time' | 'restate' | 'emphasis'
const WORDS: Record<Fam, string[]> = {
  contrast: ['However', 'Nevertheless', 'In contrast', 'On the other hand', 'Instead'],
  cause: ['Therefore', 'As a result', 'Consequently', 'Thus', 'Accordingly'],
  example: ['For example', 'For instance', 'Specifically'],
  add: ['In addition', 'Moreover', 'Furthermore', 'Likewise', 'Similarly'],
  time: ['Afterward', 'Next', 'Subsequently', 'Meanwhile'],
  restate: ['In other words', 'That is'],
  emphasis: ['Indeed', 'In fact'],
}
const FAM_NOTE: Record<Fam, string> = {
  contrast: 'The second sentence contrasts with the first.', cause: 'The second sentence is a result of the first.', example: 'The second sentence gives an example.',
  add: 'The second sentence adds a similar point.', time: 'The sentences describe events in sequence.', restate: 'The second sentence restates the first.', emphasis: 'The second sentence intensifies the first.',
}
const TRANS: [string, string, string, Fam, Level][] = [
  ['The restaurant has excellent reviews.', 'it is always crowded on weekends.', 'As a result', 'cause', 1],
  ['The hike is only two miles long.', 'it includes a steep climb at the end.', 'However', 'contrast', 1],
  ['Many fruits are high in fiber.', 'apples and pears contain several grams per serving.', 'For example', 'example', 1],
  ['The library offers free tutoring.', 'it hosts weekly reading groups for children.', 'In addition', 'add', 1],
  ['Mix the flour and sugar in a large bowl.', 'add the eggs one at a time.', 'Next', 'time', 1],
  ['Some cities have invested heavily in public transit.', 'others have focused mainly on building new highways.', 'In contrast', 'contrast', 2],
  ['The company cut its prices by twenty percent.', 'sales doubled within a month.', 'Consequently', 'cause', 2],
  ['Several factors affect how quickly plants grow.', 'soil acidity plays a major role.', 'Specifically', 'example', 2],
  ['Solar installations rose sharply in the 2010s.', 'wind capacity grew at a comparable pace.', 'Similarly', 'add', 2],
  ['The treasurer prepared the annual budget.', 'the board reviewed the figures line by line.', 'Afterward', 'time', 2],
  ['Hummingbirds can hover in place.', 'they can fly backward, a feat few birds can manage.', 'Moreover', 'add', 2],
  ['The council did not raise taxes.', 'it reduced spending on road repairs.', 'Instead', 'contrast', 2],
  ['The city’s population has fallen by nearly a third since 1960.', 'it has lost more than 100,000 residents.', 'In other words', 'restate', 3],
  ['Critics dismissed the film as sentimental.', 'audiences embraced it, and it became a box-office hit.', 'Nevertheless', 'contrast', 3],
  ['The drought was severe.', 'it was the worst on record for the region.', 'Indeed', 'emphasis', 3],
  ['The committee’s findings rested on a very small sample.', 'its recommendations should be treated as preliminary.', 'Accordingly', 'cause', 3],
  ['The new software promised to speed up billing.', 'it introduced errors that took months to resolve.', 'Instead', 'contrast', 3],
  ['Researchers measured the lake’s temperature every hour.', 'a second team sampled its chemistry once a week.', 'Meanwhile', 'time', 3],
]
const FAMS = Object.keys(WORDS) as Fam[]
export const satTransitions: Gen[] = ([1, 2, 3] as Level[]).map(level => ({
  level,
  topic: 'Transitions',
  make: rng => {
    const pool = TRANS.filter(t => t[4] === level)
    const [s1, s2, word, fam] = pool[Math.floor(rng() * pool.length)]
    const others = shuffle(rng, FAMS.filter(f => f !== fam && !(fam === 'time' && f === 'add'))).slice(0, 3)
    return {
      topic: 'Transitions',
      prompt: `${s1} ___ ${s2}\n\nWhich choice completes the text with the most logical transition?`,
      correct: `${word},`,
      wrong: others.map(f => `${WORDS[f][Math.floor(rng() * WORDS[f].length)]},`),
      hint: 'Decide how the second sentence relates to the first: contrast, result, example, addition, or sequence.',
      explanation: `${FAM_NOTE[fam]} “${word}” fits.`,
    }
  },
}))
