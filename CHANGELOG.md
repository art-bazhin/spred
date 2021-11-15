# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.2.1](https://github.com/art-bazhin/spred/compare/v0.2.0...v0.2.1) (2021-11-15)

## [0.2.0](https://github.com/art-bazhin/spred/compare/v0.1.3...v0.2.0) (2021-11-15)


### ⚠ BREAKING CHANGES

* checkValueChange => shouldUpdate, onChange => onUpdate
* async => batchUpdates, logError => logException, checkDirty => checkValueChange
* second argument of computed changed to atom configuration
* atom => writable, Atom => WritableAtom, Observable => Atom

### Features

* add atom configuration ([7fec629](https://github.com/art-bazhin/spred/commit/7fec629ac194351eaf353376bd563d2e9dd729a5))
* add noncallable signals and siganl start/end listeners ([e19b81e](https://github.com/art-bazhin/spred/commit/e19b81e76350af9255b24f66372c39d8276e5140))
* add notify method ([f589aa2](https://github.com/art-bazhin/spred/commit/f589aa2baa6bf0997316d507bf4706e94a05c55d))
* add observable lifecycle signals ([40f42ce](https://github.com/art-bazhin/spred/commit/40f42ce08199ca06682565267afc043c417e716f))
* add readonly ([20a59ae](https://github.com/art-bazhin/spred/commit/20a59ae11018d030d6f750824006c6ccf02a7c10))
* specify changes check function in atom config ([acb931c](https://github.com/art-bazhin/spred/commit/acb931ca8b45ddcb5958905b2b902c9e63efa134))


### Bug Fixes

* fix configs after config properties update ([f1be878](https://github.com/art-bazhin/spred/commit/f1be8785a20ceeb513d069c148fbff112134eb76))
* fix default config type ([b94c96a](https://github.com/art-bazhin/spred/commit/b94c96a2e9bd4700e7d08e45bc257defd575358e))
* fix unsubscribing bug ([21f9e97](https://github.com/art-bazhin/spred/commit/21f9e97a08ee3b51465a40aff93e770c94edc9b3))


### Tests

* add missing tests ([3016f2b](https://github.com/art-bazhin/spred/commit/3016f2b2efc0f874ac70b191a7f89450ca0fa58f))
* fix lib config in watch function test ([48354a0](https://github.com/art-bazhin/spred/commit/48354a00445a94a3bbb1810d616abd7e7b052722))


### Others

* update benchmark ([3fa6871](https://github.com/art-bazhin/spred/commit/3fa6871e290ca393c252e4994f72d5fb4b779faa))


### Code Refactoring

* change API namings ([a1415d5](https://github.com/art-bazhin/spred/commit/a1415d514ada7b790ba9f978349d60d0f3bf837d))
* change config properties ([5ce833b](https://github.com/art-bazhin/spred/commit/5ce833bd640c0bc9d14bad4edec94f55502dba69))
* update naming ([07585c8](https://github.com/art-bazhin/spred/commit/07585c8dff80f01ec181d69c59f69125d5307a81))


### CI

* add coverage step ([e441042](https://github.com/art-bazhin/spred/commit/e44104284320347b23d49b49759a7e824d685da6))


### Docs

* add badges ([4190b03](https://github.com/art-bazhin/spred/commit/4190b03af6582af0fdbd09d00c015b05d5744729))


### Build System

* update lockfile ([f3c3542](https://github.com/art-bazhin/spred/commit/f3c354225e1c3d24447857ca5d3cd1e8d1262391))

### [0.1.3](https://github.com/art-bazhin/spred/compare/v0.1.2...v0.1.3) (2021-11-11)

### [0.1.2](https://github.com/art-bazhin/spred/compare/v0.1.1...v0.1.2) (2021-11-10)


### Features

* add signals ([3a9037f](https://github.com/art-bazhin/spred/commit/3a9037f6fc0b486bd0fc86bb89ab7b9af35a3680))


### Others

* **release:** 0.1.2 ([ca15050](https://github.com/art-bazhin/spred/commit/ca1505032ef7843f78951ce25d3c49375f637668))

### [0.1.1](https://github.com/art-bazhin/spred/compare/v0.1.0...v0.1.1) (2021-11-10)

### Bug Fixes

- fix global var name conflict ([8d07e3a](https://github.com/art-bazhin/spred/commit/8d07e3a9a1425b8acd80b4bffd0ba5894242142c))

### CI

- fix CI release trigger ([abb550b](https://github.com/art-bazhin/spred/commit/abb550b8555a7b1b69ee4e0c43893692d0139256))

## 0.1.0 (2021-11-09)

### ⚠ BREAKING CHANGES

- Previous value of an observable is passed to subscribers as second argument. Error
  is passed as third argument.

### Features

- add configuration object ([4a805b8](https://github.com/art-bazhin/spred/commit/4a805b8ba46e087ff9afc3ac15bbca64b10b0ad7))
- add watch function ([7e7d436](https://github.com/art-bazhin/spred/commit/7e7d4363b1543ad452b21159d5b282f402769302))
- allow to use the library in sync mode ([d891908](https://github.com/art-bazhin/spred/commit/d891908f1822df6410ebac5ce67cb509c2a5d60d))
- pass errors to subscribers ([e4ae2f8](https://github.com/art-bazhin/spred/commit/e4ae2f8c785c1ed80d1c40b1038726d424ebde9a))
- pass previous value to subscribers and computeds ([e3b2eed](https://github.com/art-bazhin/spred/commit/e3b2eeda11e6fbd37d3e43e0bbb8585bf2b4ccaf))
- rework error handling ([29128b9](https://github.com/art-bazhin/spred/commit/29128b95570418b8d3582d2d2cf765c193c7d9ff))
- spread errors to dependants ([881e144](https://github.com/art-bazhin/spred/commit/881e144ee04eba58f6fbcc8bbcf49415351cfc4e))

### Bug Fixes

- add circular dependencies handling ([4aa3f14](https://github.com/art-bazhin/spred/commit/4aa3f144d42b32bb02e6e4e616562c5baca7531d))
- fix calculation bug ([c8f01b3](https://github.com/art-bazhin/spred/commit/c8f01b36f1d3f09d13419c6699d73164092b35a3))
- fix error handling in inactive observables ([7b44fcf](https://github.com/art-bazhin/spred/commit/7b44fcf4f08c57bc8ce61cf3ee1de78d63a5a117))
- fix remove from array ([73ab399](https://github.com/art-bazhin/spred/commit/73ab399ac9103fc5ca049b68e2c78390aec62ade))

### Performance Improvements

- cache observable values during stack calculation ([652b2db](https://github.com/art-bazhin/spred/commit/652b2db19882f61da6809c5a3a69c1d98c06d6ad))
- mark all dependencies as active on subscribe ([f169318](https://github.com/art-bazhin/spred/commit/f16931878ab5c19524ab29aa92a8b1ff372b4488))

### Code Refactoring

- remove redundant check ([ee56336](https://github.com/art-bazhin/spred/commit/ee56336f565de888b1eb97609f9db47c0dc06f60))

### Tests

- add atom and computed tests ([1d97581](https://github.com/art-bazhin/spred/commit/1d9758111f1ffe8f913e7d07da3c255ee797b0d6))
- add missing tests ([8b28ab5](https://github.com/art-bazhin/spred/commit/8b28ab5b35abfd7e0189cfc13d931162e574f37c))
- add observable tests ([d85e9c9](https://github.com/art-bazhin/spred/commit/d85e9c953b390b9635e13a0db7608b0df9b37fe3))
- exclude utils from coverage ([cd36021](https://github.com/art-bazhin/spred/commit/cd3602180c5ad970680d9bbd57f661b0b4092186))
- turn off error logging in tests ([df35216](https://github.com/art-bazhin/spred/commit/df35216e3025c4759aba247b39fbd684dd9f1430))

### Styling

- prettify code ([c86f047](https://github.com/art-bazhin/spred/commit/c86f0470ee2cd7c4ad3b017bc074658fac0dc893))
- prettify code ([dff72ac](https://github.com/art-bazhin/spred/commit/dff72ace6b99a90a1aeaf84de19f163a4d6e3524))

### Build System

- npm audit fix ([00ab942](https://github.com/art-bazhin/spred/commit/00ab9429e7f4b435c7bc2d3c8f3ade85824f7e10))

### Others

- update benchmark and build type ([7be68b9](https://github.com/art-bazhin/spred/commit/7be68b96c1d9f8bbc421dba4880f5436490dcc29))

### CI

- add build job ([4709764](https://github.com/art-bazhin/spred/commit/47097649a32c8291441214f11336198222e1e62f))
- add publish step in CI ([1b1625a](https://github.com/art-bazhin/spred/commit/1b1625a074a13d819034214c7d0a441e0c17bb0f))
- add test step in CI ([e979391](https://github.com/art-bazhin/spred/commit/e979391abc46be85eb0751c0417a23af744b54b3))
- change CI triggers ([5304da2](https://github.com/art-bazhin/spred/commit/5304da219d9a6600ab6680afe6cfe0a4f02af1e6))
- remove old ci configs ([68a0d1a](https://github.com/art-bazhin/spred/commit/68a0d1ac8622d3b65b1effc417904f3e05f0ed4d))
