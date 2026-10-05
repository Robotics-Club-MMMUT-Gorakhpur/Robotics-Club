"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EncryptedText } from "@/components/ui/EncryptedTextEmbedx";
import ShaderWaves from "@/components/ui/ShaderWaves";
import { Timeline } from "@/components/ui/timeline";
import SleekLineCursor from "@/components/SleekLineCursor";
import Banner1 from "@/components/ui/banner-1";

export default function EmbedxPage() {
  const router = useRouter();
  const bannerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('About');
  const tabs = ['About', 'Structure', 'Timeline', 'Problem Statements', 'Rules', 'Components', 'Contact'];

  const handleContainerScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerTop = container.getBoundingClientRect().top;

    let current = 'About';
    for (const tab of tabs) {
      const el = document.getElementById(`section-${tab}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top - containerTop <= 100) {
          current = tab;
        }
      }
    }

    // If we've hit the absolute bottom of the scroll container, force the last tab to be active
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
    if (isAtBottom) {
      current = tabs[tabs.length - 1]; // 'Contact'
    }

    setActiveTab(current);
  };

  const scrollToSection = (tab: string) => {
    const el = document.getElementById(`section-${tab}`);
    const container = containerRef.current;
    if (el && container) {
      const containerTop = container.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      const currentScroll = container.scrollTop;
      container.scrollTo({ top: currentScroll + (elTop - containerTop) - 20, behavior: 'smooth' });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bannerRef.current) return;
    const rect = bannerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    bannerRef.current.style.setProperty("--mouse-x", `${x}px`);
    bannerRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div className="min-h-screen w-full bg-[#050810] text-white relative flex flex-col font-['Inter']">

      {/* Internship announcement */}
      <div className="relative z-20">
        <Banner1 />
      </div>

      {/* WebGL Animated Waves Background (Base) */}
      <ShaderWaves />

      {/* Global Glowing Cursor Line */}
      <div className="fixed inset-0 pointer-events-none z-[10]">
        <SleekLineCursor />
      </div>

      {/* Blended Background Layer */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none bg-cover bg-center bg-no-repeat mix-blend-screen opacity-20"
        style={{
          backgroundImage: `url('/images/embedx-bg.jpg')`,
          WebkitMaskImage: 'radial-gradient(ellipse at center 40%, black 10%, transparent 70%)',
          maskImage: 'radial-gradient(ellipse at center 40%, black 10%, transparent 70%)'
        }}
      />

      <div className="fixed inset-0 bg-gradient-to-b from-[#050810]/90 via-[#050810]/40 to-[#050810] pointer-events-none z-[2]" />



      <div className="z-10 w-full flex flex-col">
        {/* Full Width Hero Banner with Spotlight Hover */}
        <div
          ref={bannerRef}
          onMouseMove={handleMouseMove}
          className="relative w-full h-[100px] md:h-[125px] lg:h-[150px] mt-0 overflow-hidden group cursor-crosshair bg-[#050505]"
        >
          {/* Base Layer: Dark and muted */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full opacity-20 grayscale-[50%] transition-transform duration-1000 ease-out group-hover:scale-105"
            style={{ backgroundImage: `url('/images/embedx-bg.jpg')` }}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050810] pointer-events-none" />

          {/* Spotlight Layer */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out group-hover:scale-105"
            style={{
              backgroundImage: `url('/images/embedx-bg.jpg')`,
              WebkitMaskImage: `radial-gradient(circle 250px at var(--mouse-x, 50%) var(--mouse-y, 50%), black 0%, transparent 100%)`,
              maskImage: `radial-gradient(circle 250px at var(--mouse-x, 50%) var(--mouse-y, 50%), black 0%, transparent 100%)`
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center pt-6 md:pt-8 pb-4 md:pb-6 px-4"
        >
            <div className="flex flex-col items-center justify-start text-center w-full self-start">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter drop-shadow-2xl">
                <EncryptedText text="EMBEDX" revealedClass="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
              </h1>

              <div className="mt-4 md:mt-6 flex flex-col items-center gap-4 w-full">
                <div className="flex items-center justify-center gap-2 md:gap-4 text-[10px] sm:text-xs md:text-sm font-bold tracking-widest md:tracking-[0.3em] text-blue-500 uppercase font-mono w-full">
                  <span className="w-6 sm:w-8 md:w-12 h-[1px] bg-gradient-to-r from-transparent to-blue-500"></span>
                  <span className="text-center">INNOVATE &bull; BUILD &bull; DEPLOY</span>
                  <span className="w-6 sm:w-8 md:w-12 h-[1px] bg-gradient-to-l from-transparent to-blue-500"></span>
                </div>
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm md:text-base font-bold shadow-[0_0_15px_rgba(59,130,246,0.15)] mt-2">
                  <span className="text-xl">&#127942;</span> Prize Pool: &#8377;10,000 + Exclusive Goodies
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto justify-center px-2">
                <button
                  onClick={() => router.push("/embedx/register")}
                  className="relative overflow-hidden group bg-[#3b82f6] hover:bg-[#2563eb] text-white w-full sm:w-auto px-6 md:px-8 py-3.5 rounded-lg font-bold tracking-widest uppercase text-[11px] md:text-[12px] transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Register Now <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </span>
                </button>

              
                <button
                  onClick={() => router.push("/embedx/login")}
                  className="relative overflow-hidden group bg-transparent border border-cyan-500/60 hover:border-cyan-300 text-cyan-300 hover:text-cyan-100 w-full sm:w-auto px-6 md:px-8 py-3.5 rounded-lg font-bold tracking-widest uppercase text-[11px] md:text-[12px] transition-all duration-300 hover:bg-cyan-500/10"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    Login to Dashboard
                  </span>
                </button>

                <button
                  onClick={() => scrollToSection('Problem Statements')}
                  className="relative overflow-hidden group bg-transparent border border-neutral-600 hover:border-white text-neutral-300 hover:text-white w-full sm:w-auto px-6 md:px-8 py-3.5 rounded-lg font-bold tracking-widest uppercase text-[11px] md:text-[12px] transition-all duration-300 hover:bg-white/5"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    Problem Statements
                  </span>
                </button>

                <button
                  onClick={() => router.push("/embedx/leaderboard")}
                  className="relative overflow-hidden group bg-transparent border border-neutral-600 hover:border-blue-400 text-neutral-300 hover:text-white w-full sm:w-auto px-6 md:px-8 py-3.5 rounded-lg font-bold tracking-widest uppercase text-[11px] md:text-[12px] transition-all duration-300 hover:bg-blue-500/10"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    Leaderboard
                  </span>
                </button>
              </div>
            </div>
        </motion.div>
      </div>

      {/* Tabbed / Scrollable Content Section */}
      <div className="w-full max-w-4xl mx-auto z-10 px-4 md:px-6 mt-2 md:mt-6 pb-24">
        {/* OUTER WRAPPER: Handles border, background, and rounded corners */}
        <div className="bg-[#0a1120]/80 backdrop-blur-md rounded-2xl border border-blue-900/30 overflow-hidden relative shadow-2xl">

          {/* STATIC TABS HEADER */}
          <div className="flex overflow-x-auto no-scrollbar border-b border-blue-900/50 bg-[#050810]/95 relative z-10">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => scrollToSection(tab)}
                className={`px-4 py-3 md:px-6 md:py-4 text-[11px] md:text-[13px] font-medium tracking-wide whitespace-nowrap transition-all duration-300 flex-1 min-w-[80px] md:min-w-[100px] text-center ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-blue-500 bg-blue-500/10'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* INNER SCROLLABLE CONTENT AREA */}
          <div
            ref={containerRef}
            onScroll={handleContainerScroll}
            className="h-[350px] md:h-[450px] lg:h-[500px] overflow-y-auto custom-scrollbar relative p-5 md:p-8 space-y-10 md:space-y-12 pb-32"
          >

            {/* ABOUT */}
            <div id="section-About">
              <h2 className="text-2xl font-bold text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] font-['Space_Grotesk'] uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-blue-500 rounded-sm"></span>
                About
              </h2>
              <div className="space-y-4 text-sm leading-relaxed flex gap-3 text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                <div className="space-y-4">
                  <p>
                    The Robotics Club proposes to organize a three-phase, hands-on embedded systems event designed to take participants from a blank problem statement to a working hardware prototype. Unlike a typical one-day hackathon, this event is structured so that participants first receive real components and a challenge, are then trained on the exact hardware they are expected to use, and finally present their completed builds to the faculty panel. This approach ensures that even participants with limited prior exposure to microcontrollers can meaningfully complete, learn practical skills, and produce a working demonstration by the end of the event.
                  </p>
                  
                  <div className="mt-8 relative p-[2px] rounded-xl bg-gradient-to-r from-yellow-500 via-pink-500 to-fuchsia-600 shadow-[0_0_20px_rgba(217,70,239,0.25)] group">
                    <div className="bg-[#050810] rounded-[10px] p-4 sm:p-5 flex items-center relative overflow-hidden h-full w-full">
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-fuchsia-500/10 to-fuchsia-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                      {/* Left Trophy Area */}
                      <div className="relative flex items-center justify-center min-w-max pl-2 sm:pl-4">
                        <span className="text-4xl relative z-10">🏆</span>
                      </div>

                      {/* Vertical divider */}
                      <div className="h-10 w-[2px] bg-yellow-500 mx-4 sm:mx-6 flex-shrink-0 z-10 opacity-90 shadow-[0_0_5px_rgba(234,179,8,0.5)]"></div>

                      {/* Text content */}
                      <div className="font-['Space_Grotesk'] text-[15px] sm:text-[17px] leading-tight tracking-wide z-10 flex-1">
                        <span className="text-white font-bold">Top performers and winning teams will receive </span>
                        <span className="text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
                          exclusive internship opportunities.
                        </span>
                      </div>

                      {/* Bottom right decorative slashes */}
                      <div className="absolute -bottom-2 -right-3 flex gap-2 transform -skew-x-[25deg]">
                        <div className="w-3.5 h-12 bg-fuchsia-600 shadow-[0_0_15px_rgba(219,39,119,0.8)]"></div>
                        <div className="w-5 h-12 bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.8)] relative -right-1"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STRUCTURE */}
            <div id="section-Structure">
              <h2 className="text-2xl font-bold text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] font-['Space_Grotesk'] uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-blue-500 rounded-sm"></span>
                Structure
              </h2>
              <div className="space-y-8">

                {/* Phase 1 */}
                <div className="flex gap-3 text-sm leading-relaxed text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                  <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                  <div>
                    <strong className="text-white block mb-2 text-base">Phase 1 - Hands-on Workshop on ESP 8266 / Arduino Uno</strong>
                    <p className="mb-3">A structured workshop will be conducted by club members covering:</p>
                    <ul className="list-disc pl-5 space-y-1.5 mb-3 text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                      <li>Introduction to ESP 8266 / Arduino Uno architecture, pinout, and specifications.</li>
                      <li>Setting up the Arduino IDE and uploading a first program.</li>
                      <li>Interfacing common sensors and actuators (digital I/O, analog input, PWM, serial communication).</li>
                      <li>Basic Wi-Fi/Bluetooth functionality on ESP 8266 (where applicable to the problem statements).</li>
                      <li>Debugging techniques and best practices for wiring and code.</li>
                    </ul>
                    <p>This session ensures participants have the exact technical knowledge needed to build their assigned problem statement, rather than a generic tutorial disconnected from their task.</p>
                  </div>
                </div>

                {/* Phase 2 */}
                <div className="flex gap-3 text-sm leading-relaxed text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                  <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                  <div>
                    <strong className="text-white block mb-2 text-base">Phase 2 - Component Distribution & Problem Statement Release</strong>
                    <p>
                      Participating teams will be given a fixed kit of electronic components (microcontroller board, sensors, actuators, jumper wires, breadboard, and other basic parts) along with a problem statement relevant to real-world. Teams will use this phase to brainstorm their approach, plan their circuit, and identify what they need to learn before building.
                    </p>
                  </div>
                </div>

                {/* Phase 3 */}
                <div className="flex gap-3 text-sm leading-relaxed text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                  <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                  <div>
                    <strong className="text-white block mb-2 text-base">Phase 3 - Prototype Presentation & Judging</strong>
                    <p>
                      Each team will demonstrate their working hardware prototype live, supported by a short PowerPoint presentation covering their problem statement, approach, circuit/system design, challenges faced, and results. A faculty judging panel will evaluate the teams on functionality, innovation, technical understanding, and quality of presentation. The event will conclude with results and a felicitation of the top-performing teams.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* TIMELINE */}
            <div id="section-Timeline">
              <h2 className="text-2xl font-bold text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] font-['Space_Grotesk'] uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-blue-500 rounded-sm"></span>
                Timeline
              </h2>
              <div className="max-w-lg mt-4">
                  <Timeline
                    items={[
                      {
                        id: "0",
                        title: "Last Date of Registration",
                        timestamp: "Sep 20",
                        status: "active",
                      },
                      {
                        id: "1",
                        title: "Hands-on Workshop",
                        timestamp: "Sep 26-27",
                        description: "Venue to be announced",
                        status: "pending",
                      },
                      {
                        id: "2",
                        title: "Problem Release and Kit Distribution",
                        timestamp: "To be announced",
                        status: "pending",
                      },
                      {
                        id: "3",
                        title: "Presentation Day",
                        timestamp: "To be announced",
                        status: "pending",
                      },
                    ]}
                    timestampPosition="inline"
                    variant="spacious"
                  />
              </div>
            </div>

            {/* PROBLEM STATEMENTS */}
            <div id="section-Problem Statements">
              <h2 className="text-2xl font-bold text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] font-['Space_Grotesk'] uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-blue-500 rounded-sm"></span>
                Problem Statements
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    id: "PS1",
                    title: "The Unattended Bag",
                    theme: "Security and Anti-Theft",
                    description: "Students leave bags unattended in libraries and canteens, and theft happens in seconds. Build a low-cost way for a bag to know it's being tampered with and make the owner aware, even from a distance.",
                  },
                  {
                    id: "PS2",
                    title: "The Laundry Panic",
                    theme: "Smart Home and Weather Protection",
                    description: "Clothes dry on hostel rooftops and balconies, and sudden rain ruins them while everyone is in class. Build something that protects the laundry without anyone being present.",
                  },
                  {
                    id: "PS3",
                    title: "Posture Police",
                    theme: "Health and Wellness",
                    description: "Students hunch over laptops for hours without noticing. Build a wearable or desk companion that notices bad habits and nudges the person without being annoying.",
                  },
                  {
                    id: "PS4",
                    title: "The Doorbell Nobody Can Hear",
                    theme: "Accessibility and Inclusion",
                    description: "People with hearing difficulty miss visitors at the door. Build an alert that doesn't rely on sound alone.",
                  },
                  {
                    id: "PS5",
                    title: "The Thirsty Plant",
                    theme: "Smart Agriculture and Sustainability",
                    description: "Hostel and balcony plants die from too much or too little water, depending on heat and sunlight. Build a caretaker that waters only when the plant actually needs it and shows the owner what conditions it has been through.",
                  },
                  {
                    id: "PS6",
                    title: "The Silent Leak",
                    theme: "Home Safety",
                    description: "Gas leaks and smoldering fires in kitchens and hostel rooms are often noticed too late, especially at night. Build a guardian that detects the hazard, acts on its own to reduce danger, and warns people nearby and far away. The hazard response must still trigger if the main controller hangs or crashes.",
                  },
                  {
                    id: "PS7",
                    title: "The Shelf That Slowly Tilts",
                    theme: "Safety and Monitoring",
                    description: "Equipment, ladders, and shelves can tilt to a dangerous angle without anyone noticing. Build a system that alerts when the tilt crosses a safe limit.",
                  },
                  {
                    id: "PS8",
                    title: "The Dustbin Nobody Wants to Touch",
                    theme: "Hygiene and Cleanliness",
                    description: "People avoid touching public dustbins, so waste ends up lying outside. Build a dustbin that opens without contact.",
                  },
                ].map((ps) => (
                  <div
                    key={ps.id}
                    className="group relative bg-blue-900/10 border border-blue-500/20 rounded-lg p-4 hover:border-blue-500/50 hover:bg-blue-900/20 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-400/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-white font-bold font-['Space_Grotesk'] text-base tracking-wide">
                        {ps.title}
                      </h3>
                      <span className="flex-shrink-0 font-mono text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded px-2 py-0.5">
                        {ps.id}
                      </span>
                    </div>
                    <div className="relative inline-block text-[10px] font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-2.5 py-1 mb-3">
                      {ps.theme}
                    </div>
                    <p className="relative text-sm text-neutral-300 leading-relaxed font-['Space_Grotesk']">
                      {ps.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* RULES */}
            <div id="section-Rules">
              <h2 className="text-2xl font-bold text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] font-['Space_Grotesk'] uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-blue-500 rounded-sm"></span>
                Rules
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3 text-sm leading-relaxed text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                  <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                  <div>Team size: individual or team of 2-3. Each member of the team should be from the same academic year.</div>
                </div>
                <div className="flex gap-3 text-sm leading-relaxed text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                  <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                  <div>One submission per team. Multiple submissions are NOT allowed.</div>
                </div>
                <div className="flex gap-3 text-sm leading-relaxed text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                  <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                  <div>Components other than what we provided are strictly prohibited.</div>
                </div>
                <div className="flex gap-3 text-sm leading-relaxed text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                  <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                  <div>Use of Printed Circuit Boards (Custom build or Universal) are not allowed.</div>
                </div>
                <div className="flex gap-3 text-sm leading-relaxed text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                  <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                  <div>Open to all years and branches and the winner will be chosen from 1st year participants.</div>
                </div>
                <div className="flex gap-3 text-sm leading-relaxed text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                  <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                  <div>Any language/IDE/framework is allowed.</div>
                </div>
                <div className="flex gap-3 text-sm leading-relaxed text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                  <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                  <div>Pre-written code must be disclosed and clearly marked as "brought in" vs "written during hackathon." Reused boilerplate (WiFi setup, motor driver libraries) is fine; a pre-built solution to the actual problem statement is not.</div>
                </div>
                <div className="flex gap-3 text-sm leading-relaxed text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                  <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                  <div>Use of AI is allowed with disclosure at the time of or before final submission.</div>
                </div>
                <div className="flex gap-3 text-sm leading-relaxed text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                  <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                  <div>If you need, you have to use your own personal internet, Robotics club is not liable to provide such service/s.</div>
                </div>
                <div className="flex gap-3 text-sm leading-relaxed text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                  <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                  <div>Violation of any above mentioned rules could lead to instant disqualification.</div>
                </div>
                <div className="flex gap-3 text-sm leading-relaxed text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                  <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                  <div>Judges can disqualify any team if they see fit.</div>
                </div>
              </div>
            </div>
            {/* KIT */}
            <div id="section-Components">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] font-['Space_Grotesk'] uppercase tracking-widest flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-blue-500 rounded-sm"></span>
                  Components Used
                </h2>
                <a
                  href="/EmbedX_Components.pdf"
                  download="EmbedX_Components.pdf"
                  className="px-4 py-2 bg-blue-500/10 border border-blue-500/50 rounded text-blue-400 font-['Space_Grotesk'] hover:bg-blue-500/20 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Download List
                </a>
              </div>
              <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg overflow-hidden mb-4">
                <table className="w-full text-left text-sm font-['Space_Grotesk'] text-white">
                  <thead className="bg-blue-900/30 border-b border-blue-500/20">
                    <tr>
                      <th className="px-4 py-3 font-bold text-blue-400 tracking-wide">COMPONENT</th>
                      <th className="px-4 py-3 font-bold text-blue-400 tracking-wide text-center w-32">QUANTITY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-500/10">
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">ESP 8266 with cable</td><td className="px-4 py-2.5 text-center">1</td></tr>
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">SG90 Servo Motor</td><td className="px-4 py-2.5 text-center">1</td></tr>
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">IR Sensor Module</td><td className="px-4 py-2.5 text-center">1</td></tr>
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">IC 555</td><td className="px-4 py-2.5 text-center">1</td></tr>
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">Breadboard</td><td className="px-4 py-2.5 text-center">1</td></tr>
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">MPU6050 Module</td><td className="px-4 py-2.5 text-center">1</td></tr>
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">DHT11</td><td className="px-4 py-2.5 text-center">1</td></tr>
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">TTP224 Touch Sensor</td><td className="px-4 py-2.5 text-center">1</td></tr>
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">Relay Module 3V</td><td className="px-4 py-2.5 text-center">1</td></tr>
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">MQ-2 Sensor</td><td className="px-4 py-2.5 text-center">1</td></tr>
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">Buzzer</td><td className="px-4 py-2.5 text-center">1</td></tr>
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">LDR Sensor Module</td><td className="px-4 py-2.5 text-center">1</td></tr>
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">Soil Moisture Sensor</td><td className="px-4 py-2.5 text-center">1</td></tr>
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">Vibration Sensor</td><td className="px-4 py-2.5 text-center">1</td></tr>
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">Tilt Sensor</td><td className="px-4 py-2.5 text-center">1</td></tr>
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">Jumper Wires</td><td className="px-4 py-2.5 text-center">3 set</td></tr>
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">Resistor</td><td className="px-4 py-2.5 text-center">3</td></tr>
                    <tr className="hover:bg-blue-500/5 transition-colors"><td className="px-4 py-2.5">LED</td><td className="px-4 py-2.5 text-center">5</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center bg-blue-500/10 border border-blue-500/30 p-5 rounded-lg mb-8 shadow-[0_0_15px_rgba(59,130,246,0.15)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-400/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="text-white font-bold font-['Space_Grotesk'] tracking-wide text-lg flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  Total Kit Price
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]">
                  &#8377;1,414
                </span>
              </div>
            </div>

            {/* CONTACT */}
            <div id="section-Contact">
              <h2 className="text-2xl font-bold text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] font-['Space_Grotesk'] uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-blue-500 rounded-sm"></span>
                Contact
              </h2>
              <div className="space-y-6">
                <div className="flex gap-3 text-sm leading-relaxed text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                  <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                  <div>
                    <strong className="text-white block mb-2 text-base">Event Coordinator</strong>
                    <div className="mb-1">Apurv Mishra</div>
                    <div className="text-neutral-400 text-xs mb-2">IoT 3rd Year</div>
                    <a href="tel:+917068585328" className="hover:text-blue-400 font-mono block">+91 7068585328</a>
                  </div>
                </div>

                <div className="flex gap-3 text-sm leading-relaxed text-white font-['Space_Grotesk'] tracking-wide [text-shadow:0_0_10px_rgba(255,255,255,0.7)]">
                  <span className="text-blue-500 font-bold mt-0.5">{'>'}</span>
                  <div>
                    <strong className="text-white block mb-2 text-base">Event Coordinator</strong>
                    <div className="mb-1">Dhruv Mishra</div>
                    <div className="text-neutral-400 text-xs mb-2">IoT 3rd Year</div>
                    <a href="tel:+916394655386" className="hover:text-blue-400 font-mono block">+91 6394655386</a>
                  </div>
                </div>
              </div>
            </div>

            {/* SPACER for smooth scroll of the last item */}
            <div className="h-32 md:h-48"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
