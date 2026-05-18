import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, ArrowRight, Mail, Phone, MapPin, Send } from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import { db } from '../../db/db'

const services = [
  {
    icon: '🥚',
    title: 'Ramassage d\'œufs',
    subtitle: 'Élevages avicoles',
    desc: 'Tournées régulières en exploitations avicoles. Collecte fiable et traçabilité garantie pour chaque bâtiment. Équipe formée aux protocoles sanitaires avicoles.',
    points: ['Fréquence hebdomadaire ou bimensuelle', 'Matériel adapté et certifié', 'Compte-rendu après chaque passage'],
    color: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
  },
  {
    icon: '🌿',
    title: 'Nettoyage agricole',
    subtitle: 'Bâtiments & exploitations',
    desc: 'Désinfection et nettoyage complet de bâtiments agricoles selon les normes sanitaires en vigueur. Intervention ponctuelle ou contrat annuel.',
    points: ['Haute pression et produits homologués', 'Respect des vides sanitaires', 'Intervention sous 48h si urgence'],
    color: 'bg-green-50 border-green-200',
    badge: 'bg-green-100 text-green-700',
  },
  {
    icon: '🏭',
    title: 'Nettoyage industriel',
    subtitle: 'Sites & ateliers',
    desc: 'Nettoyage de sites industriels, abattoirs et ateliers de production avec des protocoles adaptés à vos contraintes réglementaires et opérationnelles.',
    points: ['Équipe formée aux risques industriels', 'Protocoles HACCP disponibles', 'Disponible week-ends et jours fériés'],
    color: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
]

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await db.contacts.add({ ...form, createdAt: new Date().toISOString() })
      const subject = encodeURIComponent(`Contact site — ${form.name}`)
      const body = encodeURIComponent(`Nom : ${form.name}\nEmail : ${form.email}\nTéléphone : ${form.phone}\n\nMessage :\n${form.message}`)
      window.location.href = `mailto:contact@agriclean.fr?subject=${subject}&body=${body}`
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-colors'

  if (sent) return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle size={32} className="text-green-600" />
      </div>
      <p className="text-xl font-bold text-slate-900">Message envoyé !</p>
      <p className="text-slate-500 mt-2">Nous vous répondrons dans les plus brefs délais.</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Nom complet *</label>
          <input required className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Jean Martin" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Email *</label>
          <input required type="email" className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="jean@entreprise.fr" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Téléphone</label>
        <input type="tel" className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="06 00 00 00 00" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Message *</label>
        <textarea required rows={4} className={inputCls} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="Décrivez votre besoin (type de nettoyage, fréquence, localisation…)" />
      </div>
      <button type="submit" disabled={sending}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-colors disabled:opacity-50">
        <Send size={18} /> {sending ? 'Envoi…' : 'Envoyer le message'}
      </button>
    </form>
  )
}

export default function Landing() {
  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-primary to-[#2d6a4f] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #d97706 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f59e0b 0%, transparent 50%)' }} />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-36">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold tracking-wide uppercase mb-6">
              Ramassage · Nettoyage agricole & industriel
            </span>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
              Votre partenaire pour des exploitations<span className="text-accent"> impeccables</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8">
              AgriClean intervient auprès des éleveurs et industriels avec réactivité et professionnalisme. Ramassage d'œufs, nettoyage agricole et industriel — une seule équipe, toutes vos interventions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/espace-pro"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-accent text-white font-bold rounded-2xl hover:bg-accent-light transition-colors shadow-lg">
                Accéder à mon espace <ArrowRight size={18} />
              </Link>
              <a href="#contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white/10 border border-white/30 text-white font-semibold rounded-2xl hover:bg-white/20 transition-colors">
                Nous contacter
              </a>
            </div>
          </div>
        </div>
        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full">
            <path d="M0 80L1440 80L1440 30C1200 70 960 0 720 20C480 40 240 70 0 30L0 80Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-widest">Ce que nous faisons</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-2">Nos prestations</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Des interventions adaptées à chaque contexte, réalisées par des équipes formées et équipées.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.title} className={`rounded-2xl border-2 ${s.color} p-6 flex flex-col`}>
                <div className="text-4xl mb-4">{s.icon}</div>
                <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${s.badge}`}>{s.subtitle}</span>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">{s.desc}</p>
                <ul className="space-y-2 mt-auto">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle size={15} className="text-primary shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECRUITMENT BANNER */}
      <section className="py-16 px-4 bg-accent">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white">Rejoignez notre équipe !</h2>
            <p className="text-white/80 mt-2 text-base">Chauffeurs, agents de nettoyage, polyvalents — nous recrutons régulièrement des profils motivés.</p>
          </div>
          <Link to="/candidats"
            className="shrink-0 inline-flex items-center gap-2 px-8 py-4 bg-white text-accent font-bold rounded-2xl hover:bg-slate-50 transition-colors shadow-md whitespace-nowrap">
            Voir les offres <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-primary font-semibold text-sm uppercase tracking-widest">Pourquoi nous choisir</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-2">Nos engagements</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '⚡', title: 'Réactivité', desc: 'Intervention sous 48h pour toute demande urgente. Disponibles 7j/7 sur certaines prestations.' },
              { icon: '🛡️', title: 'Conformité', desc: 'Équipes formées aux normes sanitaires et aux protocoles de sécurité spécifiques à chaque secteur.' },
              { icon: '📋', title: 'Traçabilité', desc: 'Compte-rendu systématique après chaque intervention. Suivi complet de l\'historique.' },
              { icon: '🤝', title: 'Partenariat', desc: 'Contrats adaptés à vos cycles d\'activité. Tarifs transparents, sans surprise.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <span className="text-primary font-semibold text-sm uppercase tracking-widest">Parlons de votre projet</span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-2 mb-4">Nous contacter</h2>
              <p className="text-slate-500 leading-relaxed mb-8">
                Besoin d'un devis ? D'une intervention urgente ? Contactez-nous et nous reviendrons vers vous dans les meilleurs délais.
              </p>
              <div className="space-y-4">
                <a href="tel:0466001122" className="flex items-center gap-3 text-slate-700 hover:text-primary transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <Phone size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Téléphone</p>
                    <p className="font-medium">04 66 00 11 22</p>
                  </div>
                </a>
                <a href="mailto:contact@agriclean.fr" className="flex items-center gap-3 text-slate-700 hover:text-primary transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <Mail size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="font-medium">contact@agriclean.fr</p>
                  </div>
                </a>
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Adresse</p>
                    <p className="font-medium">15 Rue du Commerce, 30000 Nîmes</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
