ARG PY_VERSION="3.13"
ARG PYTHON_ALPINE_DIGEST="sha256:420cd0bf0f3998275875e02ecd5808168cf0843cbb4d3c536432f729247b2acc"

FROM python:${PY_VERSION}-alpine@${PYTHON_ALPINE_DIGEST} AS builder

ENV PIP_NO_WARN_ABOUT_ROOT_USER=1

WORKDIR /build

RUN apk add --no-cache \
    binutils=2.45.1-r0 \
    gcc=15.2.0-r2 \
    gmp=6.3.0-r4 \
    isl26=0.26-r1 \
    jansson=2.14.1-r0 \
    libatomic=15.2.0-r2 \
    libffi-dev=3.5.2-r0 \
    libgcc=15.2.0-r2 \
    libgomp=15.2.0-r2 \
    libstdc++=15.2.0-r2 \
    linux-headers=6.16.12-r0 \
    mpc1=1.3.1-r1 \
    mpfr4=4.2.2-r0 \
    musl-dev=1.2.5-r23 \
    openssl-dev=3.5.6-r0 \
    pkgconf=2.5.1-r0 \
    zstd-libs=1.5.7-r2

COPY requirements.txt /build

RUN pip install --prefix=/build/venv --no-cache-dir --upgrade -r requirements.txt


FROM python:${PY_VERSION}-alpine@${PYTHON_ALPINE_DIGEST}

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

ENV PORT=80
ENV HOST="0.0.0.0"

COPY --from=builder /build/venv /usr/local/
COPY . /app

WORKDIR /app

RUN mkdir -p /scaffold && chmod 755 /scaffold

CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --proxy-headers --host $HOST --port $PORT"]
