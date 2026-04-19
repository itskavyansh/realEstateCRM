const fs = require('fs');
const csv = require('csv-parser');

/**
 * Parse a CSV file and return an array of lead objects.
 * Expected CSV columns: name, phone, email, budgetMin, budgetMax, propertyTypePreference, source, notes
 */
const parseLeadsCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const leads = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        leads.push({
          name: row.name || row.Name || '',
          phone: row.phone || row.Phone || '',
          email: row.email || row.Email || '',
          budgetMin: Number(row.budgetMin || row.BudgetMin || 0),
          budgetMax: Number(row.budgetMax || row.BudgetMax || 0),
          propertyTypePreference: (row.propertyTypePreference || row.PropertyType || '').toUpperCase(),
          source: (row.source || row.Source || 'WEBSITE').toUpperCase(),
          notes: row.notes || row.Notes || '',
          status: 'NEW',
        });
      })
      .on('end', () => {
        // Clean up the uploaded temp file
        fs.unlink(filePath, () => {});
        resolve(leads);
      })
      .on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
  });
};

module.exports = { parseLeadsCSV };
