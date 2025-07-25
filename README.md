# # Amazon Transcribe / Transcribe Medical - Sample client - 2 participants

Use this sample application to connect to an Amazon Transcribe or Amazon Transcribe Medical connector middleware for real time transcription of pairs of participants in each call.

## About this sample application

This sample client application makes use of Vonage Voice API to establish voice calls and set up WebSockets connections to stream audio to the Transcribe / Transcribe Medical connector middleware then get back transcipts in real time.

The connector middleware posts back in real time transcripts, via webhook calls back to this Vonage Voice API sample client application.

Once this application will be running, you test as follows:</br>
- Call in to the **`phone number linked`** to your application (as explained below),</br>
- The PSTN (Public Switched Telephone Network) call leg will have a corresponding WebSocket call leg listening only to that party for audio streaming to the reference connection, both legs are connected to the same named conference,</br>
- Transcripts will be received by this application in real time,</br>
- When the caller hangs up, the WebSocket leg will be automatically terminated.

## Set up the reference connection server - Public hostname and port

First set up a Transcribe / Transcribe Medical connector server from https://github.com/nexmo-se/aws-call-analytics-connector.

Default local (not public!) of the connector server `port` is: 6000.

If you plan to test using `Local deployment` with ngrok for both the connector application and this sample application, you may set up [multiple ngrok tunnels](https://ngrok.com/docs#multiple-tunnels).

For the next steps, you will need:
- The Transcribe connector server's public hostname and if necessary public port,</br>
e.g. `xxxxxxxx.ngrok.io`, `xxxxxxxx.herokuapp.com`, `myserver.mycompany.com:30000`  (as **`TRANSCRIBE_COMPREHEND_CNX_SRV`**, no `port` is necessary with ngrok or heroku as public hostname)

## Client application public hostname and port

Default local (not public!) sample application `port` is: 8000.

If you plan to test using `Local deployment` with ngrok for both this sample application and the connector application, you may set up [multiple ngrok tunnels](https://ngrok.com/docs#multiple-tunnels).

For the next steps, you will need:
- The server's public hostname and if necessary public port on where this application is running,</br>
e.g. `yyyyyyyy.ngrok.io`, `yyyyyyyy.herokuapp.com`, `myprogramserver.mycompany.com:32000` (as `<host>:<port>`), no `port` is necessary with ngrok or heroku as public hostname.

## Set up your Vonage Voice API client application credentials and phone number

[Log in to your](https://dashboard.nexmo.com/sign-in) or [sign up for a](https://dashboard.nexmo.com/sign-up) Vonage APIs account.

Go to [Your applications](https://dashboard.nexmo.com/applications), access an existing application or [+ Create a new application](https://dashboard.nexmo.com/applications/new).

Under Capabilities section (click on [Edit] if you do not see this section):

Enable Voice
- Under Answer URL, leave HTTP GET, and enter https://\<host\>:\<port\>/answer (replace \<host\> and \<port\> with the actual value as mentioned above), e.g. https://xxxx.ngrok.io/answer</br>
- Under Event URL, select HTTP POST, and enter https://\<host\>:\<port\>/event (replace \<host\> and \<port\> with the public host name and if necessary public port of the server where your application is running), e.g. https://xxxx.ngrok.io/event</br>
- Click on [Generate public and private key] if you did not yet create or want new ones, save the private.key file in this application folder.</br>
IMPORTANT: Do not forget to click on [Save changes] at the bottom of the screen if you have created a new key set.</br>
- Link a phone number to this application if none has been linked to the application.

Please take note of your **application ID** and the **linked number** (as they are needed in the very next section.)

For the next steps, you will need:</br>
- Your `application ID` (as **`APP_ID`**),</br>
- The **`phone number linked`** to your application (your first phone will **call that number**),</br>
- Your [Vonage API key](https://dashboard.nexmo.com/settings) (as **`API_KEY`**)</br>
- Your [Vonage API secret](https://dashboard.nexmo.com/settings), not signature secret, (as **`API_SECRET`**)</br>
- The Transcribe & Comprehend connector server public hostname and port (as **`TRANSCRIBE_COMPREHEND_CNX_SRV`**)</br>
- If you did not yet add funds since you created your account, the [Phone number](https://dashboard.nexmo.com/edit-profile) under your profile (do not confuse with the **`phone number linked`** to your application) must be used as **`CALLEE_NUMBER`** (i.e. the 2nd phone that gets called),</br>
otherwise you may enter any desired callee phone number as **`CALLEE_NUMBER`**.</br>
That callee number must be in E.164 format, for example:</br>
12995550101 (11-digit number starting with 1 for a US/Canada phone number)</br>
44xxx..xxxxx (number starting with 44 for a UK phone number)</br>
33xxxxxxxxx (11-digit number starting with 33 for a France phone number)

## Running Transcribe & Comprehend client application

You may select one of the following 2 types of deployments.

### Local deployment

To run your own instance locally you'll need an up-to-date version of Node.js (we tested with version 16.15).

Copy the `.env.example` file over to a new file called `.env`:
```bash
cp .env.example .env
```

Edit `.env` file, and set the 5 parameter values:</br>
API_KEY=</br>
API_SECRET=</br>
APP_ID=</br>
TRANSCRIBE_COMPREHEND_CNX_SRV=</br>
CALLEE_NUMBER=</br>
SERVICE_NUMBER=</br>

Install dependencies once:
```bash
npm install
```

Launch the application:
```bash
node aws-call-analytics-client
```

### Command Line Heroku deployment

Install [git](https://git-scm.com/downloads).

Install [Heroku command line](https://devcenter.heroku.com/categories/command-line) and login to your Heroku account.

Download this sample application code to a local folder, then go to that folder.

If you do not yet have a local git repository, create one:</br>
```bash
git init
git add .
git commit -am "initial"
```

Deploy this client application to Heroku from the command line using the Heroku CLI:

```bash
heroku create myappname
```

On your Heroku dashboard where your client application page is shown, click on `Settings` button,
add the following `Config Vars` and set them with their respective values:</br>
API_KEY</br>
API_SECRET</br>
APP_ID</br>
TRANSCRIBE_COMPREHEND_CNX_SRV</br>
CALLEE_NUMBER</br>
SERVICE_NUMBER</br>

```bash
git push heroku master
```

On your Heroku dashboard where your application page is shown, click on `Open App` button, that hostname is the one to be used under your corresponding [Vonage Voice API application Capabilities](https://dashboard.nexmo.com/applications) (click on your application, then [Edit]).</br>
See more details in above section **Set up your Vonage Voice API client application credentials and phone number**.
