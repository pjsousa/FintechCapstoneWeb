#docker build -t capstone-flask:latest .
# docker run -d -p 5000:5000 capstone-flask


FROM ubuntu:latest
MAINTAINER Pedro "pjgs.sousa@gmail.com"
RUN apt-get update -y
RUN apt-get install -y python-pip python-dev build-essential pip3
COPY . /app
WORKDIR /app
RUN pip install -r spec-file.txt
ENTRYPOINT ["python"]
CMD ["run.py"]


