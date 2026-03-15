"use client"
import { useState, useEffect } from 'react'
import { register, registerCompany } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isValidEmail, isValidPassword } from '@/lib/helpers'
import { pushToast } from '@/components/Toaster'

export default function RegisterPage(){
  const [accountType, setAccountType] = useState('client') // 'client' or 'entreprise'
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [confirmPassword,setConfirmPassword]=useState('')
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(false)
  
  // Entreprise fields
  const [companyName, setCompanyName] = useState('')
  const [institutionType, setInstitutionType] = useState('privee')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [employeeCount, setEmployeeCount] = useState('')
  const [employeeList, setEmployeeList] = useState([]) // [{ full_name, matricule, function, phone }, ...]
  
  const router = useRouter()
  const n = Math.max(0, parseInt(employeeCount, 10) || 0)
  useEffect(() => {
    if (n <= 0) { setEmployeeList([]); return }
    setEmployeeList(prev => {
      const next = [...prev]
      while (next.length < n) next.push({ full_name: '', matricule: '', function: '', phone: '' })
      return next.slice(0, n).map((e, i) => ({ ...e, full_name: e.full_name || '', matricule: e.matricule || '', function: e.function || '', phone: e.phone || '' }))
    })
  }, [n])

  async function submit(e){
    e.preventDefault()
    setError('')

    if(!name.trim()){
      setError('Le nom est requis.')
      return
    }

    if(!isValidEmail(email)){
      setError('Veuillez entrer un email valide.')
      return
    }

    if(!isValidPassword(password)){
      setError('Le mot de passe doit avoir au moins 6 caractères.')
      return
    }

    if(password !== confirmPassword){
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    // Validation supplémentaire pour entreprise
    if(accountType === 'entreprise'){
      if(!companyName.trim()){
        setError('Le nom de l\'entreprise est requis.')
        return
      }
      if(!companyPhone.trim()){
        setError('Le téléphone de l\'entreprise est requis.')
        return
      }
      if(!companyAddress.trim()){
        setError('L\'adresse de l\'entreprise est requis.')
        return
      }
      if(!employeeCount || parseInt(employeeCount) < 1){
        setError('Le nombre d\'employés doit être au moins 1.')
        return
      }
      const list = employeeList.slice(0, n)
      const namesOk = list.every(e => (e.full_name || '').trim())
      if (!namesOk || list.length !== n) {
        setError('Veuillez indiquer le nom complet de chaque employé (' + n + ' nom(s) requis).')
        return
      }
    }

    setLoading(true)

    try{
      if(accountType === 'client'){
        // Inscription client
        const response = await register(email, password, name)
        router.push('/client')
      } else {
        // Inscription entreprise - demande d'approbation
        console.log('📤 Envoi demande entreprise...', {
          name, email, companyName, institutionType, companyPhone, companyAddress, employeeCount
        })
        const employees = employeeList.slice(0, n).map(e => ({
          full_name: (e.full_name || '').trim(),
          matricule: (e.matricule || '').trim() || undefined,
          function: (e.function || '').trim() || undefined,
          phone: (e.phone || '').trim() || undefined,
        })).filter(e => e.full_name)
        const result = await registerCompany(name, email, password, {
          companyName,
          institutionType,
          companyPhone,
          companyAddress,
          employeeCount: parseInt(employeeCount),
          employees,
        })
        console.log('✅ Réponse:', result)
        pushToast({ type: 'success', message: 'Demande d\'accès B2B envoyée! Un administrateur examinera votre demande.' })
        router.push('/login')
      }
    }catch(err){
      console.error('❌ Erreur inscription:', err)
      setError(err?.data?.message || err?.message || 'Erreur lors de l\'inscription.')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#1a2942] to-[#0b1220] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-gradient-to-br from-[#0f1629]/95 to-[#1a2a4a]/95 border border-[#d4af37]/30 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f5e08a] bg-clip-text text-transparent mb-2">Green Express</h1>
            <p className="text-[#d4af37]/80 text-lg">Bienvenue</p>
          </div>

          {error && (
            <div className="mb-6">
              <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg whitespace-pre-wrap">
                <div className="font-bold mb-2">❌ Erreur:</div>
                <div className="text-sm">{error}</div>
              </div>
              {error.includes('Impossible de contacter le serveur') && (
                <div className="mt-3 p-3 bg-amber-900/30 border border-amber-600/50 rounded-lg text-amber-200 text-sm">
                  <p className="font-semibold mb-1">À vérifier :</p>
                  <p>1. Démarrer le backend dans un terminal : <code className="bg-black/30 px-1 rounded">cd backend && php artisan serve</code></p>
                  <p>2. Vérifier que <code className="bg-black/30 px-1 rounded">NEXT_PUBLIC_API_URL</code> dans <code className="bg-black/30 px-1 rounded">frontend-next\.env.local</code> pointe vers l’API (ex. http://localhost:8000).</p>
                  <button type="button" onClick={() => { setError(''); }} className="mt-2 text-cyan-400 hover:text-cyan-300 underline">Réessayer après avoir démarré l’API</button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={submit} className="space-y-6">
            {/* Account Type Selection - Card Layout */}
            <div>
              <label className="block text-white text-lg font-bold mb-4">Quel type de compte voulez-vous?</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Card */}
                <label className={`flex flex-col p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  accountType === 'client' 
                    ? 'border-[#d4af37] bg-[#d4af37]/10' 
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                }`}>
                  <input
                    type="radio"
                    name="accountType"
                    value="client"
                    checked={accountType === 'client'}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-white font-bold text-base mb-3">👤 Client individuel</span>
                  <span className="text-white/70 text-sm leading-relaxed">Commander des repas, accumuler des points et réclamer des promotions</span>
                </label>

                {/* Entreprise Card */}
                <label className={`flex flex-col p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  accountType === 'entreprise' 
                    ? 'border-[#d4af37] bg-[#d4af37]/10' 
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                }`}>
                  <input
                    type="radio"
                    name="accountType"
                    value="entreprise"
                    checked={accountType === 'entreprise'}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-white font-bold text-base mb-3">🏢 Entreprise (B2B)</span>
                  <span className="text-white/70 text-sm leading-relaxed">Enregistrer votre structure pour commander en volume et créer des agents</span>
                </label>
              </div>
            </div>

            <hr className="border-white/10" />

            {/* Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-white text-sm font-semibold mb-2">Nom complet</label>
                <input
                  type="text"
                  placeholder="Votre nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#d4af37] transition"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#d4af37] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-white text-sm font-semibold mb-2">Mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#d4af37] transition"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-semibold mb-2">Confirmer le mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#d4af37] transition"
                />
              </div>
            </div>

            {/* Entreprise Fields */}
            {accountType === 'entreprise' && (
              <div className="bg-gradient-to-br from-blue-900/30 to-blue-900/10 border border-blue-500/30 rounded-xl p-6">
                <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-3">
                  🏢 Informations de l'entreprise
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm font-semibold mb-2">Nom de l'entreprise</label>
                      <input
                        type="text"
                        placeholder="ex: Microsoft Kinshasa"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-semibold mb-2">Type d'institution</label>
                      <select
                        value={institutionType}
                        onChange={(e) => setInstitutionType(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                      >
                        <option value="privee">Entreprise Privée</option>
                        <option value="etat">État / Gouvernement</option>
                        <option value="hopital">Hôpital</option>
                        <option value="ecole">École</option>
                        <option value="universite">Université</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm font-semibold mb-2">Téléphone</label>
                      <input
                        type="tel"
                        placeholder="+243 970 123 456"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-semibold mb-2">Nombre d'employés</label>
                      <input
                        type="number"
                        placeholder="ex: 25"
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(e.target.value)}
                        min="1"
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  {n > 0 && (
                    <div>
                      <label className="block text-white text-sm font-semibold mb-2">Liste des agents ({n} agent{n > 1 ? 's' : ''}) — nom, matricule, fonction, téléphone</label>
                      <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                        {employeeList.map((emp, i) => (
                          <div key={i} className="p-3 rounded-lg border border-white/20 bg-white/5 space-y-2">
                            <span className="text-white/70 text-xs font-medium">Agent {i + 1}</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Nom complet *"
                                value={emp.full_name}
                                onChange={(e) => {
                                  const next = [...employeeList]
                                  next[i] = { ...next[i], full_name: e.target.value }
                                  setEmployeeList(next)
                                }}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition text-sm"
                              />
                              <input
                                type="text"
                                placeholder="Matricule"
                                value={emp.matricule}
                                onChange={(e) => {
                                  const next = [...employeeList]
                                  next[i] = { ...next[i], matricule: e.target.value }
                                  setEmployeeList(next)
                                }}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition text-sm"
                              />
                              <input
                                type="text"
                                placeholder="Fonction"
                                value={emp.function}
                                onChange={(e) => {
                                  const next = [...employeeList]
                                  next[i] = { ...next[i], function: e.target.value }
                                  setEmployeeList(next)
                                }}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition text-sm"
                              />
                              <input
                                type="text"
                                placeholder="Téléphone"
                                value={emp.phone}
                                onChange={(e) => {
                                  const next = [...employeeList]
                                  next[i] = { ...next[i], phone: e.target.value }
                                  setEmployeeList(next)
                                }}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition text-sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">Adresse complète</label>
                    <input
                      type="text"
                      placeholder="ex: Avenue de la Paix, Kinshasa"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="mt-5 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <p className="text-cyan-200 text-sm leading-relaxed">
                    ℹ️ Votre demande sera examinée par nos administrateurs dans 24-48 heures. Vous serez contacté à l'email fourni.
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#d4af37] to-[#f5e08a] text-[#0b1220] font-bold py-3 rounded-lg hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Création en cours...' : `Créer un compte ${accountType === 'entreprise' ? 'entreprise' : accountType === 'agent' ? 'agent' : 'client'}`}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-white/70 text-sm">
              Déjà inscrit?{' '}
              <Link href="/login" className="text-[#d4af37] hover:text-[#f5e08a] font-semibold">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

