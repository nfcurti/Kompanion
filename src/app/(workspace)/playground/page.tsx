"use client";

import { motion, useReducedMotion } from "motion/react";

import { ChatPanel } from "@/components/chat/chat-panel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ActivityPanel } from "@/components/workspace/activity-panel";
import { useWorkspace } from "@/components/workspace/workspace-provider";

const ease = [0.22, 1, 0.36, 1] as const;

export default function PlaygroundPage() {
  const { inspectorOpen } = useWorkspace();
  const reduceMotion = useReducedMotion();

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full min-h-0 min-w-0"
    >
      <ResizablePanel
        defaultSize={inspectorOpen ? "68" : "100"}
        minSize="40"
        className="min-h-0 min-w-0"
      >
        <ChatPanel />
      </ResizablePanel>

      {inspectorOpen ? (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel
            defaultSize="32"
            minSize="22"
            maxSize="45"
            className="min-h-0"
          >
            <motion.div
              className="h-full min-h-0 origin-right"
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, x: 28, filter: "blur(2px)" }
              }
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.28, ease }}
            >
              <ActivityPanel />
            </motion.div>
          </ResizablePanel>
        </>
      ) : null}
    </ResizablePanelGroup>
  );
}
