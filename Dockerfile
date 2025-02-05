FROM node:22-bookworm AS builder

ENV PATH="/root/.cargo/bin:$PATH"
RUN apt-get update \
  && apt-get upgrade -y \
  && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

COPY --chown=default:users . /app
WORKDIR /app

RUN cd frontend \
  && npm ci \
  && npm run build \
  && cd .. \
  && cargo build --release

FROM debian:testing-slim

RUN apt-get update \
  && apt-get upgrade -y \
  && useradd -d /app default \
  && mkdir -p /app/data \
  && mkdir -p /app/config \
  && chown -R default:users /app \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/podscribe-cli /app/podscribe-cli
COPY --from=builder /app/frontend/dist /app/frontend/dist
COPY --from=builder /app/assets /app/assets

WORKDIR /app
USER default

VOLUME /app/data
EXPOSE 5150

CMD ["/app/podscribe-cli", "start", "--environment=production"]
