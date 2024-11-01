FROM node:20-slim

RUN apt-get update && \
    apt-get install -y git vim && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    npm update -g npm && \
    npm i -g serverless
