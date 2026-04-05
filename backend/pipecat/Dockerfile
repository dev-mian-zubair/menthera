# ===== Stage 1: Build dependencies =====
FROM --platform=linux/amd64 python:3.11-slim-bookworm AS builder
WORKDIR /app

COPY requirements.txt .
RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
  && pip install --no-cache-dir --prefix=/install -r requirements.txt \
  && apt-get purge -y build-essential && apt-get autoremove -y && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# ===== Stage 2: Runtime =====
FROM --platform=linux/amd64 python:3.11-slim-bookworm
WORKDIR /app

# ffmpeg is required for audio processing (pydub/pipecat audio pipeline)
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /usr/local
COPY . .

RUN useradd --create-home --shell /bin/bash pipecat \
    && chown -R pipecat:pipecat /app
USER pipecat

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD pgrep -f "python main.py" || exit 1

CMD ["python", "main.py"]
