export interface Question {
  id: number;
  text: string;
  key: "about" | "interests" | "hobbies";
}

export type RecordingSystem = {
  start: () => Promise<void>;
  stop: () => Promise<Blob>;
  isRecording: () => boolean;
};

export const questions: Question[] = [
  { id: 1, text: "Tell me about yourself", key: "about" },
  { id: 2, text: "What are your interests?", key: "interests" },
  { id: 3, text: "What are your hobbies?", key: "hobbies" },
]; 