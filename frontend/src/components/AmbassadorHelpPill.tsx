import React from 'react';
import { MessageCircle } from 'lucide-react';

export const AmbassadorHelpPill: React.FC = () => {
  return (
    <a
      href="https://chat.whatsapp.com/KGFvgXHtvsm4jGH3fcnOcj"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] sm:text-xs shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
      title="Join SkillRock Ambassador WhatsApp Group"
    >
      <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform" />
      <span className="hidden sm:inline">SkillRock Ambassador Help</span>
      <span className="sm:hidden">WhatsApp Help</span>
    </a>
  );
};
