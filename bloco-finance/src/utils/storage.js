import { INITIAL_DATA } from '../data/initialData';

const KEYS = {
  scenarioB: 'bloco_scenario_b',
  despesas: 'bloco_despesas',
  investimentos: 'bloco_investimentos',
  metas: 'bloco_metas',
  metaValues: 'bloco_meta_values',
  staircase: 'bloco_staircase',
  bonus: 'bloco_bonus',
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage save error', e);
  }
}

export function loadScenarioB() {
  return load(KEYS.scenarioB, INITIAL_DATA.scenarioB);
}

export function saveScenarioB(data) {
  save(KEYS.scenarioB, data);
}

export function loadDespesas() {
  return load(KEYS.despesas, INITIAL_DATA.despesas);
}

export function saveDespesas(data) {
  save(KEYS.despesas, data);
}

export function loadInvestimentos() {
  return load(KEYS.investimentos, INITIAL_DATA.investimentos);
}

export function saveInvestimentos(data) {
  save(KEYS.investimentos, data);
}

export function loadMetas() {
  return load(KEYS.metas, INITIAL_DATA.monthlyGoals);
}

export function saveMetas(data) {
  save(KEYS.metas, data);
}

export function loadStaircase() {
  return load(KEYS.staircase, INITIAL_DATA.staircase);
}

export function saveStaircase(data) {
  save(KEYS.staircase, data);
}

export function loadBonus() {
  return load(KEYS.bonus, INITIAL_DATA.bonus);
}

export function saveBonus(data) {
  save(KEYS.bonus, data);
}

export function resetScenarioB() {
  localStorage.removeItem(KEYS.scenarioB);
  localStorage.removeItem(KEYS.staircase);
  localStorage.removeItem(KEYS.bonus);
  localStorage.removeItem(KEYS.metaValues);
}
