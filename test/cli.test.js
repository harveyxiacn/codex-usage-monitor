'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const fixture = path.join(__dirname, 'fixtures', 'session-basic.jsonl');
const cli = path.join(__dirname, '..', 'bin', 'codex-usage-monitor.js');
const stop = path.join(__dirname, '..', 'bin', 'on-stop.js');

test('statusline command prints a compact one-line summary', () => {
  const result = spawnSync(process.execPath, [cli, 'statusline', '--file', fixture, '--ascii', '--no-color'], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.match(result.stdout.trim(), /GPT-5\.4 mini/);
  assert.match(result.stdout.trim(), /API≈\$0\.0032/);
});

test('json command emits machine-readable usage summary', () => {
  const result = spawnSync(process.execPath, [cli, 'json', '--file', fixture], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.sessionId, 'sess_basic');
  assert.equal(payload.model, 'gpt-5.4-mini');
  assert.equal(payload.totalUsage.totalTokens, 2500);
});

test('Stop hook writes JSON to stdout and human summary to stderr', () => {
  const input = JSON.stringify({
    hook_event_name: 'Stop',
    session_id: 'sess_basic',
    transcript_path: fixture,
    cwd: 'E:\\Project\\demo',
    model: 'gpt-5.4-mini',
    turn_id: 'turn_two',
  });
  const result = spawnSync(process.execPath, [stop], {
    input,
    encoding: 'utf8',
    env: { ...process.env, CODEX_USAGE_MONITOR_ASCII: '1', NO_COLOR: '1' },
  });

  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), { continue: true });
  assert.match(result.stderr, /codex-usage-monitor/);
  assert.match(result.stderr, /GPT-5\.4 mini/);
});
