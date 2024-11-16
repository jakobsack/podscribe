export interface Speaker {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Episode {
  id: number;
  name: string;
  link: string;
  description: string;
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
  starts_at: number;
  ends_at: number;
  created_at: Date;
  updated_at: Date;
}
