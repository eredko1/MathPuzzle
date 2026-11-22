import { rows, type Row } from './rows'

const ENGLISH: Row[] = [
  ['Subject–verb agreement', 1, 'The dogs in the yard ___ barking loudly.', 'are', ['is', 'was', 'be'], 'Find the real subject: “dogs.”', 'A plural subject takes “are.”'],
  ['Verb tense', 1, 'Tomorrow, we ___ to the beach.', 'will go', ['went', 'have gone', 'was going'], '“Tomorrow” points to the future.', 'Future time uses “will go.”'],
  ['Punctuation', 1, 'Which sentence uses a comma correctly?', 'After dinner, we watched a movie.', ['After dinner we, watched a movie.', 'After, dinner we watched a movie.', 'After dinner we watched, a movie.'], 'Put a comma after an introductory phrase.', 'The comma belongs right after “After dinner.”'],
  ['Pronouns', 1, 'Give the book to Sam and ___.', 'me', ['I', 'myself', 'mine'], 'Remove “Sam and”: you would say “give it to ___.”', 'After a preposition or as an object, use “me.”'],
  ['Vocabulary in context', 1, 'The puppy was so energetic that it could not sit still. “Energetic” most nearly means', 'full of energy', ['sleepy', 'angry', 'hungry'], 'The sentence says it could not sit still.', '“Energetic” means active and lively.'],
  ['Synonyms & antonyms', 1, 'Which word is closest in meaning to “rapid”?', 'fast', ['slow', 'loud', 'small'], 'Think of a rapid river.', '“Rapid” and “fast” both describe high speed.'],
  ['Idioms & prepositions', 1, 'She is very good ___ math.', 'at', ['on', 'to', 'by'], 'Which preposition follows “good” for a skill?', '“Good at” is the standard phrase.'],
  ['Inference', 1, 'Lena put on her coat, hat, and gloves before opening the door. What can you infer?', 'It was cold outside.', ['It was a hot day.', 'She was going to bed.', 'She was cooking dinner.'], 'Why bundle up?', 'Heavy clothing suggests cold weather.'],
  ['Central ideas', 1, 'Recycling paper saves trees, reduces landfill waste, and uses less energy than making new paper.\n\nWhat is the main idea?', 'Recycling paper has several environmental benefits.', ['Paper is made from trees.', 'Landfills are almost full.', 'Energy is expensive.'], 'Which statement covers all three details?', 'The details are all benefits of recycling paper.'],
  ['Subject–verb agreement', 2, 'The quality of the photographs ___ impressive.', 'is', ['are', 'were', 'have been'], 'The subject is “quality,” not “photographs.”', 'Singular subject, singular verb.'],
  ['Pronouns', 2, 'Between you and ___, the plan is risky.', 'me', ['I', 'myself', 'mine'], '“Between” is a preposition.', 'A preposition takes the object form: me.'],
  ['Modifiers', 2, 'Which sentence is clearest?', 'Walking along the beach, Maya found a seashell.', ['Walking along the beach, a seashell was found by Maya.', 'Walking along the beach, the seashell was Maya’s find.', 'Maya’s seashell was found walking along the beach.'], 'Who is doing the walking?', 'The subject right after the phrase must be the walker.'],
  ['Semicolons', 2, 'Which sentence is punctuated correctly?', 'The movie was long; however, it was engaging.', ['The movie was long, however, it was engaging.', 'The movie was long; however it, was engaging.', 'The movie was long however; it was engaging.'], 'A conjunctive adverb joining two sentences needs a semicolon before it and a comma after.', 'Semicolon before “however,” comma after.'],
  ['Transitions', 2, 'The evidence is strong. ___, some experts remain unconvinced.\n\nWhich choice completes the text with the most logical transition?', 'Nevertheless,', ['For example,', 'Therefore,', 'Similarly,'], 'The second sentence pushes against the first.', '“Nevertheless” signals contrast.'],
  ['Words in context', 2, 'The scientist’s ___ approach, checking every figure twice, prevented errors.\n\nWhich choice completes the text with the most logical and precise word?', 'meticulous', ['careless', 'hasty', 'casual'], '“Checking every figure twice.”', '“Meticulous” means extremely careful.'],
  ['Words in context', 2, 'Public pressure ___ the council’s decision, and it reversed course.\n\nWhich choice completes the text with the most logical and precise word?', 'swayed', ['ignored', 'announced', 'preceded'], 'The council changed its mind.', 'To “sway” is to influence.'],
  ['Inference', 2, 'Since the nearby office building closed, the restaurant’s lunch crowd has nearly vanished.\n\nWhich is most likely true?', 'Many of the restaurant’s lunch customers worked in that building.', ['The restaurant’s food got worse.', 'The restaurant raised its prices.', 'People no longer eat lunch.'], 'What changed, and what followed?', 'The timing suggests the office workers were the customers.'],
  ['Verb tense', 2, 'By next June, she ___ here for ten years.', 'will have worked', ['works', 'worked', 'is working'], 'A future deadline plus a completed span of time.', 'Future perfect fits “by next June.”'],
  ['Parallel structure', 2, 'The coach praised the team for its patience, its discipline, and ___.', 'its creativity', ['being creative', 'how creative it was', 'to be creative'], 'Keep the same pattern: “its + noun.”', 'All three items are nouns introduced by “its.”'],
  ['Concision', 2, 'Which choice is the most concise?', 'We should leave early.', ['It is my opinion that we ought to consider leaving at an early time.', 'We should, in my view, think about leaving early in the day.', 'Leaving early is something we should do in the near future.'], 'Cut empty phrases.', 'The first choice says it directly.'],
  ['Argument analysis', 3, 'A city claims its plastic-bag ban cut litter because litter fell the year after. Which finding would most strengthen the claim?', 'Litter fell more in neighborhoods that enforced the ban than in those that did not.', ['Litter fell in the following year, too.', 'Many residents liked the ban.', 'Plastic is cheap to make.'], 'Look for a comparison that isolates the ban.', 'A with/without comparison supports cause and effect.'],
  ['Words in context', 3, 'Her ___ prose, free of embellishment, made the report’s findings feel undeniable.\n\nWhich choice completes the text with the most logical and precise word?', 'spare', ['ornate', 'florid', 'rambling'], '“Free of embellishment.”', '“Spare” means plain and economical.'],
  ['Rhetoric', 3, 'A writer ends a paragraph with “That is the real cost of cheap goods.” The sentence mainly serves to', 'sum up the paragraph’s argument', ['introduce a new topic', 'give a statistic', 'tell a personal story'], 'Concluding lines usually do what?', 'It wraps up the preceding point.'],
  ['Semicolons', 3, 'The first test was inconclusive ___ the second confirmed the hypothesis.\n\nWhich choice completes the text so that it conforms to the conventions of Standard English?', ';', [',', ':', ', and,'], 'Two independent clauses with no conjunction.', 'A semicolon joins them; a lone comma would be a splice.'],
  ['Mood & verbs', 3, 'It is essential that every student ___ the form by Friday.', 'submit', ['submits', 'submitted', 'will submit'], 'After “essential that,” use the base form.', 'The mandative subjunctive takes the base verb.'],
  ['Evidence', 3, 'A researcher hypothesizes that sleeping after studying improves memory. Which finding would most directly support it?', 'Participants who slept after studying recalled more than those kept awake.', ['Students who study more get better grades.', 'Most adults sleep seven hours.', 'Memory declines with age.'], 'The evidence must vary sleep after studying.', 'A sleep vs. awake comparison tests the hypothesis.'],
]

const BIO: Row[] = [
  ['Cell organelles', 1, 'Which organelle modifies, packages, and ships proteins?', 'Golgi apparatus', ['Ribosome', 'Lysosome', 'Nucleolus'], 'Think of the cell’s post office.', 'The Golgi processes and sorts proteins.'],
  ['DNA & genes', 1, 'DNA is shaped like a', 'double helix', ['single strand', 'sphere', 'flat ring'], 'Watson and Crick.', 'Two strands twist around each other.'],
  ['Human body', 1, 'Which organ filters waste from the blood to make urine?', 'Kidney', ['Liver', 'Pancreas', 'Spleen'], 'Think of the nephron.', 'The kidneys filter blood.'],
  ['Ecology', 1, 'An organism that eats both plants and animals is a(n)', 'omnivore', ['herbivore', 'carnivore', 'producer'], '“Omni” means all.', 'Omnivores eat both.'],
  ['Plants', 1, 'Which gas do plants take in for photosynthesis?', 'Carbon dioxide', ['Oxygen', 'Nitrogen', 'Helium'], 'It becomes sugar.', 'CO₂ is the carbon source.'],
  ['Genetics', 2, 'An organism with two different alleles for a gene is', 'heterozygous', ['homozygous', 'recessive', 'haploid'], '“Hetero” means different.', 'Different alleles = heterozygous.'],
  ['Gene expression', 2, 'During translation, tRNA anticodons pair with', 'mRNA codons', ['DNA template bases', 'rRNA genes', 'free amino acids'], 'tRNA reads the message.', 'Anticodon–codon pairing places amino acids in order.'],
  ['Evolution', 2, 'Antibiotic resistance spreading in bacteria is best explained by', 'natural selection acting on existing variation', ['bacteria choosing to adapt', 'antibiotics causing only helpful mutations', 'use and disuse of traits'], 'Who survives the antibiotic?', 'Resistant bacteria survive and reproduce.'],
  ['Physiology', 2, 'Which hormone raises blood glucose?', 'Glucagon', ['Insulin', 'Oxytocin', 'Thyroxine'], 'Insulin does the opposite.', 'Glucagon triggers glucose release by the liver.'],
  ['Cell cycle', 2, 'During which phase of mitosis do sister chromatids separate?', 'Anaphase', ['Prophase', 'Metaphase', 'Telophase'], 'They are pulled to opposite poles.', 'Separation happens in anaphase.'],
  ['Gene regulation', 3, 'Enhancers increase transcription by', 'binding activator proteins that help recruit RNA polymerase', ['cutting introns out of mRNA', 'adding poly-A tails', 'methylating ribosomal RNA'], 'They are DNA regulatory elements.', 'Activators at enhancers promote assembly at the promoter.'],
  ['Immunity', 3, 'MHC class I molecules present peptides mainly to', 'CD8⁺ (cytotoxic) T cells', ['B cells', 'CD4⁺ helper T cells', 'red blood cells'], 'Class I → killer T cells.', 'CD8 binds MHC I.'],
  ['Biotechnology', 2, 'Which technique amplifies a specific DNA sequence?', 'PCR', ['Western blot', 'ELISA', 'Gel electrophoresis'], 'Copies double each cycle.', 'PCR makes many copies of a target.'],
]

const CHEM: Row[] = [
  ['Periodic table', 1, 'Which group contains the noble gases?', 'Group 18', ['Group 1', 'Group 17', 'Group 2'], 'The far-right column.', 'Group 18 holds helium through radon.'],
  ['States of matter', 1, 'The change from gas to liquid is called', 'condensation', ['sublimation', 'evaporation', 'deposition'], 'Think of water droplets on a cold glass.', 'Gas → liquid is condensation.'],
  ['Atomic structure', 1, 'Isotopes of an element differ in their number of', 'neutrons', ['protons', 'electrons', 'valence shells'], 'The atomic number stays fixed.', 'Same protons, different neutrons.'],
  ['Acids & bases', 2, 'A Brønsted–Lowry acid is a', 'proton donor', ['proton acceptor', 'electron-pair donor', 'electron acceptor'], 'Acids give away H⁺.', 'Brønsted–Lowry acids donate protons.'],
  ['Thermochemistry', 2, 'Which has the greatest entropy at the same temperature?', 'One mole of water vapor', ['One mole of liquid water', 'One mole of ice', 'They are identical'], 'More freedom of motion = more entropy.', 'Gases are the most disordered.'],
  ['Bonding', 2, 'The molecular geometry of CO₂ is', 'linear', ['bent', 'trigonal planar', 'tetrahedral'], 'Two electron regions, no lone pairs on carbon.', 'CO₂ is O=C=O, linear.'],
  ['Equilibrium', 2, 'If the reaction quotient Q is less than K, the reaction will proceed', 'toward products', ['toward reactants', 'not at all', 'until K increases'], 'Not enough products yet.', 'Q < K means the system shifts right.'],
  ['Quantum chemistry', 3, 'How many orbitals are in a d subshell?', '5', ['3', '7', '1'], 's=1, p=3, d=?', 'A d subshell has five orbitals (holding 10 electrons).'],
  ['Organic chemistry', 3, 'Which reagent oxidizes a primary alcohol all the way to a carboxylic acid?', 'Acidic potassium dichromate (K₂Cr₂O₇)', ['Sodium borohydride (NaBH₄)', 'Lithium aluminum hydride (LiAlH₄)', 'H₂ over palladium'], 'Three of these are reducing agents.', 'Strong oxidants like dichromate go to the acid.'],
  ['Spectroscopy', 3, 'In ¹H NMR, a signal split into a triplet indicates', 'two neighboring (non-equivalent) hydrogens', ['one neighboring hydrogen', 'three neighboring hydrogens', 'no neighboring hydrogens'], 'The n + 1 rule.', 'Triplet = n + 1 with n = 2.'],
  ['Electrochemistry', 3, 'In the electrolysis of molten NaCl, chlorine gas forms at the', 'anode', ['cathode', 'salt bridge', 'electrolyte'], 'Cl⁻ is oxidized.', 'Oxidation always occurs at the anode.'],
  ['Thermodynamics', 3, 'At constant temperature and pressure, a process is spontaneous when', 'ΔG < 0', ['ΔG > 0', 'ΔH > 0 only', 'ΔS < 0 only'], 'Gibbs free energy decides.', 'Negative ΔG means spontaneous.'],
]

const PHYSICS: Row[] = [
  ['Mechanics concepts', 1, 'Which law explains why you lurch forward when a car brakes suddenly?', 'Newton’s first law (inertia)', ['Newton’s second law', 'Newton’s third law', 'The law of gravitation'], 'Objects keep moving unless acted on.', 'Your body tends to keep its velocity.'],
  ['Waves concepts', 1, 'Which color of visible light has the highest frequency?', 'Violet', ['Red', 'Green', 'Yellow'], 'ROYGBIV runs low to high.', 'Violet has the shortest wavelength and highest frequency.'],
  ['Electricity concepts', 1, 'The SI unit of electric current is the', 'ampere', ['volt', 'ohm', 'watt'], 'Charge per second.', '1 A = 1 C/s.'],
  ['Mechanics concepts', 2, 'Which quantity is conserved in a perfectly inelastic collision?', 'Momentum', ['Kinetic energy', 'Both momentum and kinetic energy', 'Neither'], 'The objects stick together.', 'Momentum is conserved; kinetic energy is lost.'],
  ['Thermodynamics', 2, 'The first law of thermodynamics expresses', 'conservation of energy', ['the increase of entropy', 'the existence of absolute zero', 'the ideal gas law'], 'ΔU = Q − W.', 'Energy is neither created nor destroyed.'],
  ['Waves concepts', 2, 'The pitch of a siren sounds higher when the siren', 'moves toward you', ['moves away from you', 'stops moving', 'becomes quieter'], 'The Doppler effect.', 'Approaching sources compress the waves.'],
  ['Electromagnetism', 2, 'The magnetic force on a moving positive charge is directed', 'perpendicular to both its velocity and the field', ['parallel to its velocity', 'parallel to the field', 'opposite to its velocity'], 'F = qv × B.', 'The cross product is perpendicular to both vectors.'],
  ['Modern physics', 3, 'Which particle mediates the electromagnetic force?', 'The photon', ['The gluon', 'The W boson', 'The graviton'], 'Light is its everyday form.', 'Photons carry the electromagnetic interaction.'],
  ['Statics', 3, 'A zero-force member in a truss is one that', 'carries no load under the given loading', ['must always be removed', 'carries the maximum tension', 'is always in compression'], 'Joint equilibrium reveals them.', 'It can still stabilize the structure under other loads.'],
  ['Controls', 3, 'Adding integral action to a controller mainly helps eliminate', 'steady-state error', ['all overshoot', 'sensor noise', 'time delay'], 'It accumulates error over time.', 'Integral action drives the steady-state error to zero.'],
  ['Circuits', 3, 'The Thévenin equivalent of a linear circuit is', 'a voltage source in series with a resistance', ['a current source in parallel with a capacitor', 'two resistors in parallel', 'an ideal op-amp'], 'Two elements as seen from a port.', 'V_th in series with R_th.'],
  ['Materials', 3, 'Ductile materials typically fail', 'after significant plastic deformation', ['suddenly with no deformation', 'only in compression', 'only at high temperature'], 'Think of bending a paperclip.', 'Ductile materials stretch before fracture.'],
]

const CS: Row[] = [
  ['Programming concepts', 1, 'Which structure repeats code while a condition is true?', 'A while loop', ['An if statement', 'A function declaration', 'A comment'], 'Loop keywords.', 'A while loop repeats as long as its condition holds.'],
  ['Bits & data', 1, 'How many bits are in a byte?', '8', ['4', '16', '2'], 'A fundamental unit.', 'One byte is eight bits.'],
  ['Internet & data', 1, 'Which protocol is used to load web pages securely?', 'HTTPS', ['FTP', 'SMTP', 'DNS'], 'The padlock in the address bar.', 'HTTPS is HTTP over TLS.'],
  ['Strings in C', 2, 'In C, which function safely reads a line of text into a fixed-size buffer?', 'fgets', ['gets', 'puts', 'printf'], 'It takes a size argument.', '`fgets(buf, size, stdin)` limits the read; `gets` is unsafe and removed.'],
  ['Strings in C', 2, 'A C string is terminated by', 'the null character (\\0)', ['a newline', 'a space', 'a semicolon'], 'There is no length field.', 'Library functions scan until they hit `\\0`.'],
  ['Sorting', 2, 'Bubble sort works by repeatedly', 'swapping adjacent elements that are out of order', ['splitting the array in half', 'choosing a pivot', 'building a heap'], 'Large values “bubble” to the end.', 'Each pass pushes the largest remaining item into place.'],
  ['Data structures', 2, 'Which operation takes O(1) time on an array?', 'Reading an element by index', ['Searching an unsorted array', 'Inserting at the front', 'Sorting the array'], 'Direct address arithmetic.', 'Index access is a single computed offset.'],
  ['Algorithms', 2, 'What is the worst-case time complexity of quicksort?', 'O(n²)', ['O(n log n)', 'O(n)', 'O(log n)'], 'Bad pivots every time.', 'A consistently bad pivot gives quadratic time.'],
  ['Pointers in C', 3, 'In C, if `int *p = &a;`, then `*p` is', 'the value stored in a', ['the address of a', 'the address of p', 'a copy of the pointer'], 'The asterisk dereferences.', '`*p` reads or writes the pointed-to int.'],
  ['Memory', 3, 'A memory leak occurs when', 'allocated memory is never freed', ['memory is freed twice', 'the stack overflows', 'an index is out of bounds'], 'malloc without free.', 'Unreleased memory accumulates for the life of the program.'],
  ['Algorithms', 3, 'Which sorting algorithm is stable and O(n log n) even in the worst case?', 'Merge sort', ['Quicksort', 'Heapsort', 'Selection sort'], 'Stable = equal items keep their order.', 'Merge sort is stable and always O(n log n).'],
  ['Concurrency', 3, 'A deadlock requires', 'a circular wait among threads holding resources', ['only one thread', 'no locks at all', 'unlimited memory'], 'Each waits on the next.', 'Circular wait is one of the four Coffman conditions.'],
]

const MATH: Row[] = [
  ['Geometry', 1, 'The sum of the interior angles of a triangle is', '180°', ['90°', '360°', '270°'], 'A basic fact.', 'Any triangle’s angles add to 180°.'],
  ['Algebra', 1, 'What is 3 × (4 + 2)?', '18', ['14', '12', '10'], 'Parentheses first.', '3 × 6 = 18.'],
  ['Algebra', 2, 'The solutions of x² = 9 are', 'x = 3 and x = −3', ['x = 3 only', 'x = 9 and x = −9', 'x = ±√3'], 'Both roots count.', 'Taking square roots gives ±3.'],
  ['Calculus concepts', 2, 'If f′(x) > 0 on an interval, then f is', 'increasing there', ['decreasing there', 'constant there', 'concave up there'], 'Slope sign.', 'A positive derivative means the function rises.'],
  ['Statistics', 2, 'Which measure of center is least affected by outliers?', 'The median', ['The mean', 'The range', 'The standard deviation'], 'It depends only on the middle value.', 'Extreme values barely move the median.'],
  ['Linear algebra', 3, 'The rank of the 3×3 identity matrix is', '3', ['1', '0', '9'], 'Count independent columns.', 'All three columns are independent.'],
  ['Differential equations', 3, 'The solution of y′ = y with y(0) = 1 is', 'y = eˣ', ['y = x', 'y = e⁻ˣ', 'y = 1 + x'], 'The function equals its own derivative.', 'eˣ is its own derivative and equals 1 at 0.'],
  ['Calculus concepts', 3, 'The Maclaurin series of eˣ is', 'Σ xⁿ/n!', ['Σ xⁿ', 'Σ (−1)ⁿ xⁿ', 'Σ xⁿ/n'], 'Factorials in the denominator.', 'eˣ = 1 + x + x²/2! + x³/3! + …'],
]

export const moreEnglish = rows(ENGLISH)
export const moreBio = rows(BIO)
export const moreChem = rows(CHEM)
export const morePhysics = rows(PHYSICS)
export const moreCs = rows(CS)
export const moreMath = rows(MATH)
