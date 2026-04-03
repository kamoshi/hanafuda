import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { Locale } from '../core/types';
import { en } from './en';
import { pl } from './pl';
import { ja } from './ja';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TranslationKey = keyof typeof en;

type Translations = Record<TranslationKey, string>;

// ---------------------------------------------------------------------------
// Module-level locale state (shared singleton)
// ---------------------------------------------------------------------------

const translations: Record<Locale, Translations> = { en, pl, ja };

let currentLocale: Locale = 'en';
const subscribers = new Set<() => void>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function setLocale(locale: Locale): void {
  if (locale === currentLocale) return;
  currentLocale = locale;
  for (const fn of subscribers) fn();
}

export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Returns the translation for `key` in the current locale.
 * The `TranslationKey` type guarantees the key exists in all locales.
 */
export function t(key: TranslationKey): string {
  return translations[currentLocale][key];
}

// ---------------------------------------------------------------------------
// Lit reactive controller
// ---------------------------------------------------------------------------

/**
 * Add this controller to any Lit element that renders translated strings.
 * It triggers `host.requestUpdate()` whenever the active locale changes,
 * so re-rendered templates automatically pick up the new translations.
 *
 * Usage:
 *   private locale = new LocaleController(this)
 *   render() { return html`<p>${t('koikoi_question')}</p>` }
 */
export class LocaleController implements ReactiveController {
  private readonly notify: () => void;

  constructor(host: ReactiveControllerHost) {
    this.notify = () => host.requestUpdate();
    host.addController(this);
  }

  hostConnected(): void {
    subscribers.add(this.notify);
  }

  hostDisconnected(): void {
    subscribers.delete(this.notify);
  }
}
