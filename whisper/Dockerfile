FROM ubuntu
WORKDIR /app

RUN apt update && apt install -y nvidia-cuda-toolkit git build-essential
ENV CUDA_DOCKER_ARCH=compute_75
ENV GGML_CUDA=1

RUN git clone https://github.com/ggerganov/whisper.cpp.git /app
RUN make

RUN rm -rf /usr/lib/x86_64-linux-gnu/libnvidia-ml.so.1 \
    /usr/lib/x86_64-linux-gnu/libcuda.so.1 \
    /usr/lib/x86_64-linux-gnu/libcudadebugger.so.1 \
    /var/lib/apt/lists/* \
    /var/cache/apt/archives/*

CMD ["/app/server", "-l", "pt", "-m", "/app/models/ggml-large-v3.bin", "--host", "0.0.0.0", "--port", "8080"]
