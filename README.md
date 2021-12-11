API for interacting with Kwil (formerly Ecclesia)

## Installation
```
npm i ecclesia
```
## Initialization
Currently this library auto-initializes to a URL.  This will change in the near future.
```
const kwil = require('ecclesia')
```

## Creating an account
The createAccount method has 2 optional inputs.  If for some reason you want to set your own salt, the third input can be used to set a salt.  Salts should be 16 characters in length, however they can be shorter if you wanted to for some reason.  The fourth optional input is for adding an email.  Currently there is no advantage of including an email in registration, however this is left here to allow for IMAP tooling to be built for Kwil in the future.
#### Creating an Account
```
if (!await kwil.ifUserExists('brennanjl)) {
   const keys = await kwil.createAccount('brennanjl', 'Password123')
   console.log(keys.privateKey)
}
```
If you wish to retrieve your Kwil key, you can use the login method.
#### Logging in to an Account
```
const key = await kwil.login('brennanjl', 'Password123')
console.log(key.privateKey)
```

## Changing Account Data
There are several methods to alter account data.  The recommended method is using changeAllAccountData(new_display_name, new_bio, new_pfp, new_banner, privateKey, username).  If you wish to not alter one of these, pass the parameter an empty string. If you wish to remove an attribute, pass it null.  Feed in images as base64.  **Make sure that you only send the image's base64.** Many conversion methods keep a 16 character prefix.
#### Changing Profile Data
```
await kwil.changeAllAccountData('Brennan Lamey', 'Founder of Kwil!', myBase64PFP, '', privateKey, 'brennanjl')
```
There are also methods for changeNameAndBio, changePFP, and changeBanner, but it is not recommended to use these as they are no longer maintained.

There are several methods for getting account data, but it is only recommended to use getAccountData and getAllAccountData.  These functions are the same, except getAccountData returns the profile picture and banner as URLs instead of hashes.
#### Getting Account Data
```
await kwil.getAccountData('brennanjl')
```
or
```
const accountData = await kwil.getAllAccountData('brennanjl')
const pfpURL = kwil.getPhotoURL(accountData.photoHash)
const bannerURL = kwil.getPhotoURL(accountData.bannerHash)
```
#### Following
```
await kwil.follow('brennanjl', 'satoshi', privateKey)
await kwil.unfollow('brennanjl', 'satoshi', privateKey)
await kwil.isFollowing('brennanjl', 'satoshi')
```
#### Getting Follow Data
```
const followers = await kwil.getFollowers('brennanjl')
const following = await kwil.getFollowing('brennanjl')
```

## Groups
Groups functionality is one of the most powerful aspects of the Kwil protocol.  In this section, I will cover how to utilize groups functionality.  In the future, I would like to paste a link to a section of a whitepaper / informational site explaining the technicalities behind groups.

#### Creating a Group
if (!await kwil.ifGroupExists('arweavers')){
  await kwil.createGroup
}
