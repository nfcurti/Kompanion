"use client";

import { ChatPanel } from "@/components/chat/chat-panel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ActivityPanel } from "@/components/workspace/activity-panel";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export default function PlaygroundPage() {
  const { inspectorOpen } = useWorkspace();

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full">
      <ResizablePanel defaultSize={inspectorOpen ? "68" : "100"} minSize="40">
        <ChatPanel />
      </ResizablePanel>
      {inspectorOpen && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="32" minSize="22" maxSize="45">
            <ActivityPanel />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
