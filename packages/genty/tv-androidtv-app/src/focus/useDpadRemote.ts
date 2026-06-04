import { useEffect, useState } from 'react';
import { TVEventHandler } from 'react-native';

export function useDpadRemote(): string | null {
  const [eventType, setEventType] = useState<string | null>(null);
  useEffect(() => {
    const handler = new TVEventHandler();
    handler.enable(undefined, (_, event) => {
      setEventType(event?.eventType ?? null);
    });
    return () => {
      handler.disable();
    };
  }, []);
  return eventType;
}
