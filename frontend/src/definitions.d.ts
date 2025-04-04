export interface Speaker {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: number;
  title: string;
  link: string;
  description: string;
  published_at?: string;
  filename: string;
  has_audio_file: string;
  created_at: string;
  updated_at: string;
}

export interface EpisodeSpeaker {
  id: number;
  episode_id: number;
  speaker_id: number;
  created_at: string;
  updated_at: string;
}

export interface EpisodeDisplay {
  episode: Episode;
  episode_speakers: EpisodeSpeaker[];
  speakers: Speaker[];
  parts: Part[];
  approvals: Approval[];
}

export interface Part {
  id: number;
  episode_id: number;
  episode_speaker_id: number;
  text: string;
  part_type: number;
  starts_at: number;
  ends_at: number;
  created_at: string;
  updated_at: string;
}

export interface PartDisplay {
  part: Part;
  sentences: SentenceDisplay[];
  approvals: number;
}

export interface SentenceDisplay {
  sentence: Sentence;
  words: Word[];
  move_sentence?: "up" | "upnew" | "downnew" | "down";
}

export interface Sentence {
  id: number;
  part_id?: number;
  words_per_second: number;
  starts_at: number;
  ends_at: number;
  text: string;
}

export interface Word {
  id: number;
  sentence_id: number;
  starts_at: number;
  ends_at: number;
  probability: number;
  text: string;
  overwrite: string;
  hidden: boolean;
}

export interface Approval {
  part_id: number;
  user_id: number;
}

export interface ApprovalResult {
  approvals: number;
}

export enum PartType {
  Default = 0,
  Jingle = 1,
}

export interface Claims {
  role: RoleEnum;
}

export enum RoleEnum {
  Guest = 0,
  Reader = 1,
  Contributor = 2,
  Admin = 3,
}
