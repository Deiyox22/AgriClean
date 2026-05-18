import { useState } from 'react'
import { CheckCircle, Send, Briefcase, Truck, Wrench, Star } from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import { useApplicationStore } from '../../store/useApplicationStore'

const positions = [
  {
    icon: Truck,
    title: 'Chauffeur PL/SPL',
    type: 'CDI',
    desc: 'Transport de matériel et conduite de véhicules agricoles. Permis C/CE obligatoire.',
    tags: ['Permis C/CE', 'Déplacements régionaux', '35h+'],
    value: 'chauffeur',
  },
  {
    icon: Wrench,
    title: 'Agent de nettoyage agricole',
    type: 'CDI / CDD',
    desc: 'Nettoyage de bâtiments agricoles et exploitation avicoles. Débutant accepté, formation assurée.',
    tags: ['Formation assurée', 'Débutant accepté', 'Équipe soudée'],
    value: 'nettoyage',
  },
  {
    icon: Star,
    title: 'Agent polyvalent',
    type: 'CDI',
    desc: 'Ramassage d\'œufs et nettoyage selon les besoins. Poste varié avec forte autonomie.',
    tags: ['Polyvalence', 'Autonomie', 'Prime activité'],
    value: 'polyvalent',
  },
  {
    icon: Briefcase,
    title: 'Candidature spontanée',
    type: 'Tout contrat',
    desc: 'Votre profil ne correspond pas à nos offres actuelles ? Envoyez-nous votre candidature, nous la conservons.',
    tags: ['Profil libre', 'Base de données', 'Contact direct'],
    value: 'spontanee',
  },
]

const advantages = [
  { icon: '💰', label: 'Salaire compétitif', desc: 'Rémunération selon expérience + primes d\'activité.' },
  { icon: '🚗', label: 'Véhicule fourni', desc: 'Véhicule de service mis à disposition pour les déplacements.' },
  { icon: '📚', label: 'Formation continue', desc: 'Formation aux protocoles sanitaires et nouvelles techniques.' },
  { icon: '👥', label: 'Ambiance d\'équipe', desc: 'Petite structure à taille humaine, esprit d\'équipe fort.' },
]

function ApplicationForm() {
  const add = useApplicationStore((s) => s.add)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', position: 'chauffeur', message: '',
  })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await add(form)
      const subject = encodeURIComponent(`Candidature — ${form.firstName} ${form.lastName} (${form.position})`)
      const body = encodeURIComponent(
        `Nom : ${form.firstName} ${form.lastName}\nEmail : ${form.email}\nTél : ${form.phone}\nPoste : ${form.position}\n\nMotivation :\n${form.message}`
      )
      window.location.href = `mailto:contact@agriclean.fr?subject=${subject}&body=${body}`
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-colors'
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1.5'

  if (sent) return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle size={32} className="text-green-600" />
      </div>
      <p className="text-xl font-bold text-slate-900">Candidature envoyée !</p>
      <p className="text-slate-500 mt-2 max-w-xs">Nous avons bien reçu votre candidature. Nous vous contacterons dans les meilleurs délais.</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className={labelCls}>Prénom *</label><input required className={inputCls} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Jean" /></div>
        <div><label className={labelCls}>Nom *</label><input required className={inputCls} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Martin" /></div>
        <div><label className={labelCls}>Email *</label><input required type="email" className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="jean@email.fr" /></div>
        <div><label className={labelCls}>Téléphone *</label><input required type="tel" className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="06 00 00 00 00" /></div>
      </div>
      <div>
        <label className={labelCls}>Poste souhaité *</label>
        <select required className={inputCls} value={form.position} onChange={(e) => set('position', e.target.value)}>
          {positions.map((p) => <option key={p.value} value={p.value}>{p.title}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Lettre de motivation *</label>
        <textarea required rows={5} className={inputCls} value={form.message} onChange={(e) => set('message', e.target.value)}
          placeholder="Présentez-vous brièvement : votre expérience, vos motivations, vos disponibilités…" />
      </div>
      <button type="submit" disabled={sending}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-colors disabled:opacity-50">
        <Send size={18} /> {sending ? 'Envoi en cours…' : 'Envoyer ma candidature'}
      </button>
      <p className="text-xs text-slate-400 text-center">Votre candidature sera transmise par email et conservée dans notre base.</p>
    </form>
  )
}

export default function CandidatPortal() {
  const [selectedPosition, setSelectedPosition] = useState(null)

  const scrollToForm = (pos) => {
    setSelectedPosition(pos)
    document.getElementById('candidature')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-[#2d6a4f] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold tracking-widest uppercase mb-4">
            Nous recrutons
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Rejoignez l'équipe AgriClean</h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            Une structure à taille humaine, des missions variées sur le terrain, et une vraie ambiance d'équipe.
          </p>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-slate-900 text-center mb-8">Pourquoi rejoindre AgriClean ?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {advantages.map((a) => (
              <div key={a.label} className="bg-slate-50 rounded-2xl p-5 text-center border border-slate-100">
                <div className="text-3xl mb-2">{a.icon}</div>
                <p className="font-bold text-slate-900 text-sm">{a.label}</p>
                <p className="text-slate-500 text-xs mt-1">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offres */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Nos offres</h2>
          <p className="text-slate-500 mb-8">Cliquez sur une offre pour postuler directement.</p>
          <div className="grid sm:grid-cols-2 gap-5">
            {positions.map((pos) => {
              const Icon = pos.icon
              return (
                <div key={pos.value} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => scrollToForm(pos.value)}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                      <Icon size={22} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-900">{pos.title}</h3>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium shrink-0">{pos.type}</span>
                      </div>
                      <p className="text-slate-500 text-sm mt-1 mb-3">{pos.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {pos.tags.map((t) => <span key={t} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{t}</span>)}
                      </div>
                    </div>
                  </div>
                  <button className="mt-4 w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors">
                    Postuler →
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Form */}
      <section id="candidature" className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Déposer ma candidature</h2>
          <p className="text-slate-500 mb-8">Remplissez le formulaire ci-dessous. Nous vous recontacterons dans les 48h.</p>
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <ApplicationForm />
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
