"use client";

import React, { useState, useRef } from "react";
import { MotionDiv } from "@/components/motion/MotionDiv";
import { Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function DemoVideo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      setShowOverlay(false);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowOverlay(true);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            See AffinityBots in Action
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Watch how you can build and deploy AI agents in under 2 minutes—no coding required
          </p>
        </div>

        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-600/20 border-2 border-blue-500/30 backdrop-blur-sm shadow-2xl group">
            {/* Video Element */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              onPlay={() => {
                setIsPlaying(true);
                setShowOverlay(false);
              }}
              onPause={() => {
                setIsPlaying(false);
                setShowOverlay(true);
              }}
              onEnded={() => {
                setIsPlaying(false);
                setShowOverlay(true);
              }}
              playsInline
              preload="metadata"
            >
              <source src="/videos/Create-agent-9-22.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Play/Pause Overlay */}
            <AnimatePresence>
              {showOverlay && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 backdrop-blur-sm cursor-pointer"
                  onClick={handlePlay}
                >
                  <div className="text-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl hover:shadow-blue-500/50 transition-shadow duration-300"
                    >
                      <Play className="w-10 h-10 md:w-12 md:h-12 text-white ml-1" fill="currentColor" />
                    </motion.div>
                    <p className="text-white text-lg md:text-xl font-semibold mb-2">
                      Watch the Demo
                    </p>
                    <p className="text-blue-200 text-sm md:text-base">
                      See how easy it is to build AI agents
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Play/Pause Button (when video is playing) */}
            {!showOverlay && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={togglePlayPause}
                className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-300 hover:scale-110 opacity-0 group-hover:opacity-100"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" fill="currentColor" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                )}
              </motion.button>
            )}

            {/* Decorative grid pattern (only visible when paused) */}
            {showOverlay && (
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px'
                }}
              />
            )}

            {/* Animated glow effect (only visible when paused) */}
            {showOverlay && (
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-2xl opacity-20 animate-pulse pointer-events-none" />
            )}
          </div>

          {/* Video highlights */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
              <div className="text-3xl font-bold text-blue-500 mb-2">2 min</div>
              <p className="text-sm text-muted-foreground">Full walkthrough</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
              <div className="text-3xl font-bold text-purple-500 mb-2">7 steps</div>
              <p className="text-sm text-muted-foreground">From idea to deployment</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
              <div className="text-3xl font-bold text-cyan-500 mb-2">0 code</div>
              <p className="text-sm text-muted-foreground">Required to build</p>
            </div>
          </div>
        </MotionDiv>
      </div>
    </section>
  );
}
