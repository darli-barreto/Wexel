"use client";
import { useState } from "react";
import Comments from "../navigation-tools/Comments";
import Editing from "../navigation-tools/Editing";
import Share from "../navigation-tools/Share";

function Navigation() {
  const [activeSection, setActiveSection] = useState("Home");

  const sections = [
    "Home",
    "Insert",
    "Draw",
    "Layout",
    "References",
    "Mailings",
    "Review",
    "View",
  ];
  return (
    <div className="flex justify-between h-6 text-[13px] text-secondary items-center">
      <div className="flex space-x-6">
        {sections.map((section) => (
          <p
            key={section}
            onClick={() => setActiveSection(section)}
            className={`cursor-pointer relative pb-1 ${
              activeSection === section
                ? "font-bold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-word after:rounded-full"
                : "font-medium"
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
