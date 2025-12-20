ARG PY_VERSION="3.13"

FROM python:${PY_VERSION}-alpine AS builder

ENV PIP_NO_WARN_ABOUT_ROOT_USER=1

WORKDIR /build

RUN apk add --no-cache gcc=15.2.0-r2 musl-dev=1.2.5-r21 libffi-dev=3.5.2-r0 libressl-dev=4.2.1-r0

COPY requirements.txt /build

RUN pip install --prefix=/build/venv --no-cache-dir --upgrade -r requirements.txt

FROM python:${PY_VERSION}-alpine

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV USE_DIRECT_GRANT=true

COPY --from=builder /build/venv /usr/local/
COPY . /app

WORKDIR /app

CMD ["python", "main.py"]
