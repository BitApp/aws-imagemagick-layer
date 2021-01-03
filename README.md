# AWS GraphicsMagick imagemMagick lambda layer

## Introduction / 介绍

Amazon Lambda provides very convenient functions that allow us to directly execute the code we need on the server, such as processing images, adding watermarks, etc., we take image processing as an example, we need to use some system-level executable files, lambda itself The layer mechanism is provided to allow us to upload the compiled files to AWS for lambda invocation. This project is compiled and uploaded to the layer through serveless.

Amazon Lambda 提供了非常方便的功能可以让我们可以直接在服务器上执行我们需要的代码，比如处理图片，加水印等等，但是我们以处理图片为例，需要用到一些系统层面的exe，lambda本身提供layer机制可以让我们把编译好的文件传到AWS来供lambda调用，这个项目通过serveless来实现编译和上传到layer

## Usage / 用法

1. open serverless.sh and update AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY to your own KEY

    serverless.sh 里修改 AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY 为自己的 KEY

```bash

bash serveless.sh

```

## Bin Included / 包含的编译文件


### graphicsMagick

```bash

gm

```

### imageMagick

```bash

convert magick stream identify

```

### sharelib

```bash

libjpeg libpng15 libgomp libfontconfig libfreetype libexpat libuuid libbz2 libdl liblzma libxml2

```

总包大小约18MB，基于lambci/lambda:build-nodejs12.x编译


