import type { ListeningPart, MockTest, Passage, Question, QuestionType } from '@/types';

// Original practice content written for the KLS prototype (not taken from any published test).
// The demo form is a short version: 20 Listening and 20 Reading questions, scaled to 40 for the band.

const q = (prefix: string, n: number, type: QuestionType, prompt: string, answer: string | string[], options?: string[]): Question => ({
  id: `${prefix}${n}`, n, type, prompt, answer: Array.isArray(answer) ? answer : [answer], options,
});

const TFNG = ['TRUE', 'FALSE', 'NOT GIVEN'];
const YNNG = ['YES', 'NO', 'NOT GIVEN'];

const LISTENING: ListeningPart[] = [
  {
    id: 'lp1',
    title: 'Part 1',
    context: 'A man phones a community centre to join a course.',
    script:
      "Good morning, Riverside Community Centre. How can I help? Hi, I'd like to sign up for the photography course. Of course. Can I take your name? It's Daniel Hartley. That's H, A, R, T, L, E, Y. Thank you. And a contact number? Yes, it's 0 7 7 0 0, 9 1 4, 3 6 2. Great. Now, the beginners' course runs on Tuesday evenings, and the intermediate one is on Thursdays. I'll take the beginners' course, so Tuesday. Lovely. It starts at seven and finishes at nine. The fee is forty-five pounds for six weeks. Does that include the materials? It doesn't, I'm afraid. You'll need to bring your own camera, but we lend tripods free of charge.",
    groups: [
      {
        instructions: 'Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.',
        questions: [
          q('L', 1, 'gap', 'Surname: ________', ['Hartley']),
          q('L', 2, 'gap', 'Phone number: ________', ['07700914362', '07700 914 362', '07700 914362']),
          q('L', 3, 'gap', 'Day of course: ________', ['Tuesday', 'Tuesdays']),
          q('L', 4, 'gap', 'Fee for six weeks: £________', ['45', 'forty-five']),
          q('L', 5, 'gap', 'Equipment the centre lends free: ________', ['tripods', 'tripod']),
        ],
      },
    ],
  },
  {
    id: 'lp2',
    title: 'Part 2',
    context: 'A guide welcomes visitors to a museum.',
    script:
      "Welcome to Kingsway Museum. Before we begin, a few practical points. The building opened as a museum in 1962, but it was originally a railway station, which is why the main hall is so long. The café is on the ground floor, right next to the main entrance, and the gift shop is on the top floor. Photography is allowed everywhere except the textile gallery, because strong light damages the fabrics. Our guided tour lasts about forty minutes, and the highlight for most visitors is the steam engine in the main hall. Finally, tickets for Friday's evening lecture can be bought at the information desk.",
    groups: [
      {
        instructions: 'Choose the correct letter, A, B or C.',
        questions: [
          q('L', 6, 'mcq', 'The museum building was originally', 'B', ['a school', 'a railway station', 'a factory']),
          q('L', 7, 'mcq', 'Where is the café?', 'B', ['on the top floor', 'next to the main entrance', 'in the main hall']),
          q('L', 8, 'mcq', 'Photography is not allowed in', 'A', ['the textile gallery', 'the main hall', 'the gift shop']),
          q('L', 9, 'mcq', 'The guided tour lasts about', 'B', ['20 minutes', '40 minutes', 'one hour']),
          q('L', 10, 'mcq', 'Lecture tickets are sold', 'B', ['online only', 'at the information desk', 'in the gift shop']),
        ],
      },
    ],
  },
  {
    id: 'lp3',
    title: 'Part 3',
    context: 'Two students, Maya and Leo, discuss their research project.',
    script:
      "I know Dr Lewis suggested water use, but I think we were right to go for recycling. There's so much local data available. Exactly, the council publishes new figures every month. So how do we collect our own information? Interviews would take too long. Agreed. An online survey is quicker, and we can reach more people. The pilot group said some questions were confusing. Yes, the wording wasn't clear, so I've rewritten them. Good. I'm better with spreadsheets, so I'll do the analysis. Fine, then I'll write up the literature review. And remember, the report is due next Monday, not Friday.",
    groups: [
      {
        instructions: 'Choose the correct letter, A, B or C.',
        questions: [
          q('L', 11, 'mcq', 'Why did the students choose recycling as their topic?', 'B', ['Their tutor suggested it.', 'Data is easy to find.', 'It is a personal interest.']),
          q('L', 12, 'mcq', 'How will they collect information?', 'A', ['an online survey', 'interviews', 'observation']),
          q('L', 13, 'mcq', 'What was wrong with the first set of questions?', 'C', ['They were too long.', 'They were too personal.', 'The wording was unclear.']),
          q('L', 14, 'mcq', 'Who will analyse the data?', 'B', ['Maya', 'Leo', 'both students']),
          q('L', 15, 'mcq', 'When is the report due?', 'B', ['at the end of this week', 'next Monday', 'at the end of the month']),
        ],
      },
    ],
  },
  {
    id: 'lp4',
    title: 'Part 4',
    context: 'A lecture about bees in cities.',
    script:
      "Today I want to talk about bees in cities. Surprisingly, city bees often produce more honey than country bees. One reason is variety. Parks and gardens offer a much wider variety of flowers than farmland, where a single crop may cover huge areas. Another factor is temperature. Cities are usually a few degrees warmer, so bees stay active longer each year. However, there are challenges. The biggest is competition: if too many hives are placed in one area, there isn't enough food for wild bees. Beekeepers also think about neighbours, so hives are often placed on roofs, where the bees fly above people's heads. Finally, several cities now ask beekeepers to register their hives, so that disease can be tracked.",
    groups: [
      {
        instructions: 'Complete the notes below. Write ONE WORD ONLY for each answer.',
        questions: [
          q('L', 16, 'gap', 'City parks and gardens offer a greater ________ of flowers.', ['variety', 'diversity']),
          q('L', 17, 'gap', 'Because cities are warmer, bees stay active ________ each year.', ['longer']),
          q('L', 18, 'gap', 'Main problem: ________ with wild bees for food.', ['competition']),
          q('L', 19, 'gap', 'Hives are often placed on ________.', ['roofs', 'rooftops']),
          q('L', 20, 'gap', 'Registering hives helps cities track ________.', ['disease', 'diseases']),
        ],
      },
    ],
  },
];

const READING_ACADEMIC: Passage[] = [
  {
    id: 'ra1',
    title: 'The Return of the Night Sky',
    text: `A  Over the past century, artificial light has transformed the night. Satellite images show that more than 80 percent of the world's population now lives under skies polluted by light, and in parts of Europe and North America almost no one can see the Milky Way from home.

B  The effects go beyond astronomy. Many birds migrate at night and use the stars to navigate; bright cities can draw them off course, and millions die each year after colliding with illuminated buildings. Sea turtles face a similar problem: hatchlings head for the brightest horizon, which should be the sea but is increasingly a coastal road.

C  Light at night also affects humans. Exposure to blue-rich light in the evening suppresses melatonin, a hormone that regulates sleep. Researchers have linked poor sleep to a range of health problems, although the exact role of outdoor lighting is still debated.

D  Unlike many environmental problems, light pollution can be reversed almost overnight. When the town of Fulda in Germany redesigned its street lighting, using shielded lamps that point downwards, the visible sky brightness fell by nearly a third within months. The new lamps also used less electricity, which reduced the town's energy bill.

E  Campaigners argue that the solution is not darkness but better light: lamps that illuminate only what is needed, at the right time and in warmer colours.`,
    groups: [
      {
        instructions: 'Do the following statements agree with the information given in the passage? Choose TRUE, FALSE or NOT GIVEN.',
        questions: [
          q('RA', 1, 'tfng', 'Most people in the world live under light-polluted skies.', 'TRUE', TFNG),
          q('RA', 2, 'tfng', 'Birds that migrate at night are attracted to cities by noise.', 'FALSE', TFNG),
          q('RA', 3, 'tfng', 'Scientists agree on exactly how outdoor lighting affects human health.', 'FALSE', TFNG),
          q('RA', 4, 'tfng', "Fulda's new lighting cost more to install than the old system.", 'NOT GIVEN', TFNG),
        ],
      },
      {
        instructions: 'Complete the sentences. Choose ONE WORD ONLY from the passage for each answer.',
        questions: [
          q('RA', 5, 'gap', 'Sea turtle hatchlings move towards the brightest ________.', ['horizon']),
          q('RA', 6, 'gap', 'Evening light reduces the hormone ________.', ['melatonin']),
          q('RA', 7, 'gap', 'Fulda installed ________ lamps that point downwards.', ['shielded']),
        ],
      },
    ],
  },
  {
    id: 'ra2',
    title: 'Why We Remember Stories',
    text: `A  For most of human history, knowledge was passed on by word of mouth. Before writing, communities relied on storytellers to preserve laws, histories and practical advice, and the structure of a good story made it easier to remember.

B  Modern psychology supports this. In a well-known experiment, two groups were asked to memorise a list of twelve unrelated words. One group simply repeated the words; the other linked them together in a short story. When tested a week later, the story group recalled almost six times as many words.

C  One explanation is that stories create connections. Each event in a narrative is linked to the one before by cause and effect, so remembering one detail helps to retrieve the next. Stories also tend to involve emotion, and emotional experiences are stored more strongly in memory.

D  Teachers and advertisers have long understood this. A history lesson framed around one person's journey is often remembered long after a list of dates is forgotten. However, researchers warn that the same power can mislead: a vivid story can be remembered as true even when the facts behind it are weak.`,
    groups: [
      {
        instructions: 'Choose the correct heading for paragraphs B–D from the list of headings.',
        matchOptions: [
          'i  Uses of storytelling and a possible danger',
          'ii  The role of storytellers before writing',
          'iii  Why stories are easier to recall',
          'iv  The cost of producing stories',
          'v  Experimental evidence for story-based memory',
          'vi  How children learn to tell stories',
        ],
        questions: [
          q('RA', 8, 'match', 'Paragraph B', 'v'),
          q('RA', 9, 'match', 'Paragraph C', 'iii'),
          q('RA', 10, 'match', 'Paragraph D', 'i'),
        ],
      },
      {
        instructions: 'Choose the correct letter, A, B or C.',
        questions: [
          q('RA', 11, 'mcq', 'In the experiment, the story group', 'B', ['learned the words faster.', 'remembered far more words a week later.', 'repeated the words more often.']),
          q('RA', 12, 'mcq', 'According to paragraph C, emotion', 'A', ['makes memories stronger.', 'distracts from details.', 'is rare in stories.']),
          q('RA', 13, 'mcq', 'The writer suggests that a vivid story', 'B', ['is always based on facts.', 'may be believed even if poorly supported.', 'is unsuitable for teaching.']),
        ],
      },
    ],
  },
  {
    id: 'ra3',
    title: 'Should Cities Ban Cars from Their Centres?',
    text: `Across Europe, a growing number of cities have closed their historic centres to private cars. Supporters point to cleaner air and quieter streets; critics warn that shops will lose customers. Having studied several of these schemes, I believe the critics are largely mistaken, although the transition must be handled with care.

The evidence on trade is surprisingly consistent. When Pontevedra in Spain removed cars from its centre, many shopkeepers predicted ruin. Instead, the number of businesses in the area grew, as pedestrians proved to be more frequent, if smaller, spenders than drivers. Similar patterns have been reported elsewhere.

That said, a ban cannot simply be announced overnight. Residents with limited mobility, delivery companies and emergency services all need access, and schemes that ignore them quickly lose public support. The most successful cities introduced restrictions gradually, consulted widely and invested in public transport before, not after, the cars disappeared.

Cost is often raised as an objection, yet I find this argument weak. Pedestrianisation is far cheaper than building new roads, and the savings in health care from cleaner air are considerable, even if they are difficult to measure precisely.

Ultimately, the question is not whether cities should reduce car traffic in their centres, but how quickly and fairly they can do so.`,
    groups: [
      {
        instructions: 'Do the following statements agree with the views of the writer? Choose YES, NO or NOT GIVEN.',
        questions: [
          q('RA', 14, 'ynng', 'Critics of car bans are mostly wrong.', 'YES', YNNG),
          q('RA', 15, 'ynng', 'Pedestrians spend more money per visit than drivers.', 'NO', YNNG),
          q('RA', 16, 'ynng', "Pontevedra's scheme was the first of its kind in Europe.", 'NOT GIVEN', YNNG),
          q('RA', 17, 'ynng', 'Car bans should be introduced gradually.', 'YES', YNNG),
        ],
      },
      {
        instructions: 'Choose the correct letter, A, B or C.',
        questions: [
          q('RA', 18, 'mcq', 'What happened to businesses in Pontevedra?', 'B', ['Their number fell.', 'Their number rose.', 'They moved out of the centre.']),
          q('RA', 19, 'mcq', 'Successful cities invested in public transport', 'B', ['after the ban.', 'before the ban.', 'instead of a ban.']),
          q('RA', 20, 'mcq', "The writer's view of the cost argument is that it is", 'B', ['convincing.', 'weak.', 'impossible to judge.']),
        ],
      },
    ],
  },
];

const READING_GENERAL: Passage[] = [
  {
    id: 'rg1',
    title: 'Weekend Activities at Brookfield Leisure Centre',
    text: `A  Junior Swim Club. Saturdays 9–10 am, ages 6–12. Children must already be able to swim 10 metres. £4 per session.

B  Yoga for Beginners. Sundays at 8 am. Bring your own mat. Your first class is free.

C  Family Climbing. Saturdays 2–4 pm. All equipment provided. Children must be accompanied by an adult at all times.

D  Evening Pottery. Fridays at 7 pm, six-week course. Booking essential; all materials are included in the £60 fee.

E  Five-a-side Football. Sundays at 6 pm. Teams register online; we cannot accept individual sign-ups.`,
    groups: [
      {
        instructions: 'Which activity (A–E) matches each statement? You may use any letter more than once.',
        matchOptions: ['A', 'B', 'C', 'D', 'E'],
        questions: [
          q('RG', 1, 'match', 'offers a free trial', 'B'),
          q('RG', 2, 'match', 'requires a minimum level of ability', 'A'),
          q('RG', 3, 'match', 'includes the cost of materials', 'D'),
          q('RG', 4, 'match', 'can only be joined as a group', 'E'),
          q('RG', 5, 'match', 'requires an adult to attend with children', 'C'),
          q('RG', 6, 'match', 'takes place on a weekday', 'D'),
        ],
      },
    ],
  },
  {
    id: 'rg2',
    title: 'Staff Guide: Requesting Annual Leave',
    text: `All full-time employees are entitled to 25 days of paid annual leave per year, in addition to public holidays. Part-time staff receive leave in proportion to the hours they work.

Leave requests should be submitted through the staff portal at least two weeks in advance. Requests for more than ten consecutive working days must also be approved by a department head. During the busy period in December, no more than three members of any team may be on leave at the same time, and requests are dealt with in the order they are received.

Up to five unused days may be carried over into the following year, but they must be taken before the end of March. Any remaining days will be lost.

If you are ill while on annual leave, you may be able to reclaim those days, provided you supply a doctor's note on your return.`,
    groups: [
      {
        instructions: 'Do the following statements agree with the information given in the text? Choose TRUE, FALSE or NOT GIVEN.',
        questions: [
          q('RG', 7, 'tfng', 'Part-time staff receive the same number of leave days as full-time staff.', 'FALSE', TFNG),
          q('RG', 8, 'tfng', 'Requests for long periods of leave need extra approval.', 'TRUE', TFNG),
          q('RG', 9, 'tfng', 'Leave requests in December are decided by seniority.', 'FALSE', TFNG),
          q('RG', 10, 'tfng', 'Staff can be paid for leave they do not take.', 'NOT GIVEN', TFNG),
        ],
      },
      {
        instructions: 'Complete the sentences. Write ONE WORD ONLY from the text for each answer.',
        questions: [
          q('RG', 11, 'gap', 'Leave should be requested at least two ________ in advance.', ['weeks']),
          q('RG', 12, 'gap', 'Carried-over days must be used before the end of ________.', ['March']),
          q('RG', 13, 'gap', "To reclaim days lost to illness, staff need a doctor's ________.", ['note']),
        ],
      },
    ],
  },
  {
    id: 'rg3',
    title: 'A Short History of the Bicycle',
    text: `The first machine resembling a bicycle appeared in Germany in 1817. Invented by Karl Drais, the "running machine" had two wheels but no pedals; riders pushed themselves along with their feet. It was briefly fashionable but was soon banned from pavements in several cities after accidents with pedestrians.

Pedals arrived in the 1860s, attached directly to the front wheel. Because each turn of the pedals moved the bicycle only as far as the wheel's circumference, manufacturers made front wheels larger and larger. The resulting "high-wheeler" was fast but dangerous: a sudden stop could throw the rider over the handlebars.

The breakthrough came in 1885 with the "safety bicycle", which had two wheels of equal size and a chain driving the rear wheel. Three years later, the air-filled tyre made riding far more comfortable, and cycling quickly became a popular activity.

The bicycle also had social effects. It gave ordinary workers cheap personal transport, and it allowed many women to travel independently for the first time, influencing even the clothes they wore.`,
    groups: [
      {
        instructions: 'Choose the correct letter, A, B or C.',
        questions: [
          q('RG', 14, 'mcq', "Drais's machine was banned because", 'B', ['it was too expensive.', 'it caused accidents with pedestrians.', 'it had no brakes.']),
          q('RG', 15, 'mcq', 'Front wheels became larger in order to', 'A', ['increase speed.', 'improve safety.', 'reduce cost.']),
          q('RG', 16, 'mcq', "The safety bicycle's rear wheel was driven by", 'B', ['pedals on the front wheel.', 'a chain.', "the rider's feet."]),
        ],
      },
      {
        instructions: 'Complete the sentences. Write ONE WORD ONLY from the text for each answer.',
        questions: [
          q('RG', 17, 'gap', 'The running machine had no ________.', ['pedals']),
          q('RG', 18, 'gap', 'A sudden stop could throw a high-wheeler rider over the ________.', ['handlebars']),
          q('RG', 19, 'gap', 'The air-filled ________ made cycling more comfortable.', ['tyre', 'tire', 'tyres', 'tires']),
          q('RG', 20, 'gap', 'The bicycle allowed many women to travel ________.', ['independently']),
        ],
      },
    ],
  },
];

const TASK2 =
  'Some people believe that children should start learning a foreign language at primary school, while others think it is better to wait until secondary school.\n\nDiscuss both views and give your own opinion.\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.';

const SPEAKING: MockTest['speaking'] = {
  p1: ['Where is your hometown?', 'What do you like most about it?', 'Do you work or are you a student?', 'How do you usually spend your weekends?', 'Do you prefer reading books or watching films? Why?'],
  p2: { topic: 'Describe a skill you learned that you find useful.', bullets: ['what the skill is', 'when and how you learned it', 'how difficult it was to learn'], closing: 'and explain why you find this skill useful.' },
  p3: ['What skills should children learn at school?', 'Is it better to learn a skill from a teacher or by yourself online?', 'How has technology changed the way people learn new skills?', 'Will some skills become less important in the future?'],
};

export const MOCK_TESTS: MockTest[] = [
  {
    id: 'test-a-ac',
    title: 'Mock Test A · Academic',
    module: 'academic',
    status: 'published',
    listening: LISTENING,
    reading: READING_ACADEMIC,
    writing: {
      t1: {
        prompt: 'The chart below shows the percentage of people in one city who used a public library at least once a month, by age group, in 2010 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        chart: {
          kind: 'bar',
          title: 'Monthly library use by age group (%)',
          unit: '%',
          categories: ['16–24', '25–34', '35–49', '50–64', '65+'],
          series: [
            { name: '2010', values: [42, 35, 30, 33, 45] },
            { name: '2020', values: [28, 24, 27, 36, 52] },
          ],
        },
      },
      t2: { prompt: TASK2 },
    },
    speaking: SPEAKING,
    updatedAt: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'test-a-gt',
    title: 'Mock Test A · General Training',
    module: 'general',
    status: 'published',
    listening: LISTENING,
    reading: READING_GENERAL,
    writing: {
      t1: {
        letter: true,
        prompt: 'You recently attended an evening course at a local college.\n\nWrite a letter to the course organiser. In your letter\n• describe the course you attended\n• explain what problem you had\n• suggest how the course could be improved\n\nWrite at least 150 words. You do NOT need to write any addresses.\n\nBegin your letter as follows: Dear Sir or Madam,',
      },
      t2: { prompt: TASK2 },
    },
    speaking: SPEAKING,
    updatedAt: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'test-b-ac',
    title: 'Mock Test B · Academic',
    module: 'academic',
    status: 'draft',
    listening: [],
    reading: [],
    writing: { t1: { prompt: '' }, t2: { prompt: '' } },
    speaking: { p1: [], p2: { topic: '', bullets: [], closing: '' }, p3: [] },
    updatedAt: '2026-11-02T09:00:00.000Z',
  },
];

export const testById = (id: string | undefined) => MOCK_TESTS.find((test) => test.id === id);

/** Sample answers used by the prototype's «auto-fill» tool and by the seed data. */
export const SAMPLE_WRITING = {
  t1: 'The bar chart compares the proportion of residents in one city who visited a public library at least once a month in 2010 and 2020, broken down into five age groups.\n\nOverall, library use fell among people under 50 but rose among older residents, so that by 2020 the oldest group had become by far the most frequent users.\n\nIn 2010, the youngest group (16–24) and the over-65s were the most regular visitors, at 42% and 45% respectively, while the figures for the three middle groups ranged between 30% and 35%. Ten years later, the share of 16–24-year-olds had dropped sharply to 28%, and the 25–34 group showed a similar decline, from 35% to 24%. Use among 35–49-year-olds fell only slightly, by three percentage points.\n\nBy contrast, the two oldest groups visited libraries more often. The figure for people aged 50–64 increased modestly from 33% to 36%, whereas that for the over-65s climbed to 52%, the highest value in the chart.',
  t2: 'Opinions differ on the best age to begin learning a foreign language. Some argue that primary school is the ideal time, while others believe that students gain more by starting at secondary school. In my view, an early start is generally more beneficial, provided that it is well taught.\n\nThose who favour waiting point out that older children are more mature learners. A twelve-year-old can understand grammar rules, use a dictionary and study independently, so lessons can move faster. They also argue that primary schools often lack qualified language teachers, and poor teaching at an early age may do more harm than good.\n\nOn the other hand, young children have clear advantages. They are less afraid of making mistakes, they imitate sounds more accurately and they usually find songs and games enjoyable rather than embarrassing. In my own country, pupils who began English at seven tended to develop better pronunciation and more confidence in speaking than those who started at twelve. In addition, an early start simply gives learners more years of exposure to the language.\n\nIn conclusion, although the concerns about teacher quality are valid, I believe the benefits of starting at primary school outweigh the drawbacks. Governments should therefore invest in training primary teachers so that children can make the most of this early opportunity.',
};
