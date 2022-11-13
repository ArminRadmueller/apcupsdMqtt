FROM node:19.0-bullseye-slim
LABEL maintainer="Armin Radmüller"

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y apcupsd usbutils procps && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir -p /app

WORKDIR /app

VOLUME [ "/etc/apcupsd", "/var/log/apcupsd" ]

CMD [ "/sbin/apcupsd", "-b" ]