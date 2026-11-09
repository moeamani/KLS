// Online placement test for teens and adults: 15 items from A1 to C1. The score maps to a
// suggested level; reception confirms it (docs/03-academics.md «تعیین سطح»).

export interface PlacementItem { id: string; level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'; prompt: string; options: string[]; answer: number }

export const PLACEMENT: PlacementItem[] = [
  { id: 'p1', level: 'A1', prompt: 'My sister ___ a teacher.', options: ['am', 'is', 'are'], answer: 1 },
  { id: 'p2', level: 'A1', prompt: 'There ___ two books on the table.', options: ['is', 'be', 'are'], answer: 2 },
  { id: 'p3', level: 'A1', prompt: 'I usually ___ breakfast at seven.', options: ['have', 'having', 'has'], answer: 0 },
  { id: 'p4', level: 'A2', prompt: 'We ___ to Shiraz last summer.', options: ['go', 'went', 'have gone'], answer: 1 },
  { id: 'p5', level: 'A2', prompt: 'This film is ___ than the last one.', options: ['more interesting', 'most interesting', 'interestinger'], answer: 0 },
  { id: 'p6', level: 'A2', prompt: "Look at those clouds! It ___ rain.", options: ['will', 'is going to', 'is'], answer: 1 },
  { id: 'p7', level: 'B1', prompt: 'I have lived here ___ 2019.', options: ['for', 'since', 'from'], answer: 1 },
  { id: 'p8', level: 'B1', prompt: 'If I ___ more time, I would learn the piano.', options: ['have', 'had', 'would have'], answer: 1 },
  { id: 'p9', level: 'B1', prompt: 'The report ___ by the manager yesterday.', options: ['was written', 'wrote', 'has written'], answer: 0 },
  { id: 'p10', level: 'B2', prompt: 'She suggested ___ the meeting until Monday.', options: ['to postpone', 'postponing', 'postpone'], answer: 1 },
  { id: 'p11', level: 'B2', prompt: "By the time we arrived, the concert ___.", options: ['had started', 'has started', 'started'], answer: 0 },
  { id: 'p12', level: 'B2', prompt: 'He is used to ___ early.', options: ['get up', 'getting up', 'got up'], answer: 1 },
  { id: 'p13', level: 'C1', prompt: 'Not only ___ late, but he also forgot the documents.', options: ['he arrived', 'did he arrive', 'arrived he'], answer: 1 },
  { id: 'p14', level: 'C1', prompt: 'The proposal was rejected on the ___ that it was too expensive.', options: ['grounds', 'reasons', 'basis'], answer: 0 },
  { id: 'p15', level: 'C1', prompt: 'Had I known about the traffic, I ___ earlier.', options: ['would leave', 'would have left', 'left'], answer: 1 },
];

export const placementResult = (correct: number) => {
  if (correct <= 3) return { cefr: 'A1', adults: 'a1', teens: 't1', title: 'Elementary' };
  if (correct <= 6) return { cefr: 'A2', adults: 'a2', teens: 't3', title: 'Pre-Intermediate' };
  if (correct <= 9) return { cefr: 'B1', adults: 'a3', teens: 't5', title: 'Intermediate' };
  if (correct <= 12) return { cefr: 'B2', adults: 'a4', teens: 't7', title: 'Upper-Intermediate' };
  return { cefr: 'C1', adults: 'a5', teens: 't8', title: 'Advanced' };
};
