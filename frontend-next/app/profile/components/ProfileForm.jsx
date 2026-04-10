'use client'

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 outline-none transition disabled:opacity-70'

export default function ProfileForm({
  nameDraft,
  setNameDraft,
  user,
  isEditingName,
  setIsEditingName,
  savingName,
  onSaveName,
  onCancelName,
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f172a]/80 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-white mb-1">Informations personnelles</h3>
      <p className="text-sm text-white/50 mb-6">Nom et email liés à votre compte.</p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
            Nom
          </label>
          <input
            type="text"
            value={isEditingName ? nameDraft : (user?.name || '')}
            onChange={(e) => setNameDraft(e.target.value)}
            disabled={!isEditingName || savingName}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className={`${inputClass} cursor-not-allowed opacity-90`}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {!isEditingName ? (
          <button
            type="button"
            onClick={() => setIsEditingName(true)}
            className="px-4 py-2.5 rounded-xl border border-white/20 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            Modifier
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onCancelName}
              disabled={savingName}
              className="px-4 py-2.5 rounded-xl border border-white/15 text-sm font-medium text-white/80 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onSaveName}
              disabled={savingName}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#0b1220] bg-[#d4af37] hover:bg-[#e5c048] transition-colors disabled:opacity-60"
            >
              {savingName ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
