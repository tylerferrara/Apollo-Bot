'use strict';

// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  path = require('path'),
  http = require('http'),
  request = require('request'),
  app = express().use(bodyParser.json()); // creates express http server

// PORT  
let PORT = (process.env.PORT || 1337);

// Load .env 
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
  PORT = (process.env.PORT || 1337);
  const fs = require('fs');
  const privateKey = fs.readFileSync('sslcert/key.pem', 'utf8');
  const certificate = fs.readFileSync('sslcert/cert.pem', 'utf8');
  const https = require('https');
  const creds = { key: privateKey, cert: certificate };
  https.createServer(creds, app).listen(PORT);

}

// grab heroku config vars
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const SP_CLIENT_ID = process.env.SP_CLIENT_ID;
const SP_CLIENT_SECRET = process.env.SP_CLIENT_SECRET;
const SP_REDIRECT_URI = process.env.SP_REDIRECT_URI;

// LISTEN
// const listener = (process.env.PORT || 1337, () => {
//   console.log('Webhook listening on port ' + listener.address().port);
// });

// GET

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/close', (req, res) => {
  console.log(req.params);
  console.log(req.query);
  res.redirect("https://www.messenger.com/closeWindow/?image_url=none&display_text=Close your window")
});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = FB_VERIFY_TOKEN;
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

// POST

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      // extract user id 
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);
      console.log(webhook_event);
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);        
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// HELPER FUNCTIONS

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;
  
  // Checks if the message contains text
  if (received_message.text) {    
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    response = {
      "text": `You sent the message: "${received_message.text}". Now send me an attachment!`
    }
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
  }

  const spotifyRes = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":"Login to Spotify",
        "buttons":[
          {
            "type":"web_url",
            "url":"https://accounts.spotify.com/authorize?response_type=code&redirect_uri=" + SP_REDIRECT_URI + "&client_id=" + SP_CLIENT_ID + "&scope=user-read-private user-read-email",
            "title":"URL Button",
            "webview_height_ratio": "full"
          }
        ]
      }
    }
  } 

  // Login Spotify
  if (received_message.text == 'login') {
    console.log('Attempting Spotify login.......');
    callSendAPI(sender_psid, spotifyRes);
  } else {
    // Send the response message
    callSendAPI(sender_psid, response);
  }
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;
  
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": "Thanks!" }
  } else if (payload === 'no') {
    response = { "text": "Oops, try sending another image." }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": FB_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}

// Authorizes user with spotify cridentials
function authorizeSpotify(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": FB_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}
//   request({
//     "uri": "https://accounts.spotify.com/authorize",
//     "qs": {
//       "client_id": SP_CLIENT_ID,
//       "response_type": "code",
//       "redirect_uri": SP_REDIRECT_URI,
//       "scope": "user-read-private user-read-email"
//     }
//   }, (err, res, body) => {
//     if (!err) {
//       console.log('User logged into spotify')
//     } else {
//       console.error("Unable to connect to spotify:" + err);
//     }
//   })
// }
