FROM python:3.14.8-slim-trixie@sha256:fbecd461fc72d21b2143c6eaba25143738079154a6d0ea3da3aec724f50eed4a
# Native tools are confined to this local offline runtime. Image ID and actual
# dpkg/tool/traineddata versions are recorded by parser:build and extraction.
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils tesseract-ocr tesseract-ocr-ben fonts-noto-core pango1.0-tools \
    && rm -rf /var/lib/apt/lists/*
COPY requirements-sandbox.txt /tmp/requirements-sandbox.txt
RUN pip install --no-cache-dir --only-binary=:all: -r /tmp/requirements-sandbox.txt
COPY askbd_ingestion /app/askbd_ingestion
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 OMP_THREAD_LIMIT=1
USER 65532:65532
ENTRYPOINT ["python", "-m", "askbd_ingestion.sandbox_entry"]
