# Dockerfile extending the generic Node image with application files for a
# single application.
FROM launcher.gcr.io/google/nodejs


RUN apt-get update && \
     apt-get install -yq --no-install-recommends \
     ffmpeg rubberband-cli libasound2 libatk1.0-0 libc6 libcairo2-dev libcups2 libdbus-1-3 \
     libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
     libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
     libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
     libnss3

RUN sudo add-apt-repository ppa:chris-needham/ppa && sudo apt-get update && sudo apt-get install audiowaveform
# Check to see if the the version included in the base runtime satisfies
# '>=4.3.2', if not then do an npm install of the latest available
# version that satisfies it.
#RUN /usr/local/bin/install_node '>=4.3.2'
COPY . /app/

RUN npm --unsafe-perm install
RUN npm i -D playwright