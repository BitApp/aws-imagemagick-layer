export AWS_ACCESS_KEY_ID="AKIAIJWSPJGSDUARKOVQ"
export AWS_SECRET_ACCESS_KEY="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"

docker build -t graphics-layer .
docker run --rm -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY graphics-layer