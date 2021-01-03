# change to your access key
export AWS_ACCESS_KEY_ID=""
export AWS_SECRET_ACCESS_KEY=""

docker build -t graphics-layer .
docker run --rm -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY graphics-layer