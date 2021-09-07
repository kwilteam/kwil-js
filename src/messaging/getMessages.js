import decryptMessage from './decryptMessage.js';
import getInbox from './getInbox.js';

const getMessages = async (_username, _privateKey) => {
    let inbox = await getInbox(_username);
    let verifiedMessages = [];
    for (let i = 0; i < inbox.length; i++) {
        try {
            let message = await decryptMessage(inbox[i], _privateKey);
            if (message.isValid) {
                verifiedMessages.push(message);
            }
        } catch (e) {
            console.log(e);
        }
    }
    return verifiedMessages;
};

export default getMessages;
