FROM node:16 AS frontend

WORKDIR /app

COPY Frontend/package*.json ./

RUN npm i

COPY ./Frontend .

EXPOSE 3000

CMD ["npm", "start"]


FROM python:3.10.2-bullseye AS scraper

WORKDIR /scraper

COPY Database/requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY ./Database .

CMD ["python", "scraper.py"]
