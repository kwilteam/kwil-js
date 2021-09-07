import getNameAndBio from './getNameAndBio.js';
import getPFP from './getPFP.js';

const getAccountData = async (_username) => {
    const accountData = await getNameAndBio(_username);
    const pfp = await getPFP(_username);
    return {
        username: accountData.username,
        name: accountData.name,
        bio: accountData.bio,
        pfp: pfp.pfp,
    };
};

export default getAccountData;
