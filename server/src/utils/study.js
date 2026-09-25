/* ---------------------------------------------------------------------------
   Where a student is in their studies, following the Pakistani system:
   Matric (classes 9 and 10) or O Levels at school; Intermediate (FA, FSc,
   ICS, I.Com) or A Levels at college; then each year of a university degree
   and postgraduate study. The client shows the same list grouped by stage
   (client/src/lib/study.js); this is the list the database accepts.

   'Year 1' to 'Year 5' keep their original values, so existing accounts
   stay valid; they are shown as "University - year 1" and so on.
--------------------------------------------------------------------------- */

export const STUDY_LEVELS = [
  '',
  'Matric - Class 9',
  'Matric - Class 10',
  'O Levels',
  'Intermediate - Part 1',
  'Intermediate - Part 2',
  'A Levels - AS',
  'A Levels - A2',
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Masters',
  'MPhil',
  'PhD',
];
