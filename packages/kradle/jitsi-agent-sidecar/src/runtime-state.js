export function createRuntimeState() {
  const transcript = [];
  const participants = new Map();

  return {
    addTranscript(entry = {}) {
      const item = {
        speaker: entry.speaker || entry.name || 'unknown',
        text: entry.text || '',
        timestamp: entry.timestamp || new Date().toISOString(),
      };
      transcript.push(item);
      return item;
    },

    getTranscript() {
      return transcript.map((entry) => ({ ...entry }));
    },

    setParticipant(participant = {}) {
      const id = participant.id || participant.name;
      if (!id) return null;
      const current = {
        id,
        name: participant.name || id,
        joinedAt: participant.joinedAt || new Date().toISOString(),
        ...participant,
      };
      participants.set(id, current);
      return { ...current };
    },

    removeParticipant(participant = {}) {
      const id = participant.id || participant.name;
      if (!id) return null;
      const current = participants.get(id) || { id, name: participant.name || id };
      participants.delete(id);
      return { ...current, leftAt: participant.leftAt || new Date().toISOString() };
    },

    getParticipants() {
      return [...participants.values()].map((participant) => ({ ...participant }));
    },
  };
}
