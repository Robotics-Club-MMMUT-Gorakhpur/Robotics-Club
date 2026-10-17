"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import ShaderWaves from "@/components/ui/ShaderWaves";
import SleekLineCursor from "@/components/SleekLineCursor";

// Define the Team interface based on expected MongoDB document structure
interface Team {
  _id?: string;
  id?: string;
  registrationId?: string;
  name: string;
  score: number;
  initialScore?: number;
  initialRank?: number;
  isTop20?: boolean;
}

export default function LeaderboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [finalTeams, setFinalTeams] = useState<Team[]>([]);
  const [finalRoundActive, setFinalRoundActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"final" | "preliminary" | null>(null);

  useEffect(() => {
    // Fetch leaderboard data from MongoDB API
    const fetchLeaderboard = async (isInitial = false) => {
      if (isInitial) setIsLoading(true);
      try {
        const response = await fetch(`/api/embedx/leaderboard?t=${Date.now()}`, { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.hidden) {
            setIsHidden(true);
          } else {
            setIsHidden(false);
            setFinalRoundActive(Boolean(data.finalRoundActive));
            const fetchedTeams = data.teams || [];
            setTeams(fetchedTeams);
            const fetchedFinalTeams = data.finalTeams || [];
            setFinalTeams(fetchedFinalTeams);
          }
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard data:", error);
      } finally {
        if (isInitial) setIsLoading(false);
      }
    };

    fetchLeaderboard(true);

    // Poll every 5 seconds for real-time updates without refreshing
    const intervalId = setInterval(() => {
      fetchLeaderboard(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // When final round is active, default to "final" unless user manually toggles to "preliminary"
  const activeTab: "final" | "preliminary" = 
    finalRoundActive ? (selectedTab ?? "final") : "preliminary";

  // Sort Preliminary teams: by score descending, then alphabetically
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  // Preliminary Podium (teams with >0 points get on the podium)
  const podiumTeams = sortedTeams.filter(t => t.score > 0).slice(0, 3);
  const firstPlace = podiumTeams[0] || null;
  const secondPlace = podiumTeams[1] || null;
  const thirdPlace = podiumTeams[2] || null;

  // Sort Finalists: by final score descending; if tied, seed rank
  const sortedFinalTeams = [...finalTeams].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if ((a.initialRank || 99) !== (b.initialRank || 99)) return (a.initialRank || 99) - (b.initialRank || 99);
    return a.name.localeCompare(b.name);
  });

  // Final Round Podium (teams with >0 points get on the podium)
  const finalHasScores = sortedFinalTeams.some(t => t.score > 0);
  const finalPodium = finalHasScores
    ? sortedFinalTeams.filter(t => t.score > 0).slice(0, 3)
    : [];

  const final1st = finalPodium[0] || null;
  const final2nd = finalPodium[1] || null;
  const final3rd = finalPodium[2] || null;

  return (
    <div className="min-h-screen w-full bg-[#050810] text-white relative flex flex-col font-['Inter']">
      {/* Background Layers */}
      <ShaderWaves />
      
      {/* Robotics Hardware Theme Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-[1] opacity-15 md:opacity-20 mix-blend-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/robotics_hardware_bg.jpg')` }}
      />
      
      <div className="fixed inset-0 pointer-events-none z-[10]">
        <SleekLineCursor />
      </div>
      <div className="fixed inset-0 bg-gradient-to-b from-[#050810]/95 via-[#050810]/70 to-[#050810] pointer-events-none z-[2]" />

      {/* Main Content Container - Always max-w-3xl for optimal presentation */}
      <div className="relative z-10 w-full max-w-3xl mx-auto pt-20 md:pt-28 px-4 md:px-6 pb-20 transition-all duration-500">

        {isHidden ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="bg-[#0a1120]/80 backdrop-blur-md rounded-2xl border border-blue-900/40 p-10 md:p-16 flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(59,130,246,0.05)] mt-10 max-w-3xl mx-auto"
          >
            <h1 className="text-3xl md:text-5xl font-black font-['Space_Grotesk'] tracking-widest uppercase mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 drop-shadow-2xl">
              Leaderboard Hidden
            </h1>
            <p className="text-neutral-400 font-mono tracking-wide text-sm md:text-base">
              The live rankings are currently hidden by the administrators. Stay tuned!
            </p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
          >
            {/* Header Banner - Remains identical in both leaderboards */}
            <div className="bg-[#0a1120]/80 backdrop-blur-md rounded-2xl border border-blue-900/40 p-6 md:p-8 flex flex-col items-center justify-center text-center mb-8 shadow-[0_0_30px_rgba(59,130,246,0.05)]">
              <h1 className="text-3xl md:text-5xl font-black font-['Space_Grotesk'] tracking-widest uppercase mb-3 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-500 drop-shadow-2xl">
                LEADERBOARD
              </h1>
              
              <div className="text-blue-500 font-mono text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.3em] font-bold uppercase mb-4">
                EMBEDX HARDWARE HACKATHON
              </div>
              
              <div className="flex items-center justify-center gap-3 md:gap-5 text-blue-500 font-mono text-[10px] md:text-xs tracking-[0.15em] md:tracking-[0.3em] font-bold uppercase w-full">
                <span className="hidden sm:block w-8 md:w-24 h-[1px] bg-gradient-to-r from-transparent to-blue-500"></span>
                <span className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">SCORE HIGH &bull; CONQUER THE CROWN</span>
                <span className="hidden sm:block w-8 md:w-24 h-[1px] bg-gradient-to-l from-transparent to-blue-500"></span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>LIVE UPDATES EVERY 5S</span>
                </div>
              </div>
            </div>

            {/* When final round is active, two sections are shown: First Round Leaderboard and Final Round */}
            {finalRoundActive && (
              <div className="flex justify-center mb-8">
                <div className="inline-flex p-1.5 rounded-xl bg-[#0a1120]/90 backdrop-blur-md border border-blue-900/50 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
                  <button
                    onClick={() => setSelectedTab("preliminary")}
                    className={`flex items-center gap-2 px-5 md:px-7 py-2.5 rounded-lg font-['Space_Grotesk'] text-xs md:text-sm font-bold tracking-wider uppercase transition-all duration-300 ${
                      activeTab === "preliminary"
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    <span>⚡</span>
                    <span>First Round Leaderboard</span>
                  </button>

                  <button
                    onClick={() => setSelectedTab("final")}
                    className={`flex items-center gap-2 px-5 md:px-7 py-2.5 rounded-lg font-['Space_Grotesk'] text-xs md:text-sm font-bold tracking-wider uppercase transition-all duration-300 ${
                      activeTab === "final"
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    <span>🏆</span>
                    <span>Final Round</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: FINAL ROUND LEADERBOARD */}
            {activeTab === "final" ? (
              <motion.div
                key="final-round-content"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Final Round Podium */}
                <div className="relative bg-[#0a1120]/90 backdrop-blur-md rounded-2xl border border-amber-500/40 p-6 md:p-10 mb-6 shadow-[0_0_40px_rgba(251,191,36,0.15)] flex flex-col items-center overflow-hidden">
                  {/* Inner Tech Background */}
                  <div 
                    className="absolute inset-0 z-0 opacity-25 mix-blend-screen bg-cover bg-center pointer-events-none"
                    style={{ backgroundImage: `url('/robotics_hardware_bg.jpg')` }}
                  />
                  <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0a1120] via-[#0a1120]/40 to-transparent pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-center gap-3 mb-10 md:mb-12 w-full">
                    <span className="text-3xl md:text-4xl drop-shadow-md">👑</span>
                    <h2 className="text-2xl md:text-3xl font-black text-amber-300 tracking-[0.15em] uppercase font-['Space_Grotesk'] drop-shadow-xl">
                      Championship Leaders
                    </h2>
                  </div>
                  
                  {isLoading ? (
                    <div className="relative z-10 h-64 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="relative z-10 flex justify-center items-end gap-3 md:gap-8 pt-6 pb-2 w-full">
                      {/* 2nd Place */}
                      <div className="flex flex-col items-center w-[90px] md:w-[120px]">
                        <div className="mb-3 flex flex-col items-center">
                          <span className="text-3xl md:text-4xl mb-1 drop-shadow-md">🥈</span>
                          <span className="font-black text-neutral-300 font-['Space_Grotesk'] text-sm md:text-base drop-shadow-md">2ND</span>
                        </div>
                        <div className="w-full h-28 md:h-32 bg-neutral-400/10 backdrop-blur-sm border-2 border-neutral-300/80 rounded-t-xl shadow-[0_0_20px_rgba(212,212,216,0.2)] relative"></div>
                        <div className="mt-4 text-center w-full">
                          <div className="text-sm md:text-base font-black font-['Space_Grotesk'] text-neutral-200 truncate px-1 tracking-wide">{final2nd ? final2nd.name : "TBD"}</div>
                          <div className="text-sm md:text-base font-mono font-bold text-amber-400 mt-1">{final2nd ? final2nd.score.toLocaleString() : "0"} <span className="text-[10px] text-neutral-500">PTS</span></div>
                        </div>
                      </div>
                      
                      {/* 1st Place */}
                      <div className="flex flex-col items-center w-[100px] md:w-[140px]">
                        <div className="mb-3 flex flex-col items-center">
                          <span className="text-4xl md:text-5xl mb-1 drop-shadow-lg">🥇</span>
                          <span className="font-black text-amber-400 font-['Space_Grotesk'] text-base md:text-lg drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">1ST</span>
                        </div>
                        <div className="w-full h-36 md:h-44 bg-gradient-to-t from-amber-500/30 to-yellow-500/20 backdrop-blur-sm border-2 border-amber-400 rounded-t-xl shadow-[0_0_30px_rgba(251,191,36,0.4)] relative"></div>
                        <div className="mt-4 text-center w-full">
                          <div className="text-base md:text-xl font-black font-['Space_Grotesk'] text-amber-300 truncate px-1 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] tracking-wide">{final1st ? final1st.name : "TBD"}</div>
                          <div className="text-base md:text-lg font-mono font-black text-amber-200 mt-1">{final1st ? final1st.score.toLocaleString() : "0"} <span className="text-[10px] text-amber-500/80">PTS</span></div>
                        </div>
                      </div>

                      {/* 3rd Place */}
                      <div className="flex flex-col items-center w-[90px] md:w-[120px]">
                        <div className="mb-3 flex flex-col items-center">
                          <span className="text-3xl md:text-4xl mb-1 drop-shadow-md">🥉</span>
                          <span className="font-black text-orange-500 font-['Space_Grotesk'] text-sm md:text-base drop-shadow-md">3RD</span>
                        </div>
                        <div className="w-full h-20 md:h-24 bg-orange-600/20 backdrop-blur-sm border-2 border-orange-500/80 rounded-t-xl shadow-[0_0_20px_rgba(234,88,12,0.2)] relative"></div>
                        <div className="mt-4 text-center w-full">
                          <div className="text-sm md:text-base font-black font-['Space_Grotesk'] text-orange-400 truncate px-1 tracking-wide">{final3rd ? final3rd.name : "TBD"}</div>
                          <div className="text-sm md:text-base font-mono font-bold text-amber-400 mt-1">{final3rd ? final3rd.score.toLocaleString() : "0"} <span className="text-[10px] text-orange-600">PTS</span></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Round Rankings Table */}
                <div className="bg-[#0a1120]/80 backdrop-blur-md rounded-2xl border border-amber-500/30 p-5 md:p-8 shadow-[0_0_30px_rgba(251,191,36,0.08)]">
                  <div className="flex items-center justify-between px-2 md:px-4 pb-3 mb-2 border-b border-amber-500/20 text-neutral-400 font-bold font-['Space_Grotesk'] text-[10px] md:text-xs tracking-widest uppercase">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-12 text-left">RANK</div>
                      <div>TOP 20 FINALISTS</div>
                    </div>
                    <div className="text-right">FINAL SCORE</div>
                  </div>
                  
                  <div className="flex flex-col">
                    {sortedFinalTeams.map((team, idx) => {
                      let rankDisplay: React.ReactNode = `#${idx + 1}`;
                      if (team.score > 0) {
                        if (idx === 0) rankDisplay = <span className="text-amber-400 font-black">🥇 #1</span>;
                        else if (idx === 1) rankDisplay = <span className="text-neutral-300 font-black">🥈 #2</span>;
                        else if (idx === 2) rankDisplay = <span className="text-orange-500 font-black">🥉 #3</span>;
                      } else {
                        rankDisplay = <span className="text-neutral-500">#{idx + 1}</span>;
                      }

                      return (
                        <div 
                          key={team.id || team._id || `final-${idx}`}
                          className="flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-amber-500/10 transition-colors duration-200 group border-b border-amber-500/10 last:border-0"
                        >
                          <div className="flex items-center gap-4 md:gap-6 min-w-0">
                            <div className="w-12 text-left text-sm md:text-base font-bold text-amber-400 font-mono group-hover:text-amber-300 transition-colors">
                              {rankDisplay}
                            </div>
                            <div className="truncate">
                              <div className="font-bold text-neutral-100 text-sm md:text-base tracking-wide group-hover:text-white transition-colors truncate">
                                {team.name}
                              </div>
                            </div>
                          </div>
                          <div className="text-right pl-3 shrink-0">
                            <span className="text-amber-400 font-mono text-base md:text-lg font-black drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                              {team.score.toLocaleString()}
                            </span>
                            <span className="text-[10px] md:text-xs text-neutral-500 font-mono ml-1 font-semibold">
                              PTS
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {sortedFinalTeams.length === 0 && (
                      <div className="p-10 text-center flex flex-col items-center justify-center">
                        <div className="text-neutral-500 font-mono tracking-widest uppercase text-xs">No finalists loaded yet.</div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* TAB CONTENT: PRELIMINARY (INITIAL) ROUND LEADERBOARD */
              <motion.div
                key="preliminary-round-content"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Preliminary Podium */}
                <div className="relative bg-[#0a1120]/90 backdrop-blur-md rounded-2xl border border-blue-900/50 p-6 md:p-10 mb-6 shadow-[0_0_40px_rgba(59,130,246,0.1)] flex flex-col items-center overflow-hidden">
                  {/* Inner Tech Background */}
                  <div 
                    className="absolute inset-0 z-0 opacity-30 mix-blend-screen bg-cover bg-center pointer-events-none"
                    style={{ backgroundImage: `url('/robotics_hardware_bg.jpg')` }}
                  />
                  <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0a1120] via-[#0a1120]/40 to-transparent pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-center gap-4 mb-10 md:mb-12 w-full">
                    <span className="text-3xl md:text-4xl drop-shadow-md">⚡</span>
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-[0.15em] uppercase font-['Space_Grotesk'] drop-shadow-xl">
                      Top Prelim Innovators
                    </h2>
                  </div>
                  
                  {isLoading ? (
                    <div className="relative z-10 h-64 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="relative z-10 flex justify-center items-end gap-3 md:gap-8 pt-6 pb-2 w-full">
                      {/* 2nd Place */}
                      <div className="flex flex-col items-center w-[90px] md:w-[120px]">
                        <div className="mb-3 flex flex-col items-center">
                          <span className="text-3xl md:text-4xl mb-1 drop-shadow-md">🥈</span>
                          <span className="font-black text-neutral-300 font-['Space_Grotesk'] text-sm md:text-base drop-shadow-md">2ND</span>
                        </div>
                        <div className="w-full h-28 md:h-32 bg-neutral-400/10 backdrop-blur-sm border-2 border-neutral-300/80 rounded-t-xl shadow-[0_0_20px_rgba(212,212,216,0.2)] relative"></div>
                        <div className="mt-4 text-center w-full">
                          <div className="text-sm md:text-base font-black font-['Space_Grotesk'] text-neutral-200 truncate px-1 tracking-wide">{secondPlace ? secondPlace.name : "TBD"}</div>
                          <div className="text-sm md:text-base font-mono font-bold text-neutral-300 mt-1">{secondPlace ? secondPlace.score.toLocaleString() : "0"} <span className="text-[10px] text-neutral-500">PTS</span></div>
                        </div>
                      </div>
                      
                      {/* 1st Place */}
                      <div className="flex flex-col items-center w-[100px] md:w-[140px]">
                        <div className="mb-3 flex flex-col items-center">
                          <span className="text-4xl md:text-5xl mb-1 drop-shadow-lg">🥇</span>
                          <span className="font-black text-amber-400 font-['Space_Grotesk'] text-base md:text-lg drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">1ST</span>
                        </div>
                        <div className="w-full h-36 md:h-44 bg-amber-500/20 backdrop-blur-sm border-2 border-amber-400 rounded-t-xl shadow-[0_0_30px_rgba(251,191,36,0.4)] relative"></div>
                        <div className="mt-4 text-center w-full">
                          <div className="text-base md:text-xl font-black font-['Space_Grotesk'] text-amber-400 truncate px-1 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] tracking-wide">{firstPlace ? firstPlace.name : "TBD"}</div>
                          <div className="text-base md:text-lg font-mono font-black text-amber-300 mt-1">{firstPlace ? firstPlace.score.toLocaleString() : "0"} <span className="text-[10px] text-amber-500/80">PTS</span></div>
                        </div>
                      </div>

                      {/* 3rd Place */}
                      <div className="flex flex-col items-center w-[90px] md:w-[120px]">
                        <div className="mb-3 flex flex-col items-center">
                          <span className="text-3xl md:text-4xl mb-1 drop-shadow-md">🥉</span>
                          <span className="font-black text-orange-600 font-['Space_Grotesk'] text-sm md:text-base drop-shadow-md">3RD</span>
                        </div>
                        <div className="w-full h-20 md:h-24 bg-orange-600/20 backdrop-blur-sm border-2 border-orange-600/80 rounded-t-xl shadow-[0_0_20px_rgba(234,88,12,0.2)] relative"></div>
                        <div className="mt-4 text-center w-full">
                          <div className="text-sm md:text-base font-black font-['Space_Grotesk'] text-orange-500 truncate px-1 tracking-wide">{thirdPlace ? thirdPlace.name : "TBD"}</div>
                          <div className="text-sm md:text-base font-mono font-bold text-orange-400 mt-1">{thirdPlace ? thirdPlace.score.toLocaleString() : "0"} <span className="text-[10px] text-orange-600">PTS</span></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preliminary Rankings List */}
                <div className="bg-[#0a1120]/80 backdrop-blur-md rounded-2xl border border-blue-900/40 p-5 md:p-8 shadow-[0_0_30px_rgba(59,130,246,0.05)]">
                  <div className="flex items-center justify-between px-2 md:px-4 pb-3 mb-2 border-b border-blue-900/40 text-neutral-400 font-bold font-['Space_Grotesk'] text-[10px] md:text-xs tracking-widest uppercase">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-12 text-left">RANK</div>
                      <div>TEAM NAME</div>
                    </div>
                    <div className="text-right">ROUND 1 SCORE</div>
                  </div>
                  
                  {isLoading ? (
                    <div className="py-10 text-center flex flex-col items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                      <div className="text-blue-500/50 font-mono tracking-widest uppercase text-xs">Loading Live Rankings...</div>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {sortedTeams.map((team, idx) => {
                        let rankDisplay: React.ReactNode = (idx + 1).toString();
                        
                        if (team.score === 0) {
                          rankDisplay = "-";
                        } else if (idx === 0) {
                          rankDisplay = <span className="text-amber-400 font-black">🥇 #1</span>;
                        } else if (idx === 1) {
                          rankDisplay = <span className="text-neutral-300 font-black">🥈 #2</span>;
                        } else if (idx === 2) {
                          rankDisplay = <span className="text-orange-600 font-black">🥉 #3</span>;
                        } else {
                          rankDisplay = `#${idx + 1}`;
                        }

                        const isTop20 = finalRoundActive && idx < 20;
                        const key = team._id || team.id || `team-${idx}`;

                        return (
                          <div 
                            key={key}
                            className={`flex items-center justify-between p-3 md:p-4 rounded-lg hover:bg-blue-900/10 transition-colors duration-200 group border-b border-blue-900/10 last:border-0 ${isTop20 ? 'bg-blue-950/20' : ''}`}
                          >
                            <div className="flex items-center gap-4 md:gap-6 min-w-0">
                              <div className="w-12 text-left text-sm md:text-base font-bold text-neutral-400 font-mono group-hover:text-blue-400 transition-colors">
                                {rankDisplay}
                              </div>
                              <div className="truncate">
                                <div className="font-bold text-neutral-200 text-sm md:text-base tracking-wide group-hover:text-white transition-colors truncate">
                                  {team.name}
                                </div>
                                {isTop20 && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded font-semibold mt-1">
                                    ⭐ Top 20 Qualifier
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right pl-3 shrink-0">
                              <span className="text-cyan-400 font-mono text-sm md:text-base font-bold">
                                {team.score.toLocaleString()}
                              </span>
                              <span className="text-[10px] md:text-xs text-neutral-500 font-mono ml-1 font-semibold">
                                PTS
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {sortedTeams.length === 0 && (
                        <div className="p-10 text-center flex flex-col items-center justify-center">
                          <div className="text-neutral-500 font-mono tracking-widest uppercase text-xs">No teams ranked yet.</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </motion.div>
        )}
      </div>
    </div>
  );
}
