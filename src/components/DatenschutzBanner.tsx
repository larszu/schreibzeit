import { repository } from '@/db/repository';
import { t } from '@/i18n/de';

export function DatenschutzBanner() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="card mx-auto max-w-3xl border-brand-200 p-4 shadow-card sm:flex sm:items-center sm:gap-4">
        <div className="flex-1">
          <p className="font-serif font-semibold text-ink">{t.datenschutz.titel}</p>
          <p className="mt-1 text-sm text-ink-soft">{t.datenschutz.text}</p>
          <p className="mt-1 text-xs text-ink-faint">{t.datenschutz.hinweisInitialen}</p>
        </div>
        <button
          className="btn-primary mt-3 w-full shrink-0 sm:mt-0 sm:w-auto"
          onClick={() => void repository.saveEinstellungen({ datenschutzBestaetigt: true })}
        >
          {t.datenschutz.verstanden}
        </button>
      </div>
    </div>
  );
}
