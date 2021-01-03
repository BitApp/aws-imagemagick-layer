FROM lambci/lambda:build-nodejs12.x

RUN yum install -y libpng-devel libjpeg-devel libwebp-tools libglvnd-glx libXi fontconfig-devel libxml2-devel wget gcc tar
RUN wget https://sourceforge.net/projects/graphicsmagick/files/graphicsmagick/1.3.31/GraphicsMagick-1.3.31.tar.gz
RUN tar zxvf GraphicsMagick-1.3.31.tar.gz
RUN cd GraphicsMagick-1.3.31 && ./configure --prefix=/var/task/graphicsmagick --enable-shared=no --enable-static=yes && make && make install
RUN rm -rf GraphicsMagick-1.3.31/

RUN wget http://www.imagemagick.org/download/ImageMagick-7.0.10-53.tar.gz
RUN tar zxvf ImageMagick-7.0.10-53.tar.gz
RUN cd ImageMagick-7.0.10-53 && ./configure --prefix=/var/task/imagemagick --enable-shared=no --enable-static=yes && make && make install
RUN rm -rf ImageMagick-7.0.10-53/

COPY package.json ./
RUN npm install
COPY serveless.yaml serverless.yaml

RUN mkdir layer && mkdir layer/bin && cp /var/task/graphicsmagick/bin/gm ./layer/bin && \
cp /var/task/imagemagick/bin/convert ./layer/bin && cp /var/task/imagemagick/bin/magick ./layer/bin && \
cp /var/task/imagemagick/bin/stream ./layer/bin && cp /var/task/imagemagick/bin/identify ./layer/bin
RUN mkdir layer/sharedlib && cp /lib64/libjpeg.so.62 ./layer/sharedlib \
&& cp /lib64/libpng15.so.15 ./layer/sharedlib && cp /lib64/libgomp.so.1 ./layer/sharedlib && \
cp /lib64/libfontconfig.so.1 ./layer/sharedlib && cp /lib64/libfreetype.so.6 ./layer/sharedlib && \
cp /lib64/libexpat.so.1 ./layer/sharedlib && cp /lib64/libuuid.so.1 ./layer/sharedlib && \
cp /lib64/libbz2.so.1 ./layer/sharedlib && cp /lib64/libdl.so.2 ./layer/sharedlib && \
cp /lib64/liblzma.so.5 ./layer/sharedlib && cp /lib64/libxml2.so.2 ./layer/sharedlib

CMD ./node_modules/.bin/serverless deploy