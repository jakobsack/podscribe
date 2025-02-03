export interface Speaker {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Episode {
  id: number;
  title: string;
  link: string;
  description: string;
  has_audio_file: string;
  created_at: Date;
  updated_at: Date;
}

export interface EpisodeSpeaker {
  id: number;
  episode_id: number;
  speaker_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface EpisodeDisplay {
  episode: Episode;
  episode_speakers: EpisodeSpeaker[];
  speakers: Speaker[];
  parts: Part[];
}

export interface Part {
  id: number;
  episode_speaker_id: number;
  text: string;
  part_type: number;
  starts_at: number;
  ends_at: number;
  created_at: Date;
  updated_at: Date;
}

export interface PartDisplay {
  part: Part;
  sections: SectionDisplay[];
}

export interface SectionDisplay {
  section: Section;
  words: Word[];
  move_section?: "up" | "upnew" | "downnew" | "down";
}

export interface Section {
  id: number;
  words_per_second: number;
  starts_at: number;
  ends_at: number;
  text: string;
}

export interface Word {
  id: number;
  section_id: number;
  starts_at: number;
  ends_at: number;
  probability: number;
  text: string;
  overwrite: string;
  hidden: boolean;
}
