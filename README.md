1. Installation
* create Google Cloud account
* generate service account and download JSON as google-credentials.json in audiodive-server and audiodive-worker
* create cloud storage bucket
* create redis cloud server account (or similar)
* create MySQL database
* Copy .env.example into audiodive-server/.env and audiodive-worker/.env and replace values
* import the content of audiodive-server/seed.sql in the database


2. Running the Application
* In audiodive-server:
```
sails lift --port 8083
```
(you may need to install sails : npm install sails -g)

* In audiodive-worker:
```
npm run start
```

* In audiodive-client:
npm run webserver
npm run webserver-preview