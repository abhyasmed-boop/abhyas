// Abhyas — public case list for the library.
// Returns only: id, symptom heading, case number, duration. Never a diagnosis or any patient detail.

const { publicList } = require('../case-data/index');

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    return { statusCode: 200, headers, body: JSON.stringify({ cases: publicList() }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
