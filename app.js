const { google } = require('googleapis');

// Google API credentials and token setup
const credentials = {
  client_id: 'YOUR_CLIENT_ID',
  client_secret: 'YOUR_CLIENT_SECRET',
  redirect_uri: 'YOUR_REDIRECT_URI',
};

const token = 'YOUR_ACCESS_TOKEN';

// Create a new instance of the Gmail API client
const gmail = google.gmail({ version: 'v1', auth: credentials });

// Function to send a message to a thread
async function sendMessageToThread(threadId, message) {
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

// Usage example
const threadId = 'THREAD_ID';
const message = 'To: recipient@example.com\r\n' +
                'Subject: Hello from Google API\r\n' +
                '\r\n' +
                'This is the content of the message.';

sendMessageToThread(threadId, Buffer.from(message).toString('base64'));