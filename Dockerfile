FROM public.ecr.aws/lambda/nodejs:22 AS build

WORKDIR /build
COPY . .

# Playwrightのブラウザパスを設定
ENV PLAYWRIGHT_BROWSERS_PATH=/build/.cache/ms-playwright

# ビルドにesbuildが必要なので--omit=devしない
RUN npm ci
RUN npx playwright install chromium --only-shell
RUN npm run build

RUN npm ci --omit=dev --ignore-scripts

FROM public.ecr.aws/lambda/nodejs:22

# Playwrightのブラウザパスを設定
ENV PLAYWRIGHT_BROWSERS_PATH=${LAMBDA_TASK_ROOT}/.cache/ms-playwright

# Playwrightに必要なシステム依存関係をインストール
RUN dnf install -y \
    atk \
    cups-libs \
    gtk3 \
    libXcomposite \
    libXdamage \
    libXrandr \
    alsa-lib \
    mesa-libgbm \
    pango \
    libXi \
    libXtst \
    nss \
    && dnf clean all

COPY --from=build /build/index.js ${LAMBDA_TASK_ROOT}/
COPY --from=build /build/node_modules ${LAMBDA_TASK_ROOT}/node_modules
# Playwrightのブラウザをコピー
COPY --from=build /build/.cache/ms-playwright ${LAMBDA_TASK_ROOT}/.cache/ms-playwright

CMD ["index.handler"]
