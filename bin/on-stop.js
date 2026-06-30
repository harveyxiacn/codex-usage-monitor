#!/usr/bin/env node
'use strict';

const { formatStopBox } = require('../lib/format');
const { summarizeSessionFile } = require('../lib/session');

main().catch(() => {
  finish();
});

async function main() {
  const input = await readStdin();
  let hook = {};
  try {
    hook = input ? JSON.parse(input) : {};
  } catch {
    hook = {};
  }

  const transcriptPath = hook.transcript_path
    || hook.transcriptPath
    || (hook.payload && (hook.payload.transcript_path || hook.payload.transcriptPath));

  if (transcriptPath && !isQuiet()) {
    const summary = await summarizeSessionFile(transcriptPath);
    if (summary) {
      if (hook.model && !summary.model) summary.model = hook.model;
      const box = formatStopBox(summary, {
        ascii: Boolean(process.env.CODEX_USAGE_MONITOR_ASCII),
        color: !(process.env.NO_COLOR || process.env.CODEX_USAGE_MONITOR_NO_COLOR),
      });
      if (box) process.stderr.write(`${box}\n`);
    }
  }

  finish();
}

function finish() {
  process.stdout.write(JSON.stringify({ continue: true }));
}

function isQuiet() {
  return process.env.CODEX_USAGE_MONITOR_QUIET === '1'
    || process.env.CODEX_USAGE_MONITOR_QUIET === 'true';
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    const timer = setTimeout(() => resolve(data), 1500).unref();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => {
      clearTimeout(timer);
      resolve(data);
    });
    process.stdin.on('error', () => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}
