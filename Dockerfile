FROM public.ecr.aws/lambda/nodejs:20 AS build

WORKDIR /build

COPY . .

RUN dnf install -y jq unzip

RUN chmod 777 chrome-installer.sh && \
    ./chrome-installer.sh

RUN npm i && npm run build

FROM public.ecr.aws/lambda/nodejs:20

RUN dnf install -y atk cups-libs gtk3 libXcomposite alsa-lib \
    libXcursor libXdamage libXext libXi libXrandr libXScrnSaver \
    libXtst pango at-spi2-atk libXt xorg-x11-server-Xvfb \
    xorg-x11-xauth dbus-glib dbus-glib-devel nss mesa-libgbm && \
    dnf clean all && \
    rm -rf /var/cache/dnf
    
WORKDIR ${LAMBDA_TASK_ROOT}

COPY --from=build /opt /opt

COPY --from=build /build/index.js ./index.js

CMD [ "index.handler" ]
