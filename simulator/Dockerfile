ARG PY_VERSION="3.13"
ARG PYTHON_ALPINE_DIGEST="sha256:db66119d6609a3a941a9433b225f4e13d33c459cede097cf3ec2fc4d1bd314b2"

FROM python:${PY_VERSION}-alpine@${PYTHON_ALPINE_DIGEST} AS builder

ENV PIP_NO_WARN_ABOUT_ROOT_USER=1

WORKDIR /build

RUN apk add --no-cache \
    binutils=2.45.1-r1 \
    gcc=15.2.0-r5 \
    gmp=6.3.0-r4 \
    isl26=0.26-r2 \
    jansson=2.15.0-r0 \
    libatomic=15.2.0-r5 \
    libffi-dev=3.5.2-r1 \
    libgcc=15.2.0-r5 \
    libgomp=15.2.0-r5 \
    libstdc++=15.2.0-r5 \
    linux-headers=7.0.0-r1 \
    mpc1=1.3.1-r1 \
    mpfr4=4.2.2-r0 \
    musl-dev=1.2.6-r2 \
    libcrypto3=3.5.7-r0 \
    libssl3=3.5.7-r0 \
    openssl-dev=3.5.7-r0 \
    pkgconf=2.5.1-r0 \
    zstd-libs=1.5.7-r2

COPY requirements.txt /build

RUN pip install --prefix=/build/venv --no-cache-dir --upgrade -r requirements.txt

FROM python:${PY_VERSION}-alpine@${PYTHON_ALPINE_DIGEST}

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV USE_DIRECT_GRANT=true

COPY --from=builder /build/venv /usr/local/
COPY . /app

WORKDIR /app

CMD ["python", "main.py"]
