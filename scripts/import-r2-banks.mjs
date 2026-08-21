import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const TMP = path.join(ROOT, '.tmp-r2-banks');
const OUT = path.join(ROOT, 'src', 'data', 'generated');
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const SOURCES = {
  A: 'https://storage.dronerfdiy.com/redio/A%E7%B1%BB%E9%A2%98%E5%BA%93.pdf',
  B: 'https://storage.dronerfdiy.com/redio/B%E7%B1%BB%E9%A2%98%E5%BA%93.pdf',
  C: 'https://storage.dronerfdiy.com/redio/C%E7%B1%BB%E9%A2%98%E5%BA%93.pdf',
};

const MODULE_NAMES = {
  '1': '法律法规与无线电管理',
  '2': '通联规范与通联程序',
  '3': '无线电技术与电波传播',
  '4': '设备操作与电路基础',
  '5': '安全防护与应急通信',
};

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function download(level, url) {
  const pdf = path.join(TMP, `${level}.pdf`);
  execFileSync('curl', ['-fL', '--retry', '4', '--retry-delay', '2', '-A', 'DroneRFDIY-BankImporter/1.0', '-o', pdf, url], { stdio: 'inherit' });
  const bytes = fs.readFileSync(pdf);
  if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error(`${level}: downloaded file is not a PDF`);
  return pdf;
}

function extract(level, pdf) {
  const txt = path.join(TMP, `${level}.txt`);
  execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdf, txt], { stdio: 'inherit' });
  const pages = Number((run('pdfinfo', [pdf]).match(/^Pages:\s+(\d+)/m) || [])[1] || 0);
  return { text: fs.readFileSync(txt, 'utf8'), pages };
}

function cleanValue(lines) {
  return lines.join('\n')
    .replace(/\f/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeTaggedLines(text) {
  return text.replace(/\r/g, '').replace(/\f/g, '\n').split('\n').map((line) => {
    const m = line.match(/^\s*(\[(?:I|J|P|Q|T|A|B|C|D)\])\s*(.*)$/);
    return m ? `${m[1]}${m[2]}` : line;
  });
}

function parseQuestions(level, text) {
  const lines = normalizeTaggedLines(text);
  const starts = [];
  lines.forEach((line, i) => { if (line.startsWith('[I]')) starts.push(i); });
  if (!starts.length) throw new Error(`${level}: no [I] question markers found`);

  const questions = [];
  for (let n = 0; n < starts.length; n += 1) {
    const block = lines.slice(starts[n], starts[n + 1] ?? lines.length);
    const fields = {};
    let current = null;
    for (const line of block) {
      const m = line.match(/^\[(I|J|P|Q|T|A|B|C|D)\](.*)$/);
      if (m) {
        current = m[1];
        fields[current] = [m[2].trim()];
      } else if (current) {
        fields[current].push(line.trimEnd());
      }
    }
    const required = ['I', 'J', 'P', 'Q', 'T', 'A', 'B', 'C', 'D'];
    const missing = required.filter((k) => !fields[k] || !cleanValue(fields[k]));
    if (missing.length) throw new Error(`${level}: question block ${n + 1} missing ${missing.join(',')}`);
    const answer = cleanValue(fields.T).replace(/[^ABCD]/g, '');
    if (!answer || !/^[ABCD]+$/.test(answer)) throw new Error(`${level}: invalid answer for ${cleanValue(fields.I)}`);
    const id = cleanValue(fields.I);
    const sectionCode = cleanValue(fields.P);
    questions.push({
      id,
      jCode: cleanValue(fields.J),
      sectionCode,
      question: cleanValue(fields.Q),
      answerType: answer,
      options: ['A', 'B', 'C', 'D'].map((key) => ({ key, text: cleanValue(fields[key]) })),
      explanation: '原始题库未提供解析。',
      level,
      sourceLevel: level,
      sourcePdf: `${level}类题库.pdf`,
    });
  }
  return questions;
}

function validate(level, questions) {
  const ids = new Set();
  const jcodes = new Set();
  const sections = new Map();
  let singles = 0;
  let multiples = 0;
  for (const q of questions) {
    if (ids.has(q.id)) throw new Error(`${level}: duplicate id ${q.id}`);
    ids.add(q.id);
    if (jcodes.has(q.jCode)) throw new Error(`${level}: duplicate J code ${q.jCode}`);
    jcodes.add(q.jCode);
    sections.set(q.sectionCode, (sections.get(q.sectionCode) || 0) + 1);
    if (q.answerType.length === 1) singles += 1; else multiples += 1;
    if (q.options.length !== 4 || q.options.some((o) => !o.text)) throw new Error(`${level}: incomplete options at ${q.id}`);
  }
  return { count: questions.length, uniqueIds: ids.size, uniqueJCodes: jcodes.size, sections: sections.size, singles, multiples, sectionCounts: Object.fromEntries([...sections.entries()].sort((a, b) => a[0].localeCompare(b[0], 'zh-CN'))) };
}

function buildCatalog(level, questions) {
  const bySection = new Map();
  for (const q of questions) {
    if (!bySection.has(q.sectionCode)) bySection.set(q.sectionCode, []);
    bySection.get(q.sectionCode).push(q.id);
  }
  return [...bySection.entries()].sort((a, b) => a[0].localeCompare(b[0], 'zh-CN')).map(([sectionCode, questionIds]) => ({
    sectionCode,
    moduleId: sectionCode.split('.')[0],
    moduleTitle: MODULE_NAMES[sectionCode.split('.')[0]] || '其他考点',
    count: questionIds.length,
    questionIds,
  }));
}

function writeTs(name, value, type = '') {
  const content = `// AUTO-GENERATED from R2 authoritative PDF. Do not hand edit.\n${type ? `import type { ${type} } from '../../types';\n` : ''}export default ${JSON.stringify(value, null, 2)}${type ? ` satisfies ${type}[]` : ''};\n`;
  fs.writeFileSync(path.join(OUT, name), content);
}

const manifest = { generatedAt: new Date().toISOString(), sourcePolicy: 'R2 PDF is authoritative', banks: {} };
for (const [level, url] of Object.entries(SOURCES)) {
  const pdf = download(level, url);
  const { text, pages } = extract(level, pdf);
  const questions = parseQuestions(level, text);
  const stats = validate(level, questions);
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(pdf)).digest('hex');
  writeTs(`${level}.ts`, questions, 'ExamQuestion');
  writeTs(`${level}Catalog.ts`, buildCatalog(level, questions));
  manifest.banks[level] = { level, url, pages, sha256, ...stats };
}
fs.writeFileSync(path.join(OUT, 'manifest.ts'), `// AUTO-GENERATED.\nexport default ${JSON.stringify(manifest, null, 2)} as const;\n`);
console.log(JSON.stringify(manifest, null, 2));
