import type { EpisodeDisplay } from "../../definitions";
import { Link, useLoaderData } from "react-router-dom";
import type { LoaderFunction, LoaderFunctionArgs } from "react-router-dom";
import { TranscriptTableComponent } from "./TranscriptTable";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { EpisodeSpeakerComponent } from "./EpisodeSpeaker";
import { jwtFetch } from "../../common/jwtFetch";

export const episodeLoader = (async (args: LoaderFunctionArgs) => {
  const episodeId = args.params.episodeId;
  const response = await jwtFetch(`/api/episodes/${episodeId}/display`);
  const result = (await response.json()) as EpisodeDisplay;
  return { episode: result };
}) satisfies LoaderFunction;

export const EpisodeComponent = () => {
  const { episode } = useLoaderData() as { episode: EpisodeDisplay };

  const [highlightedSpeaker, setHighlightedSpeaker] = useState(0);
  const selectHighlightedSpeaker = (speakerId: number) => {
    return () => {
      setHighlightedSpeaker(speakerId);
    };
  };

  const [duration, setDuration] = useState<number | undefined>();
  const [curTime, setCurTime] = useState<number>(0);
  const [playing, setPlaying] = useState(false);
  const [clickedTime, setClickedTime] = useState<number | null>();
  const [audioLoaded, setAudioLoaded] = useState(false);

  useEffect(() => {
    const audio = document.getElementById("audio") as HTMLAudioElement;
    if (!audio) return;

    const setAudioData = () => {
      if (audio) {
        setDuration(audio.duration);
        setCurTime(audio.currentTime);
      }
    };

    const setAudioTime = () => {
      setCurTime(audio.currentTime);
    };

    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);

    playing ? audio.play() : audio.pause();

    if (clickedTime && clickedTime !== curTime) {
      audio.currentTime = clickedTime;
      setClickedTime(null);
    }

    return () => {
      audio.removeEventListener("loadeddata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
    };
  }, [clickedTime, playing, curTime]);

  const startAudioAt = (position: number) => {
    if (!episode?.episode.has_audio_file) return;
    if (audioLoaded) {
      if (position) {
        setClickedTime(position);
        if (!playing) {
          setPlaying(true);
        }
      }
      return;
    }

    const url = `/api/episodes/${episode.episode.id}/audio`;
    const audioSource = document.getElementById("audioSrc") as HTMLSourceElement;
    const audio = document.getElementById("audio") as HTMLAudioElement;
    if (!audioSource || !audio) {
      return;
    }

    jwtFetch(url).then((result) => {
      result.blob().then((blob) => {
        if (blob) {
          audioSource.src = URL.createObjectURL(blob);

          // Load the new resource
          audio.load();
          audio.addEventListener(
            "canplaythrough",
            () => {
              setAudioLoaded(true);
              setClickedTime(position);
              setPlaying(true);
              console.info("Ready!", audioSource.src);
            },
            { once: true },
          );
        } else {
          console.warn("Can not load");
        }
      });
    });
  };

  return (
    <section className="relative">
      <div className="relative">
        {episode?.episode.has_audio_file ? (
          <div className="fixed right-4 border-gray-300 border rounded">
            <audio id="audio" controls preload="none">
              <source id="audioSrc" type="audio/mpeg" />
              <track kind="captions" />
            </audio>
            <span>{curTime.toFixed(2)}</span>
            <br />
            <span>{duration?.toFixed(2)}</span>
            <br />
            {playing ? (
              <span
                onClick={() => {
                  setPlaying(false);
                }}
              >
                Pause
              </span>
            ) : (
              <span
                onClick={() => {
                  setPlaying(true);
                }}
              >
                Play
              </span>
            )}
          </div>
        ) : (
          <></>
        )}
        <div className="mx-auto px-6 max-w-7xl md:px-12">
          {episode ? (
            <>
              <h1 className="text-3xl text-title font-semibold pb-2 underline">{episode.episode.title}</h1>

              <p>
                <Link to="./.." className="hover:link ">
                  Back to normal view
                </Link>
              </p>

              <div className="grid gap-12 md:gap-0 md:grid-cols-2 items-start lg:gap-12">
                <div className="lg:pr-24 pt-2">
                  <Markdown>{episode.episode.description}</Markdown>
                </div>
                <div className="card variant-outlined overflow-hidden ">
                  <h3 className="text-xl text-title font-semibold pb-2 underline">Speakers</h3>

                  <ul className="mt-8 divide-y border-y *:py-1 *:flex *:items-center *:gap-3">
                    {episode.episode_speakers.map((x) => (
                      <li
                        key={x.id}
                        onClick={selectHighlightedSpeaker(x.id)}
                        onKeyDown={selectHighlightedSpeaker(x.id)}
                        className={highlightedSpeaker === x.id ? "bg-slate-100" : ""}
                      >
                        <EpisodeSpeakerComponent episodeSpeaker={x} speakers={episode.speakers} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <h2 className="text-2xl text-title font-semibold pb-2 underline">Transcript</h2>

              <p>When editing the probability of the word is encoded in the color.</p>
              <div className="flex flex-row flex-wrap">
                <div className="group btn sz-sm m-1 bg-gray-200">manual</div>
                <div className="group btn sz-sm m-1 bg-blue-200">&gt; 99%</div>
                <div className="group btn sz-sm m-1 bg-green-200">&gt; 90%</div>
                <div className="group btn sz-sm m-1 bg-yellow-200">&gt; 70%</div>
                <div className="group btn sz-sm m-1 bg-red-200">&lt;= 70%</div>
              </div>

              <TranscriptTableComponent
                episode={episode.episode}
                episodeSpeakers={episode.episode_speakers}
                parts={episode.parts}
                speakers={episode.speakers}
                highlightedSpeaker={highlightedSpeaker}
                startAudioAt={startAudioAt}
                curTime={curTime}
              />
            </>
          ) : (
            <strong>Loading</strong>
          )}
        </div>
      </div>
    </section>
  );
};
