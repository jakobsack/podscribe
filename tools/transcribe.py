#!/usr/bin/env python
import datetime
import json
import os
import subprocess
import sys
import torch

from pathlib import Path
from pyannote.audio import Pipeline

pipeline = None
log_path = None


def run():
    global log_path
    log_path = Path("transcribe.log")

    if len(sys.argv) < 1:
        log("Command needs one argument (path to mp3 file)")
        exit(1)

    mp3_file = sys.argv[1]
    if not os.path.exists(mp3_file):
        log(f"Unable to find mp3 file {mp3_file}")
        exit(1)

    log(f"Processing {mp3_file}")

    basename = os.path.basename(mp3_file)
    outputname = os.path.splitext(basename)[0]
    output_folder = Path(f"output/{outputname}")
    output_folder.mkdir(parents=True, exist_ok=True)

    complete_json = output_folder.joinpath("complete.json")
    if complete_json.exists():
        log("complete.json exists")
        exit()

    log("Switching to file log")
    log_path = output_folder.joinpath("transcribe.log")

    convert_to_wav(mp3_file, output_folder)
    convert_to_mp3(output_folder)
    run_diarization(output_folder)
    sections = load_sections(output_folder)

    length = len(sections)
    for i in range(length):
        log(f"Converting section {i+1} of {length}")
        section = sections[i]
        split_file(output_folder, section, i)

    to_convert = []
    for i in range(length):
        section_json = output_folder.joinpath(f"{i}.wav.json")
        section_wav = output_folder.joinpath(f"{i}.wav")
        if section_json.exists():
            log(f"{i}.wav.json already exists")
        else:
            to_convert.append(str(section_wav))

    if len(to_convert) == 0:
        log("All files already have been transcribed")
    else:
        log("Started transcription")
        command = [
            "./whisper.cpp/main",
            "--model",
            "./whisper.cpp/models/ggml-large-v3.bin",
            "--output-json-full",
            "--language",
            "en",
            *to_convert,
        ]
        log(f"Executing: {' '.join(command)}")
        _ = subprocess.check_output(command)
        log("Finished transcription")

    log("Creating complete.json")
    data = {"transcription": []}

    for i in range(length):
        section = sections[i]
        section_json = output_folder.joinpath(f"{i}.wav.json")
        try:
            with open(section_json, mode="r", encoding="utf-8") as openfile:
                transcription_result = json.load(openfile)
        except:
            log(f"Unable to load {section_json} in utf-8")
            with open(section_json, mode="r", encoding="LATIN1") as openfile:
                transcription_result = json.load(openfile)

        if i == 0:
            data["systeminfo"] = transcription_result["systeminfo"]
            data["model"] = transcription_result["model"]
            data["params"] = transcription_result["params"]
            data["result"] = transcription_result["result"]

        expected_duration = (section["end"] - section["start"]) * 1000.0
        sentences = []
        text = ""
        for section_result in transcription_result["transcription"]:
            words = []
            # Sanity check
            if section_result["offsets"]["to"] - expected_duration > 1000.0:
                log(
                    f"Skipping section in file {i}.wav.json that supposedly is over a second longer than the actual snippet. Overlength: {section_result["offsets"]["to"] - expected_duration}"
                )
                continue

            sentence_duration = (
                section_result["offsets"]["to"] - section_result["offsets"]["from"]
            )
            if sentence_duration <= 0:
                log("Skipping section in file {i}.wav.json that has length 0")
                continue

            # Add text
            sentence_text = section_result["text"].strip()
            total_words = len(sentence_text.split())
            words_per_second = total_words / sentence_duration * 1000
            text += section_result["text"]
            for token in section_result["tokens"]:
                if token["text"].startswith("["):
                    continue

                if token["text"].startswith(" "):
                    words.append(
                        {
                            "text": token["text"].strip(),
                            "start": (token["offsets"]["from"] / 1000.0)
                            + section["start"],
                            "end": (token["offsets"]["to"] / 1000.0) + section["start"],
                            "probability": token["p"],
                        }
                    )
                else:
                    words[-1]["text"] += token["text"]
                    words[-1]["end"] = (token["offsets"]["to"] / 1000.0) + section[
                        "start"
                    ]
                    if token["p"] < words[-1]["probability"]:
                        words[-1]["probability"] = token["p"]

            sentences.append(
                {
                    "text": section_result["text"].strip(),
                    "words": words,
                    "start": (section_result["offsets"]["from"] / 1000.0)
                    + section["start"],
                    "end": (section_result["offsets"]["to"] / 1000.0)
                    + section["start"],
                    "words_per_second": words_per_second,
                }
            )

        data["transcription"].append(
            {**section, "text": text.strip(), "sentences": sentences}
        )

    # Dump output
    log("Transcription complete, writing file")
    with open(complete_json, mode="w", encoding="utf-8") as outfile:
        outfile.write(json.dumps(data, indent=2))
        outfile.write("\n")

    # Clean files (wav is big and easy to recreate)
    log("Cleaning up wav files")
    files = os.listdir(str(output_folder))
    for file in files:
        file_path = f"{output_folder}/{file}"
        if not os.path.isfile(file_path) or not file.endswith(".wav"):
            continue

        os.unlink(file_path)
    log("Done")


def convert_to_wav(mp3_file, output_folder):
    output_file = output_folder.joinpath("converted.wav")
    if output_file.exists():
        log(f"File {mp3_file} already has been converted")
        return

    command = [
        "ffmpeg",
        "-y",
        "-i",
        mp3_file,
        "-loglevel",
        "panic",
        "-ar",
        "16000",
        "-ac",
        "1",
        "-c:a",
        "pcm_s16le",
        str(output_file),
    ]
    log(f"Executing: {' '.join(command)}")
    _ = subprocess.check_output(command)


def convert_to_mp3(output_folder):
    wav_file = output_folder.joinpath("converted.wav")
    output_file = output_folder.joinpath("tiny.mp3")
    if output_file.exists():
        log(f"File {wav_file} already has been converted")
        return

    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(wav_file),
        "-loglevel",
        "panic",
        "-b:a",
        "24k",
        str(output_file),
    ]
    log(f"Executing: {' '.join(command)}")
    _ = subprocess.check_output(command)


def run_diarization(output_folder):
    global pipeline
    result_path = output_folder.joinpath("diarization.json")

    if result_path.exists():
        log("diarization already has been run")
        return

    if pipeline == None:
        log(f"Initializing diarization pipeline")
        auth_token = os.environ.get("HF_TOKEN")
        pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1", use_auth_token=auth_token
        )

        pipeline.to(torch.device("mps"))

    log(f"Started diarization")
    diarization = pipeline(output_folder.joinpath("converted.wav"))
    log(f"Finished diarization")

    speakers = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        speakers.append({"start": turn.start, "end": turn.end, "speaker": speaker})

    with open(result_path, mode="w", encoding="utf-8") as outfile:
        outfile.write(json.dumps(speakers, indent=2))
        outfile.write("\n")


def load_sections(output_folder):
    file_path = output_folder.joinpath("diarization.json")
    with open(file_path, mode="r", encoding="utf-8") as openfile:
        return json.load(openfile)


def split_file(output_folder, section, i):
    section_wav = output_folder.joinpath(f"{i}.wav")
    section_json = output_folder.joinpath(f"{i}.wav.json")
    if section_wav.exists() or section_json.exists():
        log(f"{i}.wav already exists")
        return

    log(f"Creating {i}.wav")
    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(output_folder.joinpath("converted.wav")),
        "-loglevel",
        "panic",
        "-ss",
        str(section["start"]),
        "-to",
        str(section["end"]),
        "-c",
        "copy",
        str(section_wav),
    ]
    log(f"Executing: {' '.join(command)}")
    _ = subprocess.check_output(command)

    # whisper-cpp requires files to be at least 1 second long.
    # However, trimming right at 1.0 never worked out. Go for 1.1 seconds
    if section["end"] - section["start"] >= 1.1:
        return

    # Extend by 1s by padding with silence
    extended_wav = output_folder.joinpath("extended.wav")
    log(f"Extending {section_wav}")
    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(section_wav),
        "-loglevel",
        "panic",
        "-af",
        "apad=pad_dur=2",
        str(extended_wav),
    ]
    log(f"Executing: {' '.join(command)}")
    _ = subprocess.check_output(command)

    # Extend by 1s by padding with silence
    log(f"Trimming {section_wav}")
    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(extended_wav),
        "-loglevel",
        "panic",
        "-ss",
        "0.0",
        "-to",
        "1.1",
        str(section_wav),
    ]
    log(f"Executing: {' '.join(command)}")
    _ = subprocess.check_output(command)


def log(input):
    global log_path
    print(input)
    with open(log_path, mode="a", encoding="utf-8") as outfile:
        outfile.write(f"{datetime.datetime.now()} {input}\n")


if __name__ == "__main__":
    run()
