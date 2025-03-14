import type { EpisodeDisplay } from "../../definitions";
import { Link, useLoaderData } from "react-router-dom";
import type { ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from "react-router-dom";
import { TranscriptTableComponent } from "./TranscriptTable";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { EpisodeSpeakerComponent } from "./EpisodeSpeaker";
import { jwtFetch } from "../../common/jwtFetch";
import { editEpisodeSpeakerAction } from "./EditEpisodeSpeaker";
import { editPartAction } from "./EditPart";
import { Timestamp } from "../../common/Timestamp";

export const episodeLoader = (async (args: LoaderFunctionArgs) => {
  const episodeId = args.params.episodeId;
  const response = await jwtFetch(`/api/episodes/${episodeId}/display`);
  const result = (await response.json()) as EpisodeDisplay;
  return { episode: result };
}) satisfies LoaderFunction;

export const episodeAction = (async (event: ActionFunctionArgs) => {
  const formData = await event.request.formData();

  const pressedButton = formData.get("function");
  if (!pressedButton) {
    throw new Error("What just happened?");
  }

  if (pressedButton === "editEpisodeSpeaker") {
    return editEpisodeSpeakerAction(event, formData);
  }

  if (pressedButton === "editPart") {
    return editPartAction(event, formData);
  }

  throw new Error(`Unknown action: ${pressedButton}`);
}) satisfies ActionFunction;

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
        {episode?.episode.has_audio_file && (
          <div className="fixed right-4 w-24 rounded-lg border border-gray-300 bg-slate-100 p-2 text-right dark:border-gray-500 dark:bg-slate-800">
            <audio id="audio" preload="none">
              <source id="audioSrc" type="audio/mpeg" />
              <track kind="captions" />
            </audio>
            <span>
              <Timestamp seconds={curTime || 0} />
            </span>
            <br />
            <span>
              <Timestamp seconds={duration || 0} />
            </span>
            <br />
            {playing ? (
              <div
                onClick={() => {
                  setPlaying(false);
                }}
                className="flex flex-row"
              >
                <svg
                  width="1.6em"
                  height="1.45em"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Pause</title>
                  <g>
                    <g>
                      <rect x="40.0" y="60.885" width="148.088" height="390.23" />
                      <rect x="303.912" y="60.885" width="148.088" height="390.23" />
                    </g>
                  </g>
                </svg>
                <span>Pause</span>
              </div>
            ) : (
              <div
                onClick={() => {
                  curTime ? setPlaying(true) : startAudioAt(0);
                }}
                className="flex flex-row content-center"
              >
                <svg
                  width="1.6em"
                  height="1.45em"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Play</title>
                  <g>
                    <path d="M15 12.3301L9 16.6603L9 8L15 12.3301Z" />
                  </g>
                </svg>
                <span>Play</span>
              </div>
            )}
          </div>
        )}
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          {episode ? (
            <>
              <h1 className="pb-2 font-semibold text-3xl text-title underline">{episode.episode.title}</h1>

              <p>
                <Link to="./.." className="hover:link btn variant-soft w-44 p-1">
                  Back to normal view
                </Link>
              </p>

              <div className="grid items-start gap-12 md:grid-cols-2 md:gap-0 lg:gap-12">
                <div className="pt-2 lg:pr-24">
                  <Markdown>{episode.episode.description}</Markdown>
                </div>
                <div className="card variant-outlined overflow-hidden ">
                  <h3 className="pb-2 font-semibold text-title text-xl underline">Speakers</h3>

                  <ul className="mt-8 divide-y border-y *:flex *:items-center *:gap-3 *:py-1">
                    {episode.episode_speakers.map((x) => (
                      <li
                        key={x.id}
                        onClick={selectHighlightedSpeaker(x.id)}
                        onKeyDown={selectHighlightedSpeaker(x.id)}
                        className={highlightedSpeaker === x.id ? "bg-slate-100 dark:bg-slate-800" : ""}
                      >
                        <EpisodeSpeakerComponent episodeSpeaker={x} speakers={episode.speakers} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <h2 className="podscribe">Transcript</h2>

              <p>When editing the probability of the word is encoded in the color.</p>
              <div className="mt-3 mb-3 flex flex-row flex-wrap">
                <div className="group btn sz-sm m-1 bg-gray-200 dark:bg-gray-700">manual</div>
                <div className="group btn sz-sm m-1 bg-blue-200 dark:bg-blue-700">&gt; 99%</div>
                <div className="group btn sz-sm m-1 bg-green-200 dark:bg-green-700">&gt; 90%</div>
                <div className="group btn sz-sm m-1 bg-yellow-200 dark:bg-yellow-700">&gt; 70%</div>
                <div className="group btn sz-sm m-1 bg-red-200 dark:bg-red-700">&lt;= 70%</div>
              </div>

              <TranscriptTableComponent
                episode={episode.episode}
                episodeSpeakers={episode.episode_speakers}
                parts={episode.parts}
                speakers={episode.speakers}
                highlightedSpeaker={highlightedSpeaker}
                startAudioAt={startAudioAt}
                curTime={curTime}
                approvals={episode.approvals}
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
