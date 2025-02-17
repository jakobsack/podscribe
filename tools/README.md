# Tools

This folder contains files used to do the actual transcription of the files.

You can use those tools to transcribe some files, but by no means expect this
document to be a step-by-step guide.

The guide expects you to run these transcription tools on an Apple computer
with **Apple Silicon**. Other machines for sure can handle the work as well,
but the Mac Mini M1 was the fastest computer for this task available to me.

# Required programs

* **ffmpeg** - Tool used to convert the audio files
* **python3** - Python. Use it from [Homebrew](brew.sh) or from whatever
  XCode brings. I'm not a python developer, I have no clue what's best
* **pyannote** - This library is used to determine which speaker is talking.
  Pyannote is a python package that can be installed using pip
  (`pip3 install pyannote.audio`)
* **whisper.cpp** - This tool is used to do the transcription. It is way
  faster than the python library and can make use of the Apple Neural Engine.

  The version shipped in *Homwebrew* does not include support for the Neural
  Engine, so you have to compile the stuff yourself from the source code.

  ```sh
  git clone https://github.com/ggerganov/whisper.cpp.git
  cd whisper.cpp
  WHISPER_COREML=1 make -j
  ```

# Required data

For pyannote you need a Hugginface token. Follow the guide at
[github](https://github.com/pyannote/pyannote-audio?tab=readme-ov-file#tldr)

For Whisper get the `ggml-large-v3.bin` and
`ggml-large-v3-turbo-encoder.mlmodelc.zip` from
[Huggingface](https://huggingface.co/ggerganov/whisper.cpp/tree/main).
Put the bin file into the `whisper.cpp/model` folder and extract the
zip file next to it.

# Workflow

1. Download the files to transcribe and put it into the `input` folder
1. Run the transcription:
   `find ./input -name "32*.mp3" -exec ./transcribe.py {} \;`

   On my Mac Mini M1 base model it takes about one hour to transcribe
   a 90 minute episode.
1. Collect the resulting JSON files:
   `find ./output -name complete.json -exec ./collect.sh {} \;`
1. Run `npm clean-install` to install the dependencies of the javascript scripts
1. Create a file called `settings.json` with the following content:
   ```json
   {
    "hostname": "http://localhost:5150",
    "token": "ey...",
    "rssFeed": "http://feeds.libsyn.com/00000/rss",
    "cropDescriptionAt": "A sentence that appears in every show description. Leave blank if not required."
   }
   ```

   Note that the token needs to be updated after it expires.
1. Run `node clean-file.mjs` to remove artifacts produced by whisper.
1. Run `node upload.mjs` to upload the files.
1. Run `node patch-data.mjs` to add title, publishing date and description
   to the episodes.
