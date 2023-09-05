# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 4.0.0 (2023-09-05)


### ⚠ BREAKING CHANGES

* Any sdk this version or later should use the cometBFT release. See all breaking
changes in MIGRATING.md.

### Features

* added cometbft support for messages / call endpoint ([029b464](https://github.com/kwilteam/kwil-js/commit/029b46436ce28359a966328083d37c0a5e40bb60))
* cometbft release support for broadcast operations (db, action, drop) + added txQuery endpoint ([06b8ef8](https://github.com/kwilteam/kwil-js/commit/06b8ef896093d348bd6c452d494b9408f0fbb4ef))
* ed25519 support + integration tests passing ([1e41971](https://github.com/kwilteam/kwil-js/commit/1e419717a0c09305b516e596b2ade1f213fab0c1))
* near signer support ([9e101f7](https://github.com/kwilteam/kwil-js/commit/9e101f71800d18eac0873be0100ae7d49ce7b0ed))
* public keys represented as bytes, can be passed as hex or bytes ([7f8bf5b](https://github.com/kwilteam/kwil-js/commit/7f8bf5b2790b252892da72633ede89bc7b4b9a52))
* **utils/cache:** changed getSchema cache to TTL cache ([909637b](https://github.com/kwilteam/kwil-js/commit/909637b83a21262523320e2fbd0f6339756312b5)), closes [#8](https://github.com/kwilteam/kwil-js/issues/8)


### Bug Fixes

* fix ethers v6 signature validation in browser ([6ceba14](https://github.com/kwilteam/kwil-js/commit/6ceba14e72fa7d0d9bb575fa403335aaa7a5e44b))
* fixed bug for improper rlp encoding of 0 ([2f14374](https://github.com/kwilteam/kwil-js/commit/2f143744d2700c64e3ffffefa4234d763b692b10))
* getting correct uint8array for the payload ([0271271](https://github.com/kwilteam/kwil-js/commit/0271271f2baa87554b763e8a95d8eafa6c1e3d60))
