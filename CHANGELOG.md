# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
