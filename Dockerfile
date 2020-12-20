FROM lambci/lambda:build-nodejs12.x

RUN yum install -y libpng-devel libjpeg-devel libwebp-tools libglvnd-glx libXi

COPY package.json ./
RUN npm install

COPY lib ./lib
COPY index.js index.js
COPY logo.png logo.png
COPY serveless.yaml serverless.yaml

CMD ./node_modules/.bin/serverless deploy