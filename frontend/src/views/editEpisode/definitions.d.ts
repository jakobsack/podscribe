export interface SpeakerPart {
  id: number;
  speaker: string;
  episodeSpeakerId: number;
  parts: NewPart[];
}

export interface NewPart {
  id: number;
  text: string;
  start: number;
}

export interface AudioControl {
  play: React.Dispatch<React.SetStateAction<boolean | undefined>>;
}
