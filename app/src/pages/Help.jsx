import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Book, Video, Mail, MessageCircle } from 'lucide-react';

const HELP_SECTIONS = [
  {
    icon: Book,
    title: 'Getting Started',
    description: 'Learn the basics of DoFO and how to set up your team.',
    link: '#'
  },
  {
    icon: Video,
    title: 'Video Tutorials',
    description: 'Watch step-by-step video guides for all features.',
    link: '#'
  },
  {
    icon: MessageCircle,
    title: 'FAQ',
    description: 'Find answers to frequently asked questions.',
    link: '#'
  },
  {
    icon: Mail,
    title: 'Contact Support',
    description: 'Get help from our support team.',
    link: 'mailto:support@digitaldofo.com'
  }
];

export default function Help() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <HelpCircle size={48} className="text-sky-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Help & Support</h1>
        <p className="text-slate-400">
          Resources to help you get the most out of DoFO
        </p>
      </div>

      <div className="grid gap-4 mb-8">
        {HELP_SECTIONS.map((section, index) => (
          <a
            key={index}
            href={section.link}
            className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="p-2 bg-sky-500/20 rounded-lg">
              <section.icon size={24} className="text-sky-400" />
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">{section.title}</h3>
              <p className="text-sm text-slate-400">{section.description}</p>
            </div>
          </a>
        ))}
      </div>

      <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Tips</h2>
        <ul className="space-y-3 text-slate-400 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-sky-400 mt-0.5">•</span>
            <span>Use the sidebar to navigate between different tools and phases</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-400 mt-0.5">•</span>
            <span>Click on a week to see all available tools for that week</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-400 mt-0.5">•</span>
            <span>The Print Center lets you export plays and plans for practice</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-400 mt-0.5">•</span>
            <span>Collapse the sidebar using the menu icon to maximize workspace</span>
          </li>
        </ul>
      </div>

      <div className="text-center">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
