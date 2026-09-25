/* ---------------------------------------------------------------------------
   Year of study, grouped the way Pakistani students study: school, college,
   university, postgraduate. The values match server/src/utils/study.js.
--------------------------------------------------------------------------- */

export const STUDY_GROUPS = [
  {
    stage: 'School',
    options: [
      { value: 'Matric - Class 9', label: 'Matric - Class 9' },
      { value: 'Matric - Class 10', label: 'Matric - Class 10' },
      { value: 'O Levels', label: 'O Levels' },
    ],
  },
  {
    stage: 'College',
    options: [
      { value: 'Intermediate - Part 1', label: 'Intermediate - Part 1 (1st year)' },
      { value: 'Intermediate - Part 2', label: 'Intermediate - Part 2 (2nd year)' },
      { value: 'A Levels - AS', label: 'A Levels - AS' },
      { value: 'A Levels - A2', label: 'A Levels - A2' },
    ],
  },
  {
    stage: 'University',
    options: [1, 2, 3, 4, 5].map((n) => ({ value: `Year ${n}`, label: `University - year ${n}` })),
  },
  {
    stage: 'Postgraduate',
    options: [
      { value: 'Masters', label: 'Masters' },
      { value: 'MPhil', label: 'MPhil' },
      { value: 'PhD', label: 'PhD' },
    ],
  },
];

const LABELS = Object.fromEntries(STUDY_GROUPS.flatMap((g) => g.options.map((o) => [o.value, o.label])));

/** How a saved value reads on screen: "Year 2" becomes "University - year 2". */
export const studyLabel = (value) => (value ? LABELS[value] || value : '');

/** The <select> options, grouped by stage. */
export function StudyOptions() {
  return STUDY_GROUPS.map((group) => (
    <optgroup key={group.stage} label={group.stage}>
      {group.options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </optgroup>
  ));
}
