import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import request from 'request';
import { Server } from 'tls';
import webhook from './webhook/webhook.js';

const app = express().use(bodyParser.json());
const __PORT__ = 1337;

// Get Enviornment Variables
// if (process.env.NODE_ENV !== 'production') {
//     require('dotenv').load();
// }

const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const SP_CLIENT_ID = process.env.SP_CLIENT_ID;
const SP_CLIENT_SECRET = process.env.SP_CLIENT_SECRET;
const SP_REDIRECT_URI = process.env.SP_REDIRECT_URI;
const PORT = process.env.PORT;

app.get('/', (req, res) => {
  res.send('Im here!');
})

app.use('/webhook', webhook);

app.listen(__PORT__, () => {
  console.log('Server running on port: ' + __PORT__ + '...');
});
