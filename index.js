const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

async function sendMessageToThread(threadId, message, auth) {
    const gmail = google.gmail({version: 'v1', auth});
    try {
      const res = await gmail.users.messages.send({
        userId: 'me',
        threadId: threadId,
        resource: {
          raw: message,
        },
      });
      console.log('Message sent:', res.data);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }


async function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const res = await gmail.users.threads.list({
    userId: 'me',
  });
  const threads = res.data.threads;

  console.log('Started:');
  for(thread of threads){
    const result = await gmail.users.threads.get({
        userId: 'me',
        id: thread.id,
      });

    // console.log(res.data)
    if(result.data.messages.length > 1)
    {
        continue;
    }
    var flag = 0;
    // console.log(result.data.messages[0])
    for(label of result.data.messages[0].labelIds)
    {
        if(label === 'UNREAD')
        {
            flag=1;
        }
    }

    if( flag === 0)
    {
        continue;
    }

    const recipients = result.data.messages.map(message => message.payload.headers.find(header => header.name === 'From').value);

    const threadId = thread.id;

    const lastMessage = result.data.messages[result.data.messages.length - 1];
    const lastMessageMessageId = lastMessage.payload.headers.find(header => header.name === 'Message-ID').value;
    const message = 'To: ' + recipients.join(', ') + '\r\n' +
                    'Subject: Re: ' + lastMessage.payload.headers.find(header => header.name === 'Subject').value + '\r\n' +
                    'References: ' + lastMessageMessageId + '\r\n' +
                    'In-Reply-To: ' + lastMessageMessageId + '\r\n' +
                    'threadId: ' + threadId + '\r\n' +
                    'Hello , Will be back in a minute';
    
    sendMessageToThread(threadId, Buffer.from(message).toString('base64'), auth);
  };
}

async function repeat() {
    console.log('new Start');
    await authorize().then(listLabels).catch(console.error);
    console.log('new End');
}

setInterval(repeat, 60000);
    

