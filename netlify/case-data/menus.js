// Abhyas — shared menus used by every case.
// Case files only supply FINDINGS and RESULTS, using the item ids and test names below.
// Menus never contain diagnosis names, so they cannot give anything away.

const DEFAULT_FINDING = 'No abnormality detected.';

const EXAM_SYSTEMS = [
  {
    id: 'general', label: 'General',
    items: [
      { id: 'general_appearance', label: 'General appearance' },
      { id: 'jaundice', label: 'Jaundice' },
      { id: 'anaemia', label: 'Anaemia (pallor)' },
      { id: 'clubbing', label: 'Clubbing' },
      { id: 'cyanosis', label: 'Cyanosis' },
      { id: 'lymph_nodes', label: 'Lymph nodes' },
      { id: 'oedema', label: 'Oedema' },
      { id: 'dehydration', label: 'Dehydration' },
      { id: 'legs_calves', label: 'Legs and calves' },
    ],
  },
  {
    id: 'cvs', label: 'Cardiovascular',
    items: [
      { id: 'cvs_inspection', label: 'Inspection' },
      { id: 'jvp', label: 'JVP (neck veins)' },
      { id: 'cvs_palpation', label: 'Palpation (apex beat, heaves, thrills)' },
      { id: 'cvs_auscultation', label: 'Auscultation (heart sounds, murmurs)' },
      { id: 'peripheral_pulses', label: 'Peripheral pulses' },
    ],
  },
  {
    id: 'resp', label: 'Respiratory',
    items: [
      { id: 'resp_inspection', label: 'Inspection' },
      { id: 'resp_palpation', label: 'Palpation (trachea, expansion)' },
      { id: 'resp_percussion', label: 'Percussion' },
      { id: 'resp_auscultation', label: 'Auscultation' },
    ],
  },
  {
    id: 'abdomen', label: 'Abdomen',
    items: [
      { id: 'abd_inspection', label: 'Inspection' },
      { id: 'abd_palpation_light', label: 'Light palpation' },
      { id: 'abd_palpation_deep', label: 'Deep palpation' },
      { id: 'abd_organs', label: 'Liver, spleen, kidneys' },
      { id: 'abd_percussion', label: 'Percussion' },
      { id: 'abd_auscultation', label: 'Auscultation (bowel sounds)' },
    ],
  },
  {
    id: 'neuro', label: 'Neurological',
    items: [
      { id: 'higher_function', label: 'Higher mental function' },
      { id: 'cranial_nerves', label: 'Cranial nerves' },
      { id: 'motor', label: 'Motor (tone, power)' },
      { id: 'sensory', label: 'Sensory' },
      { id: 'reflexes', label: 'Reflexes' },
      { id: 'coordination', label: 'Coordination' },
      { id: 'gait', label: 'Gait' },
    ],
  },
  {
    id: 'local', label: 'Local exam (site of the complaint)',
    // askWhere: the student must say WHERE, in their own words.
    // The case file decides what they find at each place.
    items: [
      { id: 'local_inspection', label: 'Inspect the site', askWhere: true },
      { id: 'local_palpation', label: 'Palpate the site', askWhere: true },
            { id: 'local_movement', label: 'Movement / provocation at the site', askWhere: true },
    ],
  },
  {
    id: 'intimate', label: 'Intimate examinations',
    // intimate: true means a chaperone is ALWAYS needed, in every case.
    items: [
      { id: 'breast_exam', label: 'Breast examination', intimate: true },
      { id: 'genital_exam', label: 'Genital examination', intimate: true },
      { id: 'pelvic_exam', label: 'Pelvic / vaginal examination', intimate: true },
      { id: 'rectal_exam', label: 'Digital rectal examination', intimate: true },
    ],
  },
];

const TESTS = [
  { name: 'Electrocardiogram (ECG)', group: 'Cardiac' },
  { name: 'Troponin I', group: 'Cardiac' },
  { name: 'Echocardiogram', group: 'Cardiac' },
  { name: 'Chest X-ray (PA)', group: 'Imaging' },
  { name: 'CT pulmonary angiogram (CTPA)', group: 'Imaging' },
  { name: 'D-dimer', group: 'Bloods' },
  { name: 'Full blood count (FBC)', group: 'Bloods' },
  { name: 'Urea and electrolytes (U&E)', group: 'Bloods' },
  { name: 'H. pylori stool antigen', group: 'Other' },
  { name: 'Upper GI endoscopy', group: 'Other' },
];

function findExamItem(id) {
  for (const system of EXAM_SYSTEMS) {
    const item = system.items.find(i => i.id === id);
    if (item) return { ...item, systemId: system.id, systemLabel: system.label };
  }
  return null;
}

module.exports = { DEFAULT_FINDING, EXAM_SYSTEMS, TESTS, findExamItem };
