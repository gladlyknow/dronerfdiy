import chunk0 from '../src/data/a-bank/chunk0';
import chunk1 from '../src/data/a-bank/chunk1';
import chunk2 from '../src/data/a-bank/chunk2';
import chunk3 from '../src/data/a-bank/chunk3';
import chunk4 from '../src/data/a-bank/chunk4';
import chunk5 from '../src/data/a-bank/chunk5';

const chunks = [chunk0, chunk1, chunk2, chunk3, chunk4, chunk5];
for (const [index, chunk] of chunks.entries()) {
  const invalid = [...chunk].filter((char) => !/[A-Za-z0-9+/=]/.test(char));
  console.log(`chunk${index}: length=${chunk.length}, mod4=${chunk.length % 4}, invalid=${JSON.stringify(invalid.slice(0, 20))}`);
}
const full = chunks.join('');
const invalid = [...full].filter((char) => !/[A-Za-z0-9+/=]/.test(char));
console.log(`full: length=${full.length}, mod4=${full.length % 4}, invalidCount=${invalid.length}`);
