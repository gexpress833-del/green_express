"use client"
import { useState, useEffect } from 'react'
import { register, registerCompany } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getApiErrorMessage } from '@/lib/api'
import { isValidEmail, isValidPassword } from '@/lib/helpers'
import { pushToast } from '@/components/Toaster'
import PasswordInput from '@/components/PasswordInput'
import styles from './register.module.css'

export default function RegisterPage() {
  const [accountType, setAccountType] = useState('client')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [institutionType, setInstitutionType] = useState('privee')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [employeeCount, setEmployeeCount] = useState('')
  const [employeeList, setEmployeeList] = useState([])

  const router = useRouter()
  const { refreshUser } = useAuth()

  const enterpriseSlots = (() => {
    if (accountType !== 'entreprise') return 0
    const raw = parseInt(employeeCount, 10)
    return Math.max(1, Number.isFinite(raw) && raw > 0 ? raw : 1)
  })()

  useEffect(() => {
    if (accountType !== 'entreprise') {
      setEmployeeList([])
      return
    }
    const n = enterpriseSlots
    setEmployeeList((prev) => {
      const next = [...prev]
      while (next.length < n) next.push({ full_name: '', matricule: '', function: '', phone: '' })
      return next.slice(0, n).map((e, i) => ({
        ...e,
        full_name: e.full_name || '',
        matricule: e.matricule || '',
        function: e.function || '',
        phone: e.phone || '',
      }))
    })
  }, [accountType, enterpriseSlots])

  async function submit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Le nom est requis.')
      return
    }

    if (!isValidEmail(email)) {
      setError('Veuillez entrer un email valide.')
      return
    }

    if (!isValidPassword(password)) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    if (accountType === 'client') {
      if (!clientPhone.trim()) {
        setError('Le numéro de téléphone mobile est obligatoire.')
        return
      }
    }

    if (accountType === 'entreprise') {
      if (!companyName.trim()) {
        setError("Le nom de l'entreprise est requis.")
        return
      }
      if (!companyPhone.trim()) {
        setError("Le téléphone de l'entreprise est requis.")
        return
      }
      if (!companyAddress.trim()) {
        setError("L'adresse du siège est requise pour la demande B2B.")
        return
      }
      const empCount = parseInt(employeeCount, 10) || 1
      const list = employeeList.slice(0, empCount)
      const namesOk = list.every((row) => (row.full_name || '').trim())
      if (!namesOk || list.length !== empCount) {
        setError('Indiquez le nom complet de chaque personne à enregistrer (' + empCount + ' ligne(s)).')
        return
      }
    }

    setLoading(true)

    try {
      if (accountType === 'client') {
        await register(email, password, name, clientPhone.trim())
        await refreshUser()
        router.push('/client')
      } else {
        const empCount = parseInt(employeeCount, 10) || 1
        const employees = employeeList
          .slice(0, empCount)
          .map((row) => ({
            full_name: (row.full_name || '').trim(),
            matricule: (row.matricule || '').trim() || undefined,
            function: (row.function || '').trim() || undefined,
            phone: (row.phone || '').trim() || undefined,
          }))
          .filter((row) => row.full_name)

        await registerCompany(name, email, password, {
          companyName,
          institutionType,
          companyPhone,
          companyAddress,
          employeeCount: empCount,
          employees,
        })
        pushToast({
          type: 'success',
          message: "Demande d'accès B2B envoyée ! Un administrateur examinera votre demande.",
        })
        router.push('/login')
      }
    } catch (err) {
      setError(getApiErrorMessage(err) || "Erreur lors de l'inscription.")
    } finally {
      setLoading(false)
    }
  }

  const formTheme = accountType === 'client' ? styles.formClient : styles.formEntreprise
  const clientCardClass =
    `${styles.accountOption} ${accountType === 'client' ? styles.accountOptionActiveClient : ''}`
  const entrepriseCardClass =
    `${styles.accountOption} ${accountType === 'entreprise' ? styles.accountOptionActiveEntreprise : ''}`
  const submitClass =
    `${styles.submit} ${accountType === 'client' ? styles.submitClient : styles.submitEntreprise}`

  return (
    <div className={styles.shell}>
      <div className={styles.ambient} aria-hidden />
      <div className={styles.gridFloor} aria-hidden />
      <div className={styles.vignette} aria-hidden />

      <div className={styles.card}>
        <div className={styles.cardGlow} aria-hidden />
        <div className={styles.neonTop} aria-hidden />

        <div style={{ textAlign: 'center' }}>
          <p className={styles.badge}>Inscription</p>
          <h1 className={styles.titleGradient}>Green Express</h1>
          <p className={styles.subtitle}>Créez votre compte en moins d&apos;une minute.</p>
        </div>

        <h2 className={styles.introHeading}>Comment souhaitez-vous utiliser Green Express ?</h2>
        <div className={styles.introHelp}>
          <ul className={styles.introHelpList}>
            <li>
              <span className={styles.introHelpClient}>Client</span>
              <span>pour commander vos repas et gérer vos abonnements.</span>
            </li>
            <li>
              <span className={styles.introHelpEntreprise}>Entreprise</span>
              <span>pour gérer une équipe, le budget et les repas en volume.</span>
            </li>
          </ul>
        </div>

        {error && (
          <div className={styles.alert} role="alert">
            <div className={styles.alertTitle}>Erreur</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
            {error.includes('Impossible de contacter le serveur') && (
              <div className={styles.hintBox}>
                <p style={{ margin: '0 0 0.35rem' }}>
                  Le service est momentanément indisponible. Vérifiez votre connexion Internet et réessayez dans quelques instants.
                </p>
                {process.env.NODE_ENV !== 'production' && (
                  <>
                    <p style={{ margin: '0.5rem 0 0.35rem', fontWeight: 600, fontSize: 12, opacity: 0.7 }}>Dev :</p>
                    <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
                      1. <code>cd backend</code> + <code>php artisan serve</code>
                      <br />2. <code>frontend-next/.env.local</code> : <code>NEXT_PUBLIC_API_URL</code> + <code>API_PROXY_TARGET</code>.
                    </p>
                  </>
                )}
                <button type="button" className={styles.retryBtn} onClick={() => setError('')}>
                  Fermer ce message
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={submit} className={`${styles.form} ${formTheme}`} noValidate>
          <div>
            <span className={styles.sectionLabel}>Choisir un parcours</span>
            <div className={styles.accountGrid}>
              <button
                type="button"
                className={clientCardClass}
                onClick={() => setAccountType('client')}
                aria-pressed={accountType === 'client'}
              >
                <span className={styles.accountRadio} aria-hidden>
                  <span className={styles.accountRadioDot} />
                </span>
                <span className={styles.accountBody}>
                  <span className={styles.accountTitle}>👤 Utiliser pour mes repas</span>
                  <span className={styles.accountDesc}>
                    Commander des repas, s&apos;abonner et payer facilement.
                  </span>
                </span>
              </button>
              <button
                type="button"
                className={entrepriseCardClass}
                onClick={() => setAccountType('entreprise')}
                aria-pressed={accountType === 'entreprise'}
              >
                <span className={styles.accountRadio} aria-hidden>
                  <span className={styles.accountRadioDot} />
                </span>
                <span className={styles.accountBody}>
                  <span className={styles.accountTitle}>🏢 Gérer une équipe / entreprise</span>
                  <span className={styles.accountDesc}>
                    Ajouter des employés, gérer le budget et suivre les repas.
                  </span>
                </span>
              </button>
            </div>
          </div>

          <hr className={styles.divider} />

          {accountType === 'client' && (
            <>
              <p className={styles.formSectionTitle}>Vos informations</p>
              <div>
                <label htmlFor="reg-name" className={styles.label}>
                  Nom complet
                </label>
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Nom complet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={styles.fieldInput}
                />
              </div>
              <div>
                <label htmlFor="reg-email" className={styles.label}>
                  E-mail
                </label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={styles.fieldInput}
                />
              </div>
              <div>
                <label htmlFor="reg-phone" className={styles.label}>
                  Téléphone mobile <span style={{ color: 'rgba(251, 113, 133, 0.95)' }}>*</span>
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="08… / 09… / +243…"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  required
                  className={styles.fieldInput}
                />
                <p className={styles.hint}>
                  Format RDC : 08… ou +243… (sert aussi pour la connexion).
                </p>
              </div>
              <div>
                <label htmlFor="reg-password" className={styles.label}>
                  Mot de passe
                </label>
                <PasswordInput
                  id="reg-password"
                  autoComplete="new-password"
                  placeholder="Au moins 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={styles.fieldInput}
                />
                <p className={styles.hint}>Choisissez 8 caractères minimum, idéalement avec chiffres et lettres.</p>
              </div>
              <div>
                <label htmlFor="reg-password2-client" className={styles.label}>
                  Confirmer le mot de passe
                </label>
                <PasswordInput
                  id="reg-password2-client"
                  autoComplete="new-password"
                  placeholder="Retapez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={styles.fieldInput}
                />
              </div>
            </>
          )}

          {accountType === 'entreprise' && (
            <div className={styles.enterprisePanel}>
              <h3 className={styles.enterpriseTitle}>
                <span aria-hidden>🏢</span> Entreprise & contact
              </h3>

              <div className={styles.row2}>
                <div>
                  <label htmlFor="reg-co-name" className={styles.label}>
                    Nom de l&apos;entreprise
                  </label>
                  <input
                    id="reg-co-name"
                    type="text"
                    autoComplete="organization"
                    placeholder="Raison sociale"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className={styles.fieldInput}
                  />
                </div>
                <div>
                  <label htmlFor="reg-name" className={styles.label}>
                    Nom du responsable
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Nom complet"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={styles.fieldInput}
                  />
                </div>
              </div>

              <div className={styles.row2}>
                <div>
                  <label htmlFor="reg-email" className={styles.label}>
                    E-mail professionnel
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    placeholder="contact@entreprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={styles.fieldInput}
                  />
                </div>
                <div>
                  <label htmlFor="reg-co-phone" className={styles.label}>
                    Téléphone entreprise
                  </label>
                  <input
                    id="reg-co-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+243 …"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    required
                    className={styles.fieldInput}
                  />
                </div>
              </div>

              <div className={styles.row2}>
                <div>
                  <label htmlFor="reg-password" className={styles.label}>
                    Mot de passe
                  </label>
                  <PasswordInput
                    id="reg-password"
                    autoComplete="new-password"
                    placeholder="Au moins 8 caractères"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={styles.fieldInput}
                  />
                </div>
                <div>
                  <label htmlFor="reg-password2" className={styles.label}>
                    Confirmer le mot de passe
                  </label>
                  <PasswordInput
                    id="reg-password2"
                    autoComplete="new-password"
                    placeholder="Retapez votre mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={styles.fieldInput}
                  />
                </div>
              </div>

              <div className={styles.detailsBlock}>
                <p className={styles.detailsBlockTitle}>Détails pour la demande B2B</p>
                <p className={styles.detailsBlockLead}>
                  Ces informations sont nécessaires pour valider votre structure auprès de nos équipes (même parcours
                  qu&apos;avant côté serveur).
                </p>

                <div className={styles.row2}>
                  <div>
                    <label htmlFor="reg-co-type" className={styles.label}>
                      Type d&apos;institution
                    </label>
                    <select
                      id="reg-co-type"
                      value={institutionType}
                      onChange={(e) => setInstitutionType(e.target.value)}
                      className={styles.fieldSelect}
                    >
                      <option value="privee">Entreprise privée</option>
                      <option value="etat">État / Gouvernement</option>
                      <option value="hopital">Hôpital</option>
                      <option value="ecole">École</option>
                      <option value="universite">Université</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="reg-co-n" className={styles.label}>
                      Nombre d&apos;employés (optionnel)
                    </label>
                    <input
                      id="reg-co-n"
                      type="number"
                      min="1"
                      placeholder="1 par défaut"
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(e.target.value)}
                      className={styles.fieldInput}
                    />
                    <p className={styles.hint}>Si vide, nous enregistrons 1 ligne (modifiable ensuite avec l&apos;admin).</p>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <label htmlFor="reg-co-addr" className={styles.label}>
                    Adresse du siège
                  </label>
                  <input
                    id="reg-co-addr"
                    type="text"
                    autoComplete="street-address"
                    placeholder="Avenue, quartier, ville…"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    required
                    className={styles.fieldInput}
                  />
                </div>

                {enterpriseSlots > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <span className={styles.label} style={{ display: 'block', marginBottom: '0.65rem' }}>
                      Personnes à enregistrer ({enterpriseSlots}) — nom complet requis
                    </span>
                    <div className={styles.employeeScroll}>
                      {employeeList.map((emp, i) => (
                        <div key={i} className={styles.employeeCard}>
                          <span className={styles.employeeLabel}>Personne {i + 1}</span>
                          <div className={styles.grid2}>
                            <input
                              type="text"
                              placeholder="Nom complet *"
                              value={emp.full_name}
                              onChange={(e) => {
                                const next = [...employeeList]
                                next[i] = { ...next[i], full_name: e.target.value }
                                setEmployeeList(next)
                              }}
                              className={styles.inputSm}
                            />
                            <input
                              type="text"
                              placeholder="Matricule (optionnel)"
                              value={emp.matricule}
                              onChange={(e) => {
                                const next = [...employeeList]
                                next[i] = { ...next[i], matricule: e.target.value }
                                setEmployeeList(next)
                              }}
                              className={styles.inputSm}
                            />
                            <input
                              type="text"
                              placeholder="Fonction (optionnel)"
                              value={emp.function}
                              onChange={(e) => {
                                const next = [...employeeList]
                                next[i] = { ...next[i], function: e.target.value }
                                setEmployeeList(next)
                              }}
                              className={styles.inputSm}
                            />
                            <input
                              type="text"
                              placeholder="Téléphone (optionnel)"
                              value={emp.phone}
                              onChange={(e) => {
                                const next = [...employeeList]
                                next[i] = { ...next[i], phone: e.target.value }
                                setEmployeeList(next)
                              }}
                              className={styles.inputSm}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className={styles.infoNote}>
                  Délai indicatif de traitement : 24 à 48 h. Vous serez contacté à l&apos;e-mail indiqué.
                </p>
              </div>
            </div>
          )}

          <p className={styles.trustLine}>⚡ Inscription rapide — moins d&apos;une minute pour commencer.</p>
          {accountType === 'entreprise' && (
            <p className={`${styles.trustLine} ${styles.trustLineEntreprise}`}>
              ✔ Idéal pour les entreprises avec plusieurs employés et la commande en volume.
            </p>
          )}

          <button type="submit" disabled={loading} className={submitClass}>
            {loading
              ? 'En cours…'
              : accountType === 'entreprise'
                ? 'Envoyer la demande B2B'
                : 'Créer mon compte'}
          </button>
        </form>

        <div className={styles.footer}>
          Déjà inscrit ?{' '}
          <Link href="/login" className={styles.link}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  )
}
