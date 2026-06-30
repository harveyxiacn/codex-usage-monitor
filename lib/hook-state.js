'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { defaultCodexHome } = require('./session');

const STATE_FILE = 'codex-usage-monitor-state.json';

function shouldShowHookSummary(options = {}) {
  const env = options.env || process.env;
  if (isQuiet(env)) return false;

  const intervalSeconds = positiveNumber(env.CODEX_USAGE_MONITOR_HOOK_INTERVAL_SECONDS);
  if (!intervalSeconds) return true;

  const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now();
  const state = readHookState(options.codexHome || defaultCodexHome());
  const lastMs = Number(state.lastHookDisplayAt);
  if (!Number.isFinite(lastMs) || lastMs <= 0) return true;

  return nowMs - lastMs >= intervalSeconds * 1000;
}

function recordHookSummaryShown(options = {}) {
  const codexHome = options.codexHome || defaultCodexHome();
  const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now();
  try {
    fs.mkdirSync(codexHome, { recursive: true });
    fs.writeFileSync(hookStatePath(codexHome), `${JSON.stringify({ lastHookDisplayAt: nowMs })}\n`, 'utf8');
  } catch {
    // Monitoring must never block Codex.
  }
}

function hookStatePath(codexHome = defaultCodexHome()) {
  return path.join(codexHome, STATE_FILE);
}

function readHookState(codexHome) {
  try {
    return JSON.parse(fs.readFileSync(hookStatePath(codexHome), 'utf8'));
  } catch {
    return {};
  }
}

function isQuiet(env) {
  return env.CODEX_USAGE_MONITOR_QUIET === '1'
    || env.CODEX_USAGE_MONITOR_QUIET === 'true';
}

function positiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

module.exports = {
  hookStatePath,
  recordHookSummaryShown,
  shouldShowHookSummary,
};
