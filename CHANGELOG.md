# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
