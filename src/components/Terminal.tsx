'use client';

// The CRT easter egg: a tiny fake shell over the site's content.
// A virtual filesystem is built from src/content, plus a handful of joke commands.

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { SectionId } from '@/content/sections';
import { site } from '@/content/site';
import { projects } from '@/content/projects';
import { experience, education, skills, certs } from '@/content/resume';
import { about, awards } from '@/content/about';

type Line = { kind: 'in' | 'out' | 'err' | 'ok'; text: string; prompt?: string };
type FsNode = { type: 'dir'; children: Record<string, FsNode> } | { type: 'file'; read: () => string[] };

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const file = (read: () => string[]): FsNode => ({ type: 'file', read });
const dir = (children: Record<string, FsNode>): FsNode => ({ type: 'dir', children });

function buildFs(): FsNode {
  return dir({
    'about.txt': file(() => [about.bio, '', `into right now: ${about.intoNow.join(', ')}`, `outside of code: ${about.outside}`]),
    'skills.txt': file(() => skills.map((s) => `${s.group.padEnd(17)} ${s.items.join(', ')}`)),
    'contact.txt': file(() => [`email     ${site.links.email}`, `linkedin  ${site.links.linkedin}`, `github    ${site.links.github}`, '', 'or try: sudo hire-me']),
    'education.txt': file(() => [`${education.degree}`, `${education.school} · ${education.dates}`, ...education.notes, `coursework: ${education.coursework.join(', ')}`]),
    'awards.txt': file(() => awards.map((a) => `${a.year}  ${a.name}${a.detail ? ` (${a.detail})` : ''}`)),
    'certs.txt': file(() => certs.map((c) => `${c.date.padEnd(9)} ${c.name}`)),
    projects: dir(Object.fromEntries(projects.map((p) => [p.slug, file(() => [
      p.name, p.oneLiner, '', `role:  ${p.role}`, `stack: ${p.stack.join(', ')}`,
      ...(p.outcome ? [`outcome: ${p.outcome}`] : []),
      ...p.links.map((l) => `${l.label.toLowerCase()}: ${l.href}`),
      '', `→ open projects/${p.slug}  for the full case study`,
    ])]))),
    experience: dir(Object.fromEntries(experience.map((r) => [`${slug(r.company)}.txt`, file(() => [
      `${r.title} @ ${r.company}`, `${r.dates} · ${r.location}`, '', ...r.bullets.map((b) => `• ${b}`), '', `tech: ${r.tech.join(', ')}`,
    ])]))),
    '.secret': file(() => ['psst, the lamp on the shelf works. try clicking it.', 'the teddy bear doesn’t mind a poke either.']),
  });
}

const COMMANDS = [
  'help', 'whoami', 'ls', 'cd', 'cat', 'pwd', 'open', 'clear', 'history', 'echo', 'date', 'exit',
  'sudo', 'rm', 'git', 'climb', 'dive', 'coffee', 'vim', 'ping',
];

const HELP = [
  'navigate   ls [-a] [dir] · cd <dir> · cat <file> · pwd',
  'go places  open github | linkedin | credly | email | resume | projects/<name>',
  'about me   whoami · cat about.txt · ls projects · ls experience',
  'misc       clear · history · echo · date · exit',
  '',
  'there are a few other commands in here. explore.',
];

export default function Terminal({ onExit, onOpen }: { onExit: () => void; onOpen: (id: SectionId) => void }) {
  const fs = useMemo(buildFs, []);
  const [cwd, setCwd] = useState<string[]>([]);
  const [lines, setLines] = useState<Line[]>([
    { kind: 'ok', text: `${site.name.toLowerCase().replace(' ', '')}@portfolio · type \`help\` to get started` },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [hIndex, setHIndex] = useState(-1);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const prompt = `gabriel@portfolio:${cwd.length ? `~/${cwd.join('/')}` : '~'}$`;

  useEffect(() => { inputRef.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [lines]);

  // ---- filesystem helpers ----
  const resolve = (path: string): { node: FsNode | null; parts: string[] } => {
    let parts = path.startsWith('~') || path.startsWith('/') ? [] : [...cwd];
    for (const seg of path.replace(/^~\/?|^\//, '').split('/').filter(Boolean)) {
      if (seg === '.') continue;
      if (seg === '..') { parts.pop(); continue; }
      parts = [...parts, seg];
    }
    let node: FsNode | null = fs;
    for (const p of parts) node = node && node.type === 'dir' ? node.children[p] ?? null : null;
    return { node, parts };
  };

  const print = (text: string | string[], kind: Line['kind'] = 'out') =>
    setLines((l) => [...l, ...(Array.isArray(text) ? text : [text]).map((t) => ({ kind, text: t }))]);

  const later = (ms: number, fn: () => void) => new Promise<void>((r) => setTimeout(() => { fn(); r(); }, ms));

  // ---- commands ----
  async function run(raw: string) {
    const cmdline = raw.trim();
    setLines((l) => [...l, { kind: 'in', text: cmdline, prompt }]);
    if (!cmdline) return;
    setHistory((h) => [...h, cmdline]);
    setHIndex(-1);

    const [cmd, ...args] = cmdline.split(/\s+/);
    const arg = args.join(' ');

    switch (cmd) {
      case 'help': return print(HELP);
      case 'whoami': return print(`${site.name}: ${site.title.toLowerCase()}, CS @ NUS. ${site.pitch.toLowerCase()}.`);
      case 'pwd': return print(`/home/gabriel${cwd.length ? '/' + cwd.join('/') : ''}`);
      case 'date': return print(new Date().toString());
      case 'echo': return print(arg);
      case 'clear': return setLines([]);
      case 'history': return print(history.map((h, i) => `${String(i + 1).padStart(3)}  ${h}`));
      case 'exit': print('logout'); return void setTimeout(onExit, 300);

      case 'ls': {
        const all = args.includes('-a') || args.includes('-la') || args.includes('-al');
        const target = args.find((a) => !a.startsWith('-')) ?? '.';
        const { node } = resolve(target);
        if (!node) return print(`ls: ${target}: no such file or directory`, 'err');
        if (node.type === 'file') return print(target);
        const names = Object.entries(node.children)
          .filter(([n]) => all || !n.startsWith('.'))
          .map(([n, c]) => (c.type === 'dir' ? `${n}/` : n));
        return print((all ? ['./', '../', ...names] : names).join('   ') || '(empty)');
      }

      case 'cd': {
        if (!arg || arg === '~') return setCwd([]);
        const { node, parts } = resolve(arg);
        if (!node) return print(`cd: ${arg}: no such directory`, 'err');
        if (node.type !== 'dir') return print(`cd: ${arg}: not a directory`, 'err');
        return setCwd(parts);
      }

      case 'cat': {
        if (!arg) return print('cat: which file? try `ls`', 'err');
        const { node } = resolve(arg.replace(/\/$/, ''));
        if (!node) return print(`cat: ${arg}: no such file`, 'err');
        if (node.type === 'dir') return print(`cat: ${arg}: is a directory. try \`ls ${arg}\``, 'err');
        return print(node.read());
      }

      case 'open': {
        const t = arg.toLowerCase();
        const external: Record<string, string> = {
          github: site.links.github, linkedin: site.links.linkedin, credly: site.links.credly, email: `mailto:${site.links.email}`,
        };
        if (external[t]) { print(`opening ${t}…`, 'ok'); window.open(external[t], '_blank', 'noopener'); return; }
        if (t === 'resume' || t === 'résumé') { print('opening résumé…', 'ok'); return void setTimeout(() => onOpen('resume'), 300); }
        const proj = projects.find((p) => t === p.slug || t === `projects/${p.slug}` || (cwd[0] === 'projects' && t === p.slug));
        if (proj) { print(`opening ${proj.name}…`, 'ok'); window.open(`/projects/${proj.slug}`, '_blank', 'noopener'); return; }
        return print('open: try github, linkedin, credly, email, resume or projects/<name>', 'err');
      }

      // ---- the jokes ----
      case 'sudo': {
        if (arg !== 'hire-me') return print('recruiter is not in the sudoers file. this incident will be reported.', 'err');
        setBusy(true);
        print('[sudo] password for recruiter: ');
        await later(700, () => setLines((l) => { const c = [...l]; c[c.length - 1] = { kind: 'out', text: '[sudo] password for recruiter: ********' }; return c; }));
        await later(500, () => print('✔ permission granted.', 'ok'));
        await later(500, () => print('opening the contact form…', 'ok'));
        await later(700, () => onOpen('contact'));
        return setBusy(false);
      }
      case 'rm':
        return print(/-rf?\s+(\/|\*|~)/.test(arg) || arg.includes('-rf') ? 'nice try.' : `rm: ${arg || 'missing operand'}: permission denied`, 'err');
      case 'git':
        if (args[0] === 'blame') return print('it was me. it’s always me.');
        if (args[0] === 'push' && args.includes('--force')) return print('not on my main branch you don’t.', 'err');
        if (args[0] === 'status') return print(['on branch main', 'nothing to commit, working tree clean', '(unlike my sleep schedule)']);
        return print('fatal: this is a portfolio, not a repo. try `open github`', 'err');
      case 'climb': return print('sending V4... slipped off the last hold. retrying tomorrow.');
      case 'dive': return print('descending to 18m... no bugs down here, only fish.');
      case 'coffee': return print('☕ brewing... deploys go faster now.');
      case 'vim': case 'vi': case 'nano': case 'emacs':
        return print(`${cmd}: you’d never get out. stay here, it’s safer.`);
      case ':q': case ':wq': case ':q!': return print('you’re not in vim. but I respect the reflex.');
      case 'ping': return print(arg.includes('gabriel') || !arg ? 'pong. usually replies within a day.' : `ping: ${arg}: only gabriel answers here`);
      case 'hello': case 'hi': case 'hey': return print('hey! type `help` to look around.');

      default:
        return print(`command not found: ${cmd}. type \`help\``, 'err');
    }
  }

  // ---- tab completion ----
  function complete() {
    const parts = input.split(/\s+/);
    if (parts.length === 1) {
      const hits = COMMANDS.filter((c) => c.startsWith(parts[0]));
      if (hits.length === 1) setInput(hits[0] + ' ');
      else if (hits.length > 1) print(hits.join('   '));
      return;
    }
    const partial = parts[parts.length - 1];
    const slash = partial.lastIndexOf('/');
    const base = slash >= 0 ? partial.slice(0, slash + 1) : '';
    const stem = slash >= 0 ? partial.slice(slash + 1) : partial;
    const { node } = resolve(base || '.');
    if (!node || node.type !== 'dir') return;
    const hits = Object.entries(node.children).filter(([n]) => n.startsWith(stem) && (stem.startsWith('.') || !n.startsWith('.')));
    if (hits.length === 1) {
      const [n, c] = hits[0];
      parts[parts.length - 1] = base + n + (c.type === 'dir' ? '/' : '');
      setInput(parts.join(' '));
    } else if (hits.length > 1) {
      print(hits.map(([n, c]) => (c.type === 'dir' ? `${n}/` : n)).join('   '));
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (busy) return;
      const v = input;
      setInput('');
      void run(v);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      const i = hIndex < 0 ? history.length - 1 : Math.max(0, hIndex - 1);
      setHIndex(i);
      setInput(history[i]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hIndex < 0) return;
      const i = hIndex + 1;
      if (i >= history.length) { setHIndex(-1); setInput(''); } else { setHIndex(i); setInput(history[i]); }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  }

  return (
    <div className="term" onClick={() => inputRef.current?.focus()} role="region" aria-label="Terminal">
      <div className="term-out" aria-live="polite">
        {lines.map((l, i) => (
          <div key={i} className={`term-line ${l.kind}`}>
            {l.kind === 'in' && <span className="term-prompt">{l.prompt} </span>}
            {l.text}
          </div>
        ))}
        <div className="term-input-row" ref={endRef}>
          <span className="term-prompt">{prompt} </span>
          <input
            ref={inputRef}
            className="term-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label="Terminal input"
            disabled={busy}
          />
        </div>
      </div>
    </div>
  );
}
