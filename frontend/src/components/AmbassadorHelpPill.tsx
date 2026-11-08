import React from 'react';
import { MessageCircle } from 'lucide-react';

export const AmbassadorHelpPill: React.FC = () => {
  return (
    <a
      href="https://chat.whatsapp.com/KGFvgXHtvsm4jGH3fcnOcj"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
      title="Join SkillRock Ambassador WhatsApp Group"
    >
      <MessageCircle className="w-4 h-4 group-hover:rotate-12 transition-transform" />
      <span>SkillRock Ambassador Help</span>
    </a>
  );
};
