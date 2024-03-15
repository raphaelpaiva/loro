FROM ubuntu AS build
WORKDIR /app

RUN apt-get update && \
  apt-get install -y build-essential curl git \
  && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

RUN git clone https://github.com/ggerganov/whisper.cpp.git /app

# Uncomment for Apple Silicon
# ENV UNAME_M=arm64
# ENV UNAME_p=arm
# ENV LLAMA_NO_METAL=1
RUN make -j server

RUN /app/models/download-ggml-model.sh small
CMD ["/app/server", "-l", "pt", "-m", "/app/models/ggml-small.bin", "--host", "0.0.0.0", "--port", "8099", "-ac", "512"]
