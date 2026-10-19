// Abhyas — case registry.
// To add a case: create its file in this folder, then add ONE line to the list below.

const cases = [
  require('./CHEST-L1-001'),
  require('./CHEST-L1-002'),
];

const byId = {};
cases.forEach(c => {
  const id = c.meta.caseId;
  if (byId[id]) throw new Error(`Duplicate case id in registry: ${id}`);
  byId[id] = c;
});

// What students may see in the library: no diagnosis, no patient details, no findings.
function publicList() {
  return cases.map(c => ({
    caseId: c.meta.caseId,
    symptom: c.meta.symptom,
    symptomLabel: c.meta.symptomLabel,
    number: c.meta.number,
    durationMinutes: c.meta.durationMinutes,
  }));
}

function getCase(caseId) {
  return byId[caseId] || null;
}

module.exports = { cases, publicList, getCase };
