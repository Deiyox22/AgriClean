import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, CheckCircle, Phone, Mail, MapPin, Send,
  Users, Download, ChevronDown, Star,
  Shield, Clock, FileText, Truck,
} from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import { supabase, toDb } from '../../lib/supabase'
import { usePWAInstall } from '../../hooks/usePWAInstall'

// ── Données ───────────────────────────────────────────────────────────────────

const STATS = [
  { value: '12+', label: 'ans d\'expérience' },
  { value: '320+', label: 'élevages accompagnés' },
  { value: '48h', label: 'délai d\'intervention' },
  { value: '98%', label: 'clients satisfaits' },
]

const SERVICES = [
  {
    emoji: '🥚',
    title: 'Ramassage d\'œufs',
    desc: 'Collecte régulière et sécurisée dans vos bâtiments avicoles. Tournées planifiées, traçabilité complète, rapport après chaque passage.',
    tags: ['Hebdomadaire', 'Bimensuel', 'Mensuel'],
    color: 'from-amber-50 to-orange-50 border-amber-200',
    dot: 'bg-amber-400',
  },
  {
    emoji: '🌿',
    title: 'Nettoyage agricole',
    desc: 'Désinfection haute pression de vos bâtiments d\'élevage, poulaillers et stabulations. Produits homologués, vide sanitaire respecté.',
    tags: ['Haute pression', 'Désinfection', 'Protocole HACCP'],
    color: 'from-green-50 to-emerald-50 border-green-200',
    dot: 'bg-green-500',
  },
  {
    emoji: '🏭',
    title: 'Nettoyage industriel',
    desc: 'Intervention sur sites de transformation, abattoirs et ateliers. Équipes qualifiées, disponibles le week-end et jours fériés.',
    tags: ['Abattoirs', 'Ateliers', 'Week-end'],
    color: 'from-blue-50 to-sky-50 border-blue-200',
    dot: 'bg-blue-500',
  },
]

const ENGAGEMENTS = [
  { icon: Clock,    title: 'Réactivité garantie',  desc: 'Réponse sous 2h, intervention sous 48h pour toute demande urgente.' },
  { icon: Shield,   title: 'Personnel certifié',    desc: 'Tous nos agents sont formés aux protocoles sanitaires et équipés du matériel réglementaire.' },
  { icon: FileText, title: 'Compte-rendu systématique', desc: 'Rapport détaillé après chaque intervention, accessible dans votre espace client.' },
  { icon: Truck,    title: 'Matériel adapté',       desc: 'Véhicules et équipements spécialisés pour chaque type d\'exploitation.' },
]

const AVIS = [
  { nom: 'Pierre L.', role: 'Éleveur avicole — Côtes-d\'Armor', note: 5, texte: 'Service impeccable depuis 3 ans. Les équipes sont ponctuelles, sérieuses et les rapports m\'aident à suivre mes bâtiments.' },
  { nom: 'Marie-Claude D.', role: 'GAEC — Ille-et-Vilaine', note: 5, texte: 'Intervention rapide pour un nettoyage d\'urgence. Résultat parfait, tarif honnête. Je recommande.' },
  { nom: 'Sébastien R.', role: 'Directeur — Site industriel', note: 5, texte: 'Protocoles HACCP parfaitement respectés. Le suivi via l\'espace client est un vrai plus pour nos audits.' },
]

// ── Formulaire de contact ─────────────────────────────────────────────────────

function ContactForm() {
  const [form, setForm]     = useState({ name: '', email: '', phone: '', service: 'ramassage', message: '' })
  const [sent, setSent]     = useState(false)
  const [sending, setSending] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await supabase.from('contacts').insert(toDb({ ...form, createdAt: new Date().toISOString() }))
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-slate-400'

  if (sent) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
        <CheckCircle size={36} className="text-green-600" />
      </div>
      <p className="text-2xl font-black text-slate-900">Message reçu !</p>
      <p className="text-slate-500 mt-2 max-w-xs">Nous vous répondons dans les 24h.</p>
      <button onClick={() => setSent(false)} className="mt-6 text-sm font-semibold text-primary underline underline-offset-4">
        Envoyer un autre message
      </button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nom complet *</label>
          <input required className={inputCls} placeholder="Jean Dupont" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Téléphone *</label>
          <input required type="tel" className={inputCls} placeholder="06 00 00 00 00" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email *</label>
        <input required type="email" className={inputCls} placeholder="vous@exploitation.fr" value={form.email} onChange={e => set('email', e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Prestation souhaitée</label>
        <select className={inputCls} value={form.service} onChange={e => set('service', e.target.value)}>
          <option value="ramassage">Ramassage d'œufs</option>
          <option value="nettoyage_agricole">Nettoyage agricole</option>
          <option value="nettoyage_industriel">Nettoyage industriel</option>
          <option value="autre">Autre / Je ne sais pas encore</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Votre message</label>
        <textarea rows={4} className={inputCls} placeholder="Décrivez votre exploitation, vos contraintes, la fréquence souhaitée…" value={form.message} onChange={e => set('message', e.target.value)} />
      </div>
      <button type="submit" disabled={sending}
        className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50">
        <Send size={17} /> {sending ? 'Envoi en cours…' : 'Envoyer ma demande'}
      </button>
      <p className="text-center text-xs text-slate-400">Réponse garantie sous 24h · Devis gratuit et sans engagement</p>
    </form>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function Landing() {
  const { isInstallable, install } = usePWAInstall()
  const contactRef = useRef(null)

  const scrollToContact = () => contactRef.current?.scrollIntoView({ behavior: 'smooth' })

  return (
    <PublicLayout>

      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex items-center bg-[#0f2318] overflow-hidden">
        {/* Texture / ambient */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(ellipse at 10% 60%, rgba(45,106,79,0.5) 0%, transparent 60%), radial-gradient(ellipse at 90% 20%, rgba(217,119,6,0.15) 0%, transparent 50%)',
          }} />
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />

        <div className="relative max-w-3xl mx-auto px-6 py-24 w-full text-center">

          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs font-semibold text-white/80 uppercase tracking-widest mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
            <span>Bretagne &amp; Grand Ouest</span>
          </span>

          {/* Titre */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.05] mb-6">
            L'hygiène de vos élevages,{' '}
            <span className="text-amber-400">notre priorité.</span>
          </h1>

          {/* Sous-titre */}
          <p className="text-base sm:text-lg text-white/65 leading-relaxed mb-10 max-w-xl mx-auto">
            Ramassage d'œufs et nettoyage agricole & industriel depuis plus de 12 ans.
            Des équipes formées, un suivi rigoureux, des résultats que vous pouvez mesurer.
          </p>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={scrollToContact}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-400 transition-colors shadow-xl shadow-amber-900/30 text-base">
              Demander un devis <ArrowRight size={18} />
            </button>
            <Link to="/connexion"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-2xl hover:bg-white/20 transition-colors text-base">
              <Users size={17} /> Se connecter
            </Link>
            {isInstallable && (
              <button onClick={install}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-white/10 border border-white/20 text-white/70 font-semibold rounded-2xl hover:bg-white/20 transition-colors text-sm">
                <Download size={16} /> Installer l'app
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 pt-10 border-t border-white/10">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-black text-white font-mono">{value}</p>
                <p className="text-white/50 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={24} className="text-white/30" />
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="py-24 px-4 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-primary font-semibold text-xs uppercase tracking-widest">Ce que nous faisons</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-2">Trois expertises, une seule équipe</h2>
            <p className="text-slate-500 mt-3 max-w-lg mx-auto text-sm leading-relaxed">
              Chaque prestation est adaptée aux contraintes spécifiques de votre exploitation et aux réglementations en vigueur.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <div key={s.title} className={`relative bg-gradient-to-br ${s.color} border rounded-3xl p-7 flex flex-col gap-4 hover:shadow-lg transition-shadow`}>
                <div className="text-5xl">{s.emoji}</div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{s.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mt-2">{s.desc}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {s.tags.map(t => (
                    <span key={t} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white/70 rounded-full px-2.5 py-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-xs uppercase tracking-widest">Simple & transparent</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">Comment ça marche ?</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { num: '01', title: 'Demande de devis', desc: 'Remplissez le formulaire en bas de page. Nous vous recontactons sous 24h avec une proposition adaptée.' },
              { num: '02', title: 'Planification',    desc: 'On définit ensemble les dates, fréquences et protocoles. Vous recevez un accès à votre espace client.' },
              { num: '03', title: 'Suivi en temps réel', desc: 'Rapport après chaque passage, facturation en ligne, messagerie directe avec notre équipe.' },
            ].map((step) => (
              <div key={step.num} className="relative p-6 bg-stone-50 rounded-2xl border border-stone-100">
                <p className="text-5xl font-black text-primary/10 mb-3">{step.num}</p>
                <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENGAGEMENTS ── */}
      <section className="py-20 px-4 bg-primary">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white">Nos engagements qualité</h2>
            <p className="text-white/60 mt-2 text-sm">Ce qui nous différencie sur le terrain</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ENGAGEMENTS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/10 border border-white/15 rounded-2xl p-5">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className="font-bold text-white text-sm mb-1.5">{title}</h3>
                <p className="text-white/60 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVIS ── */}
      <section className="py-20 px-4 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-xs uppercase tracking-widest">Témoignages</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">Ce que disent nos clients</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {AVIS.map((a) => (
              <div key={a.nom} className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: a.note }).map((_, i) => (
                    <Star key={i} size={14} fill="#f59e0b" className="text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed italic mb-4">« {a.texte} »</p>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{a.nom}</p>
                  <p className="text-slate-400 text-xs">{a.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECRUTEMENT ── */}
      <section className="py-14 px-4 bg-amber-500">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-black text-white">Vous cherchez un emploi dans l'agriculture ?</h2>
            <p className="text-white/80 mt-1 text-sm">Chauffeurs, agents de nettoyage, profils polyvalents — nous recrutons en CDI et CDD.</p>
          </div>
          <Link to="/candidats"
            className="shrink-0 flex items-center gap-2 px-6 py-3.5 bg-white text-amber-600 font-bold rounded-2xl hover:bg-amber-50 transition-colors shadow-md whitespace-nowrap">
            Voir les offres <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section ref={contactRef} id="contact" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Infos */}
            <div>
              <span className="text-primary font-semibold text-xs uppercase tracking-widest">Devis gratuit</span>
              <h2 className="text-4xl font-black text-slate-900 mt-2 mb-4 leading-tight">
                Parlons de votre exploitation
              </h2>
              <p className="text-slate-500 leading-relaxed mb-8 text-sm">
                Chaque exploitation est unique. Décrivez-nous votre situation et nous vous proposerons une solution sur-mesure, sans engagement.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: Phone, label: 'Téléphone', value: '04 66 00 11 22', href: 'tel:0466001122' },
                  { icon: Mail,  label: 'Email',     value: 'contact@agriclean.fr', href: 'mailto:contact@agriclean.fr' },
                  { icon: MapPin,label: 'Zone d\'intervention', value: 'Côtes-d\'Armor · Ille-et-Vilaine · Morbihan · Finistère', href: null },
                ].map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                      <Icon size={17} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                      {href
                        ? <a href={href} className="font-semibold text-slate-800 hover:text-primary transition-colors text-sm">{value}</a>
                        : <p className="font-semibold text-slate-800 text-sm">{value}</p>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Formulaire */}
            <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
