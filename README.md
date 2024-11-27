# Podscribe

Podscribe is meant to grow into a tool that can be used to collaboratively work
on podcast transcriptions.

The backend is written in Rust using the [Loco framework](https://loco.rs), the
frontend is a React app written in TypeScript.

# Code quality

I've been programming for years, but I'm relatively new to Rust, the Loco
framework and React. So if the code looks like I had no idea of what I'm
doing: yep, that's the case.

Also, the data structure and users workflow is by no means finished yet. So
expect a lot of changes all over the place.

# Workflow

1. Transcribe the podcast using pyannote and whisper.cpp. You can find scripts
   for that in the `tools` folder
1. Upload the resulting file in Podscribe
1. Collaboratively improve the transcription

# Deployment

The project just started, better do not install it on your machine / server
unless you know what you are doing.

# Development

To get started with the development of Podscribe, follow these steps:

```sh
cd frontend
npm clean-install && npm run build
cd ..
cargo loco start
```

# Running podscribe in a container

```sh
docker build -t podscribe:latest .
docker run --volume "$(pwd)/config/production.yaml:/app/config/production.yaml" -p 5150:5150 podscribe:latest
```
