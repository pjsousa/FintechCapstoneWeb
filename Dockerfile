#docker build -t capstone-flask:latest .
# docker run -d -p 5000:5000 capstone-flask
# docker run -d --name capstone-flask capstone-flask


FROM continuumio/anaconda3:latest
MAINTAINER Pedro "pjgs.sousa@gmail.com"


RUN groupadd -r myuser && useradd -r -g myuser myuser

WORKDIR /app
COPY environment.yml /app/environment.yml
RUN conda config --add channels conda-forge \
    && conda env create -n myapp -f environment.yml \
    && rm -rf /opt/conda/pkgs/*

COPY . /app/
RUN chown -R myuser:myuser /app/*

ENV PATH /opt/conda/envs/myapp/bin:$PATH

ENTRYPOINT ["python"]
CMD ["run.py"]
