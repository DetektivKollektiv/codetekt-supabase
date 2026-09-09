ARG WALG_BUILDER_IMAGE=golang:1.25.11-alpine3.23@sha256:60e626bbde32def8694687d03536ea4341b19e5f068e9a630225a1dfbd0505c9
ARG SUPABASE_POSTGRES_IMAGE=supabase/postgres:17.6.1.136@sha256:f371b5f3f2ac0a05703f33d6e6134515fb2498cab708fb948a0aeb7481467c00
FROM ${WALG_BUILDER_IMAGE} AS walg-builder

ARG WALG_VERSION=3.0.9
ARG WALG_SOURCE_SHA256=b06bc26c4865c07d0c269101910f63c7eedd03790b7c054a7da0980a7a9cc31d

RUN apk add --no-cache \
      ca-certificates \
      curl \
      gcc \
      libsodium-dev=1.0.20-r1 \
      musl-dev

WORKDIR /src
RUN curl --fail --show-error --location --retry 5 \
      "https://github.com/wal-g/wal-g/archive/refs/tags/v${WALG_VERSION}.tar.gz" \
      --output wal-g.tar.gz \
    && echo "${WALG_SOURCE_SHA256}  wal-g.tar.gz" | sha256sum -c - \
    && tar -xzf wal-g.tar.gz \
    && rm wal-g.tar.gz

WORKDIR /src/wal-g-${WALG_VERSION}
ENV GOEXPERIMENT=jsonv2
RUN go mod download
RUN CGO_ENABLED=1 go build \
      -buildvcs=false \
      -mod=readonly \
      -trimpath \
      -tags libsodium \
      -ldflags="-s -w \
        -X github.com/wal-g/wal-g/cmd/pg.buildDate=2026.08.20_14:26:20 \
        -X github.com/wal-g/wal-g/cmd/pg.gitRevision=3e49318 \
        -X github.com/wal-g/wal-g/cmd/pg.walgVersion=v${WALG_VERSION}" \
      -o /out/wal-g \
      ./main/pg

FROM ${SUPABASE_POSTGRES_IMAGE}

RUN apk add --no-cache libsodium=1.0.20-r1
COPY --from=walg-builder /out/wal-g /usr/local/bin/wal-g
RUN wal-g --version

LABEL org.opencontainers.image.title="Codetekt Supabase Postgres with WAL-G" \
      org.opencontainers.image.version="17.6.1.136-walg-3.0.9" \
      org.opencontainers.image.source="https://github.com/wal-g/wal-g/tree/v3.0.9"
