"use client";
import { createContext, useContext } from "react";
import { useEventStream, StreamEvent } from "@/hooks/use-event-stream";

interface EventStreamContextValue {
  connected: boolean;
  lastEvent: StreamEvent | null;
  error: string | null;
}

const EventStreamContext = createContext<EventStreamContextValue | null>(null);

export function EventStreamProvider({ children }: { children: React.ReactNode }) {
  const { connected, lastEvent, error } = useEventStream();

  return (
    <EventStreamContext.Provider value={{ connected, lastEvent, error }}>
      {children}
    </EventStreamContext.Provider>
  );
}

export function useEventStreamContext() {
  const context = useContext(EventStreamContext);
  if (!context) {
    throw new Error("useEventStreamContext must be used within EventStreamProvider");
  }
  return context;
}
