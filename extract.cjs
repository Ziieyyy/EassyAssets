const fs = require('fs');
const readline = require('readline');

async function processFile() {
  const inputFile = 'supabase/.temp/db_cluster-27-12-2025@14-13-02.backup';
  const outputFile = 'supabase/clean-seed.sql';
  
  console.log(`Reading from ${inputFile}...`);
  const fileStream = fs.createReadStream(inputFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const outStream = fs.createWriteStream(outputFile);

  let include = false;
  let headerPhase = true;
  
  for await (const line of rl) {
    if (headerPhase && !line.startsWith('-- Name:') && !line.startsWith('-- Data for Name:')) {
       // Write some safe header lines
       if (line.startsWith('SET ') || line.trim() === '') {
         outStream.write(line + '\n');
       }
       continue;
    }
    
    headerPhase = false;

    if (line.startsWith('-- Name:') || line.startsWith('-- Data for Name:')) {
      if (line.includes('Schema: public')) {
        include = true;
      } else {
        include = false;
      }
    }
    
    if (include) {
      outStream.write(line + '\n');
    }
  }
  
  outStream.end();
  console.log(`Extraction complete. Saved to ${outputFile}`);
}

processFile().catch(console.error);
