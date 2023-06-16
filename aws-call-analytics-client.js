'use strict';

const express = require('express');
const app = express();

const fs = require('fs');
const request = require('request');
const bodyParser = require('body-parser');

require("dotenv").config();

const apiKey = process.env.VONAGE_API_KEY;
const apiSecret = process.env.VONAGE_API_SECRET;
const appId = process.env.VONAGE_APP_ID;
const calleeNumber = process.env.CALLEE_NUMBER;
const privateKey = require('fs').readFileSync('private.key');

const Vonage = require('@vonage/server-sdk');

const regionUrl = "api-us.vonage.com";
// const regionUrl = "api-us-3.vonage.com";
// const regionUrl = "api-us-4.vonage.com";

const options = {
  debug: true,
  apiHost: regionUrl
};

const vonage = new Vonage({
  apiKey: apiKey,
  apiSecret: apiSecret,
  applicationId: appId,
  privateKey: privateKey
}, options);

// const vonage = new Vonage({
//   apiKey: apiKey,
//   apiSecret: apiSecret,
//   applicationId: appId,
//   privateKey: privateKey
// });

const port = process.env.PORT || 8000;

//---------

const transcribeComprehendServer = process.env.TRANSCRIBE_COMPREHEND_CNX_SRV;

const samplingRate = 16000; // must match middleware setting

//----------

// Amazon Transcribe Medical possible values for 'specialty' parameter
const specialties = ['PRIMARYCARE', 'CARDIOLOGY', 'NEUROLOGY', 'ONCOLOGY', 'RADIOLOGY', 'UROLOGY'];
// TO DO - return above array on request from front end <<<

// Amazon Transcribe Medical possible values for 'type' parameter
// should be always DICTATION even for 1-to-1 calls, or even multiparty calls
// possible exception: multiple speakers speaking on same device, i.e. on same call leg
const types = ['DICTATION', 'CONVERSATION'];
// TO DO - return above array on request from front end <<<

//-----------

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//-----------

console.log('Service number:', process.env.SERVICE_NUMBER);

//-----------

app.get('/answer', (req, res) => {

  const hostName = `${req.hostname}`;
  const uuid = req.query.uuid;
  
  res.json(
    [
      {
        "action": "talk",
        "voiceName": "Joanna",
        "text": "Please wait, we are connecting your call"
      }
      ,
      {
        "action": "conversation",
        "name": "conf_" + uuid,
        "endOnExit": true
      }
    ]
  );

  vonage.calls.create(
    {
      to: [
        {
        type: "phone",
        number: calleeNumber
        }
      ],
      from: {
       type: "phone",
       number: req.query.to
      },
      answer_url: ["https://" + hostName + "/call1_answer?original_uuid=" + uuid],
      answer_method: "GET",
      event_url: ["https://" + hostName + "/call1_event?original_uuid=" + uuid],
      event_method: "POST"
    }, (err, res) => {
      if (err) {console.error("Outgoing call failed:", err)}
      else {console.log("Outgoing call status:", res)}
      }
  );

});

//------------

app.post('/event', (req, res) => {

  if (req.body.type == "transfer"){ // call leg transferred to named conference

    const hostName = `${req.hostname}`;
    const uuid = req.body.uuid

    // both following values may be change by front-end
    // let specialty = specialties[0]; //  'PRIMARYCARE' set as default specialty
    // let type = types[0]; // 'DICTATION' set as default type

    vonage.calls.create(
      {
        to: [
          {
            type: "websocket",
            // uri: "wss://" + transcribeComprehendServer + '/socket0?original_uuid=' + uuid + '&peer_uuid=' + uuid + '&specialty=' + specialty + '&type=' + type,
            uri: "wss://" + transcribeComprehendServer + '/socket0?original_uuid=' + uuid + '&peer_uuid=' + uuid,
            "content-type": "audio/l16;rate=" + samplingRate,
            headers:
              {
              "webhook_url": "https://" + hostName + "/stt_sentiment", // transcript and sentiment result webhook call back
              "original_uuid": uuid,  // 1st call to the conference
              "peer_uuid": uuid,  // call leg associated to this websocket
              // possible values for 'specialty' at this time are: PRIMARYCARE, CARDIOLOGY, NEUROLOGY, ONCOLOGY, RADIOLOGY, or UROLOGY
              // "specialty": specialty, // may be set from UI or DB
              // possible values for type are DICTATION, CONVERSATION
              // "type": type, // may be set from UI or DB
              "entity": "customer", // optional parameter, e.g. "doctor", "nurse", "patient", "pharmacist", "receptionist", "insurance agent", "dentist", "technician", ...
              // "do_comprehend": true, // optional parameter, if set to false, only transcription is requested
              // "client_id": uuid + "_" + req.query.from,
              }      
          }
        ],
          from: {
           type: "phone",
           number: 12995550101  // dummy number, value does not matter
          },
          answer_url: ["https://" + hostName + "/ws_answer0?original_uuid=" + uuid + '&peer_uuid=' + uuid],
          answer_method: "GET",
          event_url: ["https://" + hostName + "/ws_event0?original_uuid=" + uuid + '&peer_uuid=' + uuid],
          event_method: "POST",
          region_url: regionUrl
        }, (err, res) => {
          if (err) {console.error("WebSocket 0 failed:", err)}
          else { console.log("WebSocket 0 status:", res)}
      }
    );
  }

  res.status(200).send('Ok');
  
});

//------------

app.get('/ws_answer0', (req, res) => {

  const originalUuid = req.query.original_uuid;
 
  res.json(
    [
      {
        "action": "conversation",
        "name": "conf_" + originalUuid,
        "canHear": [originalUuid] // stream only caller's audio to this websocket
      }
    ]
  );

});

//-----------

app.post('/ws_event0', (req, res) => {
 
  res.status(200).send('Ok');

});

//------------

app.get('/call1_answer', (req, res) => {

    const hostName = `${req.hostname}`;
    const originalUuid = req.query.original_uuid;
    const uuid = req.query.uuid;

    res.json([
      {
        "action": "talk",
        "voiceName": "Joanna",
        "text": "We are connecting you to the caller"
      }
      ,    
      {
        "action": "conversation",
        "name": "conf_" + originalUuid,
        "endOnExit": true
      }
    ]);

});

//------------

app.post('/call1_event', (req, res) => {

  res.status(200).send('Ok');

  if (req.body.type == "transfer"){

    const hostName = `${req.hostname}`;
    const uuid = req.body.uuid;
    const originalUuid = req.query.original_uuid;

    // TO DO - replicate fields as in /event route

    vonage.calls.create(
      {
        to:
          [{
          type: "websocket",
          uri: "wss://" + transcribeComprehendServer + '/socket1?original_uuid=' + originalUuid + '&peer_uuid=' + uuid,
          "content-type": "audio/l16;rate=" + samplingRate,
          headers:
            {
            "webhook_url": 'https://' + hostName + '/stt_sentiment', // transcript and sentiment result webhook call back
            "original_uuid": uuid,
            // possible values for 'specialty' at this time are: PRIMARYCARE, CARDIOLOGY, NEUROLOGY, ONCOLOGY, RADIOLOGY, or UROLOGY
            // "specialty": 'PRIMARYCARE', // TO DO: to be set from UI or DB            
            "entity": "agent", // optional parameter, e.g. "doctor", "nurse", "patient", "pharmacist", "receptionist", "insurance agent", "dentist", "technician", ...
            // "do_comprehend": true, // optional parameter, if set to false, only transcription is requested
            // "client_id": uuid + "_" + req.query.from
            },         
          }],
        from: {
         type: "phone",
         number: 12995550101  // dummy number, value does not matter
        },
        answer_url: ["https://" + hostName + "/ws_answer1?original_uuid=" + originalUuid + '&peer_uuid=' + uuid],
        answer_method: "GET",
        event_url: ["https://" + hostName + "/ws_event1?original_uuid=" + originalUuid + '&peer_uuid=' + uuid],
        event_method: "POST",
        region_url: regionUrl
        }, (err, res) => {
          if (err) {console.error("WebSocket 1 failed:", err); }
          else { console.log("WebSocket 1 status:", res); }
      }
    );
  }

});

//------------

app.get('/ws_answer1', (req, res) => {
 
  res.json(
    [{
      "action": "conversation",
      "name": "conf_" + req.query.original_uuid,
      "canHear": [req.query.peer_uuid]
    }]
  );

});

//------------

app.post('/ws_event1', (req, res) => {
 
  res.status(200).send('Ok');  

});

//-----------

app.post('/stt_sentiment', (req, res) => {

  console.log(">>> Transcript and sentiment score:", req.body);
 
  res.status(200).send('Ok');

});

//-------

app.listen(port, () => console.log(`Application listening on port ${port}`));