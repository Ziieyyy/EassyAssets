const fs = require('fs');
const readline = require('readline');

async function convertCopy() {
  const inputFile = 'supabase/clean-seed.sql';
  const outputFile = 'supabase/clean-seed-inserts.sql';
  
  const fileStream = fs.createReadStream(inputFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const outStream = fs.createWriteStream(outputFile);

  let inCopy = false;
  let currentTable = '';
  let currentColumns = '';
  
  for await (const line of rl) {
    if (line.startsWith('COPY ')) {
      inCopy = true;
      const match = line.match(/^COPY\s+(.+?)\s+\((.+?)\)\s+FROM\s+stdin;/);
      if (match) {
        currentTable = match[1];
        currentColumns = match[2];
      } else {
         // Fallback if structure is different
         const fallbackMatch = line.match(/^COPY\s+(.+?)\s+FROM\s+stdin;/);
         if(fallbackMatch) {
            currentTable = fallbackMatch[1];
            currentColumns = '';
         }
      }
      continue;
    }
    
    if (inCopy) {
      if (line === '\\.') {
        inCopy = false;
        continue;
      }
      
      // Split by tab
      const rawValues = line.split('\t');
      
      const sqlValues = rawValues.map(v => {
        if (v === '\\N') return 'NULL';
        
        let unescaped = v.replace(/\\\\/g, '\\')
                         .replace(/\\b/g, '\b')
                         .replace(/\\f/g, '\f')
                         .replace(/\\n/g, '\n')
                         .replace(/\\r/g, '\r')
                         .replace(/\\t/g, '\t')
                         .replace(/\\v/g, '\v');
        
        unescaped = unescaped.replace(/'/g, "''");
        return `'${unescaped}'`;
      });
      
      if (currentColumns) {
        outStream.write(`INSERT INTO ${currentTable} (${currentColumns}) VALUES (${sqlValues.join(', ')});\n`);
      } else {
        outStream.write(`INSERT INTO ${currentTable} VALUES (${sqlValues.join(', ')});\n`);
      }
    } else {
      if (!line.includes('OWNER TO') && !line.startsWith('ALTER DEFAULT PRIVILEGES') && !line.startsWith('GRANT ') && !line.startsWith('REVOKE ') && !line.startsWith('ALTER ROLE ')) { outStream.write(line + '\n'); }
    }
  }
  
  outStream.end();
  console.log('Conversion complete. Saved to ' + outputFile);
}

convertCopy().catch(console.error);
