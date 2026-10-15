"use client";

import Comments from "../navigation-tools/Comments";
import Editing from "../navigation-tools/Editing";
import Share from "../navigation-tools/Share";

export const SECTIONS = [
  "Home",
  "Insert",
  "Draw",
  "Layout",
  "References",
  "Mailings",
  "Review",
  "View",
] as const;

export type NavSection = (typeof SECTIONS)[number];

interface NavigationProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
}

function Navigation({ activeSection, onSelectSection }: NavigationProps) {
  return (
    <div className="flex justify-between h-6 text-[13px] text-secondary items-center">
      <div className="flex space-x-6">
        {SECTIONS.map((section) => (
          <p
            key={section}
            onClick={() => onSelectSection(section)}
            className={`cursor-pointer relative pb-1 transition-colors ${
              activeSection === section
                ? "font-bold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-word after:rounded-full text-black"
                : "font-medium hover:text-black"
            }`}
          >
            {section}
          </p>
        ))}
      </div>
      <div className="flex h-full text-[13px] font-bold text-black space-x-2.25">
        <Comments />
        <Editing />
        <Share />
      </div>
    </div>
  );
}

export default Navigation;