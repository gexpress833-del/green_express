'use client'

export default function ProfileCard({
  user,
  avatarUrl,
  initial,
  fileInputRef,
  onAvatarChange,
  onRemoveAvatar,
  uploadingAvatar,
  removingAvatar,
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f172a]/80 shadow-sm overflow-hidden">
      <div className="p-6 flex flex-col items-center text-center">
        <div className="relative group">
          <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white/10 bg-[#1e293b] flex items-center justify-center text-3xl font-semibold text-white/90 shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onAvatarChange}
              disabled={uploadingAvatar}
            />
            <span className="text-white text-sm font-medium px-3 py-2 rounded-lg bg-white/20">
              {uploadingAvatar ? 'Upload…' : 'Changer photo'}
            </span>
          </label>
        </div>
        {avatarUrl && (
          <button
            type="button"
            onClick={onRemoveAvatar}
            disabled={removingAvatar}
            className="mt-3 text-sm text-white/50 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            {removingAvatar ? 'Suppression…' : 'Supprimer photo'}
          </button>
        )}
        <p className="mt-4 text-lg font-semibold text-white truncate max-w-full px-2">
          {user?.name || user?.email || '—'}
        </p>
        <p className="mt-1 text-sm text-white/50 break-all px-2">{user?.email || '—'}</p>
      </div>
    </div>
  )
}
