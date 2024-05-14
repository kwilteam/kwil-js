# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.6.3](https://github.com/kwilteam/kwil-js/compare/v0.6.2...v0.6.3) (2024-05-14)


### Features

* **client:** individual logout ([ec3aac3](https://github.com/kwilteam/kwil-js/commit/ec3aac3375354a6e672edd7b2bf53792c0eafad4))


### Bug Fixes

* **client:** individual logout on multi-user session ([0b8e8b6](https://github.com/kwilteam/kwil-js/commit/0b8e8b6ec85cebd597540a7fcf614adb03a021c4))

### [0.6.2](https://github.com/kwilteam/kwil-js/compare/v0.6.1...v0.6.2) (2024-04-19)


### Features

* auto authenticate ([2c1b650](https://github.com/kwilteam/kwil-js/commit/2c1b650e24a9ec3fc6df79d23f3530d4436276e5))
* **chaininfo:** configurable warning ([fe00e9a](https://github.com/kwilteam/kwil-js/commit/fe00e9aeb929353623c8e95b654e9210e2dafbe8)), closes [#75](https://github.com/kwilteam/kwil-js/issues/75)


### Bug Fixes

* **nodekwil:** auth.logout() functionality ([08c7377](https://github.com/kwilteam/kwil-js/commit/08c737774238a7b8af26ced4fdb4028d1c898b72)), closes [#76](https://github.com/kwilteam/kwil-js/issues/76)
* **nodekwil:** carry cookie ([9aef12a](https://github.com/kwilteam/kwil-js/commit/9aef12ab27f5b4ee8e0845a59ef5e888df4f0d1c))

### [0.6.1](https://github.com/kwilteam/kwil-js/compare/v0.6.0...v0.6.1) (2024-04-15)


### Features

* **client:** add auth logout method ([dc7095d](https://github.com/kwilteam/kwil-js/commit/dc7095db87c75151923da9ce586479e243c5f9d5))

## [0.6.0](https://github.com/kwilteam/kwil-js/compare/v0.5.6...v0.6.0) (2024-03-12)


### ⚠ BREAKING CHANGES

* **payload_builder:** No kwil-js API changes; however, the internal payload structure has changed. This
means that from this commit on, kwil-js should only be used with kwil daemon v0.7 and above.
* Custom signers must match the signature `(msg: Uint8Array) => Promise<Uint8Array>`.
The variadic arguments were removed.

### Bug Fixes

* **core/builders:** loosen type definition for eth signer ([b0421b1](https://github.com/kwilteam/kwil-js/commit/b0421b1de1a58ddec1f7c2e73b6ee0d6b40a71ba)), closes [#20](https://github.com/kwilteam/kwil-js/issues/20)
* **payload_builder:** fix nil bug error ([b944654](https://github.com/kwilteam/kwil-js/commit/b944654bb2b72d751b80f02a057460bf93378c40))
* remove variadic args from CustomSigner ([f016cba](https://github.com/kwilteam/kwil-js/commit/f016cba6bf4d2d2933fad59f34a8d97fae41f5fb))

### [0.5.6](https://github.com/kwilteam/kwil-js/compare/v0.5.5...v0.5.6) (2024-01-18)


### Bug Fixes

* **payload_builder.ts:** set fee to 0 when estimating cost ([23e78ad](https://github.com/kwilteam/kwil-js/commit/23e78adde464b265495f5d0d2532915e56de1ede)), closes [/github.com/kwilteam/kwil-db/commit/fa0ceaea5cd8141d643fac66bc7f8f9e3754d7b1#diff-29b727c2a7cdca0ced9103a0a61a8e9bfde5911470a028b553e77d7e1d05b7d7](https://github.com/kwilteam//github.com/kwilteam/kwil-db/commit/fa0ceaea5cd8141d643fac66bc7f8f9e3754d7b1/issues/diff-29b727c2a7cdca0ced9103a0a61a8e9bfde5911470a028b553e77d7e1d05b7d7)

### [0.5.5](https://github.com/kwilteam/kwil-js/compare/v0.5.4...v0.5.5) (2024-01-16)

### [0.5.4](https://github.com/kwilteam/kwil-js/compare/v0.5.3...v0.5.4) (2024-01-10)


### Features

* add sync flag to transactions ([0e18f06](https://github.com/kwilteam/kwil-js/commit/0e18f066b4f7be249f081d794d03462c258edd3b)), closes [#62](https://github.com/kwilteam/kwil-js/issues/62)

### [0.5.3](https://github.com/kwilteam/kwil-js/compare/v0.5.2...v0.5.3) (2024-01-04)


### Bug Fixes

* rlp encoding zero and case sensitivity for action input names ([f2c71e8](https://github.com/kwilteam/kwil-js/commit/f2c71e8b1881f4e398718ab3582d3883ede69d1a))

### [0.5.2](https://github.com/kwilteam/kwil-js/compare/v0.5.0...v0.5.2) (2023-12-18)


### Features

* add unconfirmed nonce ([cc52f2d](https://github.com/kwilteam/kwil-js/commit/cc52f2d1247ae892c22af1c383c89ee10d044fc7)), closes [#51](https://github.com/kwilteam/kwil-js/issues/51)
* allow for manually setting nonce ([976f610](https://github.com/kwilteam/kwil-js/commit/976f610f53111908179fcdd32c328b3ba7737dda)), closes [#57](https://github.com/kwilteam/kwil-js/issues/57)


### Bug Fixes

* **rlp:** fix bug where boolean false was not rlp encoded correctly ([7435691](https://github.com/kwilteam/kwil-js/commit/74356915f2187f7e1513fad351653a62ff903917))

### [0.5.1](https://github.com/kwilteam/kwil-js/compare/v0.5.0...v0.5.1) (2023-12-13)


### Bug Fixes

* **rlp:** fix bug where boolean false was not rlp encoded correctly ([8da5a42](https://github.com/kwilteam/kwil-js/commit/8da5a4248fb4dd78cfecc53e7082f97a68c2c69a))

## [0.5.0](https://github.com/kwilteam/kwil-js/compare/v0.4.1...v0.5.0) (2023-12-11)


### ⚠ BREAKING CHANGES

* Remove the `kwil.authenticate()` and `kwil.setCookie()` methods, as those methods
are now handled internally by the `kwil.call()` method.

### Features

* make kwil.call() auto authenticate, when required ([e591eb9](https://github.com/kwilteam/kwil-js/commit/e591eb9c4e37395f3f5e206ed9740e2894c34084))

### [0.4.1](https://github.com/kwilteam/kwil-js/compare/v0.4.0...v0.4.1) (2023-12-08)


### Bug Fixes

* **core/database.ts:** fixed typing error in Compiled Kuneiform ([904ae7d](https://github.com/kwilteam/kwil-js/commit/904ae7d5babaf2b26c45dc36d6748bfdd6485559))

## [0.4.0](https://github.com/kwilteam/kwil-js/compare/v0.3.2...v0.4.0) (2023-12-06)


### ⚠ BREAKING CHANGES

* **client:** The kwil.listDatabases() method now returns an array of db-objects (owner,
identifier, dbid). Previously, only the db name would be returned when an owner's address was passed
to `listDatabases()`.
* KwilSigners using Secp256k1 / EtherJS signers should now pass the Ethereum wallet
address as the identifier, rather than the public key.

### Features

* change ethereum identifier to wallet address ([54b2aa1](https://github.com/kwilteam/kwil-js/commit/54b2aa18091cb718c60168e4be94b4529562a415))
* **kwil.ts:** add authenticate method ([ad97043](https://github.com/kwilteam/kwil-js/commit/ad9704335e17310423109e50b68ed5cde2a13116))
* **kwil/funder:** added funder property to kwil class ([e50d14d](https://github.com/kwilteam/kwil-js/commit/e50d14da8f61ea8119e4f3a2043a2ee9939a6705))


* **client:** change list database return ([a96046a](https://github.com/kwilteam/kwil-js/commit/a96046a4a2ba78de8a4f6610068254423d162ec1)), closes [/github.com/kwilteam/proto/pull/26#event-11158139032](https://github.com/kwilteam//github.com/kwilteam/proto/pull/26/issues/event-11158139032)

### [0.3.2](https://github.com/kwilteam/kwil-js/compare/v0.3.1...v0.3.2) (2023-11-07)

### [0.3.1](https://github.com/kwilteam/kwil-js/compare/v0.3.0...v0.3.1) (2023-11-07)


### Bug Fixes

* **client/kwil.ts:** add wrapped config property to kwil class ([020af2b](https://github.com/kwilteam/kwil-js/commit/020af2bc1d5a372ded7cdacebd887fc780034c6f))

## [0.3.0](https://github.com/kwilteam/kwil-js/compare/v0.2.1...v0.3.0) (2023-10-30)


### ⚠ BREAKING CHANGES

* **client/kwil.ts:** The `WebKwil` and `NodeKwil` classes require an additional `chainId` config string
to execute database deploys, database drops, or state-changing actions. You can check the chainId
for your kwilProvider by calling `kwil.chainInfo()`.
* **client/kwil.ts:** The `kwil.actionBuilder()`, `kwil.dbBuilder()`, `kwil.dropDbBuilder()` and
`kwil.broadcast()` are deprecated in favor of using `kwil.execute()`, `kwil.deploy()`,
`kwil.drop()`, and `kwil.call()`. The deprecated methods will be removed in Q1 2024.
* **builders/payload_builder:** Signature descriptions cannot be longer than 200 characters. Any signature
description that was previously >200 characters will now trigger an error.

### Features

* **builders/payload_builder:** max length to signature descriptions ([#43](https://github.com/kwilteam/kwil-js/issues/43)) ([a331810](https://github.com/kwilteam/kwil-js/commit/a33181042076c9ea4c218e4d95dd03413372cd85)), closes [#26](https://github.com/kwilteam/kwil-js/issues/26)
* **client/kwil.ts:** require chainID to be configured in Kwil constructor ([#40](https://github.com/kwilteam/kwil-js/issues/40)) ([dff850d](https://github.com/kwilteam/kwil-js/commit/dff850da159957ec348c38489f328347b8a3db67)), closes [#39](https://github.com/kwilteam/kwil-js/issues/39)* 
* builder pattern alternatives - add `KwilSigner`, `kwil.execute()`, `kwil.call()`, `kwil.deploy()`, `kwil.drop()` ([[#38](https://github.com/kwilteam/kwil-js/issues/38)) ([2d25de9](https://github.com/kwilteam/kwil-js/commit/2d25de9ac423950ca7a33aa1ad0da8aed6642c49))

### Bug Fixes

* **builders/payload_builder:** remove the 🪶  in the Kwil signature ([#44](https://github.com/kwilteam/kwil-js/issues/44)) ([0dfc4a9](https://github.com/kwilteam/kwil-js/commit/0dfc4a9b9db4335deed72529201ae5a90169be70))
* **client/kwil.ts:** deprecate builders and clean Utils namespace ([#41](https://github.com/kwilteam/kwil-js/issues/41)) ([c9d1130](https://github.com/kwilteam/kwil-js/commit/c9d1130b6919a1c2d8d582a8f5a1d38b764be0f1)), closes [#32](https://github.com/kwilteam/kwil-js/issues/32)

### [0.2.1](https://github.com/kwilteam/kwil-js/compare/v0.1.1...v0.2.1) (2023-10-09)


### Features

* custom singature names ([#35](https://github.com/kwilteam/kwil-js/issues/35)) ([ac07ccd](https://github.com/kwilteam/kwil-js/commit/ac07ccdcbed67121ce8ff1b1177b0690a7c667c1)), closes [#34](https://github.com/kwilteam/kwil-js/issues/34)

### [0.2.0](https://github.com/kwilteam/kwil-js/compare/v0.1.1...v0.2.0) (2023-09-30)

Version 0.2.0 supports friendly signatures, which is compatible with the [Kwil Daemon v0.6.0](https://github.com/kwilteam/binary-releases/releases) and above.

### [0.1.1](https://github.com/kwilteam/kwil-js/compare/v0.1.0...v0.1.1) (2023-09-21)

## [0.1.0](https://github.com/kwilteam/kwil-js/compare/v0.0.3...v0.1.0) (2023-09-21)


### ⚠ BREAKING CHANGES

* The `.nearConfig()` method has been removed from the `.actionBuilder()` and
`.dbBuilder()` classes, in favor of allowing developers to pass their own signing function to the
`.signer()` methods.

### Features

* added custom signer functionality ([d29bc60](https://github.com/kwilteam/kwil-js/commit/d29bc60fbd7adcd6561d22802c80ea756bab84e0))

### [0.0.3](https://github.com/kwilteam/kwil-js/compare/v0.0.2...v0.0.3) (2023-09-06)


### Features

* recoverSecp256k1PubKey now allows the developer to optionally pass the signing message ([3896238](https://github.com/kwilteam/kwil-js/commit/38962382da060db8d1d38a1dddd690c333f94613))


### Bug Fixes

* escaped base64 url encoding ([0eeba1a](https://github.com/kwilteam/kwil-js/commit/0eeba1ad35b42296e864f3d81acbc2f454a84014))

## 0.0.2 (2023-09-05)

### Bug Fixes

* fix ethers v6 signature validation in browser ([6ceba14](https://github.com/kwilteam/kwil-js/commit/6ceba14e72fa7d0d9bb575fa403335aaa7a5e44b))
