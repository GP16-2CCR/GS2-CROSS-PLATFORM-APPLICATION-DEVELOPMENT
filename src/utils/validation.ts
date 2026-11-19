import { DecisionKind, Priority, ReportCategory } from '../types';

/**
 * Validações dos formulários. Além de regras de formato, há uma camada de
 * PRIVACIDADE: textos livres não podem conter dados pessoais de cidadãos
 * (CPF, e-mail, telefone ou endereço com número), conforme a LGPD (minimização).
 */

const CPF_RE = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(\(?\b\d{2}\)?\s?)?\b9?\d{4}[-\s]?\d{4}\b/;
const ADDRESS_RE = /\b(rua|r\.|avenida|av\.|travessa|tv\.|alameda|estrada|rodovia)\s+[^\d,\n]{2,},?\s*(n[º°o]?\.?\s*)?\d{1,5}\b/i;

export function detectPersonalData(text: string): string | null {
  if (CPF_RE.test(text)) return 'Parece conter um CPF. Remova dados pessoais de cidadãos.';
  if (EMAIL_RE.test(text)) return 'Parece conter um e-mail. Remova dados pessoais de cidadãos.';
  if (ADDRESS_RE.test(text)) return 'Parece conter um endereço com número. Use apenas a via ou ponto de referência.';
  if (PHONE_RE.test(text)) return 'Parece conter um telefone. Remova dados pessoais de cidadãos.';
  return null;
}

export type ReportForm = {
  regionId: string | null;
  category: ReportCategory | null;
  priority: Priority | null;
  title: string;
  description: string;
  estimatedAffected: string;
};

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export function validateReport(f: ReportForm): FormErrors<ReportForm> {
  const e: FormErrors<ReportForm> = {};
  if (!f.regionId) e.regionId = 'Selecione o território.';
  if (!f.category) e.category = 'Selecione uma categoria.';
  if (!f.priority) e.priority = 'Selecione a prioridade.';

  const title = f.title.trim();
  if (title.length < 5) e.title = 'O título deve ter pelo menos 5 caracteres.';
  else if (title.length > 80) e.title = 'O título deve ter no máximo 80 caracteres.';
  else {
    const pd = detectPersonalData(title);
    if (pd) e.title = pd;
  }

  const desc = f.description.trim();
  if (desc.length < 20) e.description = 'Descreva a situação com pelo menos 20 caracteres.';
  else if (desc.length > 500) e.description = 'A descrição deve ter no máximo 500 caracteres.';
  else {
    const pd = detectPersonalData(desc);
    if (pd) e.description = pd;
  }

  const raw = f.estimatedAffected.trim();
  if (raw === '') e.estimatedAffected = 'Informe uma estimativa (use 0 se desconhecido).';
  else if (!/^\d+$/.test(raw)) e.estimatedAffected = 'Use apenas números inteiros, sem pontos ou letras.';
  else if (Number(raw) > 1_000_000) e.estimatedAffected = 'Valor acima do limite de 1.000.000 pessoas.';
  return e;
}

export type DecisionForm = {
  kind: DecisionKind | null;
  action: string | null;
  rationale: string;
  managerRole: string;
  acknowledged: boolean;
};

export function validateDecision(f: DecisionForm): FormErrors<DecisionForm> {
  const e: FormErrors<DecisionForm> = {};
  if (!f.kind) e.kind = 'Escolha uma decisão.';
  if (f.kind === 'aprovar' && !f.action) e.action = 'Escolha qual ação será encaminhada.';
  const r = f.rationale.trim();
  if (r.length < 20) e.rationale = 'Justifique a decisão com pelo menos 20 caracteres.';
  else if (r.length > 400) e.rationale = 'Máximo de 400 caracteres.';
  else {
    const pd = detectPersonalData(r);
    if (pd) e.rationale = pd;
  }
  const role = f.managerRole.trim();
  if (role.length < 3) e.managerRole = 'Informe o cargo ou setor responsável (mín. 3 caracteres).';
  else if (role.length > 60) e.managerRole = 'Máximo de 60 caracteres.';
  if (!f.acknowledged) e.acknowledged = 'Confirme que leu a justificativa e as limitações.';
  return e;
}

export function hasErrors<T>(e: FormErrors<T>): boolean {
  return Object.keys(e).length > 0;
}
