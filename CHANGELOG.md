# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.18.9](https://github.com/art-bazhin/spred/compare/v0.18.8...v0.18.9) (2022-08-17)


### Bug Fixes

* **effect:** emit aborted signal on pending effect call ([12bb6a1](https://github.com/art-bazhin/spred/commit/12bb6a19eb32a11de9f5327c331d4630b45f39db))

### [0.18.8](https://github.com/art-bazhin/spred/compare/v0.18.7...v0.18.8) (2022-08-14)


### Bug Fixes

* **catcher:** fix exception logging on signals with subs ([9ee7571](https://github.com/art-bazhin/spred/commit/9ee75717be41c24dd9d269dbd6d6ceb4c2e2be75))


### Tests

* **catcher:** add missing test case ([f4f4759](https://github.com/art-bazhin/spred/commit/f4f47591129d9dea6453bef9089f8da4eeb652b0))

### [0.18.7](https://github.com/art-bazhin/spred/compare/v0.18.6...v0.18.7) (2022-08-13)


### Features

* **effect:** add aborted signal ([bd137ed](https://github.com/art-bazhin/spred/commit/bd137ed19df09b5c11ae18e1d01b52ce68a4d1f1))


### Code Refactoring

* remove redundant checks ([649febe](https://github.com/art-bazhin/spred/commit/649febe5c79777fd288bce30f890902877c9900b))


### Tests

* add effect tests ([76e4394](https://github.com/art-bazhin/spred/commit/76e4394213a07795da6b95841134e5a41d917f60))
* add guards test ([51aab22](https://github.com/art-bazhin/spred/commit/51aab222c7cf66503ffe0d51bc935b1d1a442f42))
* add missing tests ([04f9b9b](https://github.com/art-bazhin/spred/commit/04f9b9b5f439d16118f4301c69b7ab857c03a8e9))
* add missing tests ([b34b0ca](https://github.com/art-bazhin/spred/commit/b34b0ca8c8a4eefedbfd8f259ae069455ef9c55e))
* update store tests ([e2003b8](https://github.com/art-bazhin/spred/commit/e2003b8060769eeef4c3122052591101cb11926f))


### Docs

* update docs ([f6d0bf1](https://github.com/art-bazhin/spred/commit/f6d0bf1fd2cc4a69c7e5e0e9b9afadaeb7fc1571))

### [0.18.6](https://github.com/art-bazhin/spred/compare/v0.18.5...v0.18.6) (2022-08-03)


### Features

* batch updates in subscribers ([3e914d9](https://github.com/art-bazhin/spred/commit/3e914d9b3b45e397288d59ab7f8822d0948f32e6))

### [0.18.5](https://github.com/art-bazhin/spred/compare/v0.18.4...v0.18.5) (2022-08-03)


### Performance Improvements

* minor memory allocation improvements ([fdf891b](https://github.com/art-bazhin/spred/commit/fdf891bcc4d8513017160f01f5ee8bccd879a187))

### [0.18.4](https://github.com/art-bazhin/spred/compare/v0.18.3...v0.18.4) (2022-08-03)


### Features

* add collect function ([34609c9](https://github.com/art-bazhin/spred/commit/34609c9b888686989fc799822fcf4a24bb5acef5))
* do not clean up subscriptions inside subscribers ([33aca25](https://github.com/art-bazhin/spred/commit/33aca25d0be0d7228d57482afd52d9395b8db9a0))

### [0.18.3](https://github.com/art-bazhin/spred/compare/v0.18.2...v0.18.3) (2022-08-01)


### Bug Fixes

* fix lifecycle unsubscribing order ([396de37](https://github.com/art-bazhin/spred/commit/396de3744f848c4ee45dffe90242138abcddb597))


### Tests

* check that lifecycle unsubscibing occurs after value unsubscribing ([07ed3f5](https://github.com/art-bazhin/spred/commit/07ed3f5e93eda9dba0c6192545a40b2b9af51c7f))

### [0.18.2](https://github.com/art-bazhin/spred/compare/v0.18.1...v0.18.2) (2022-08-01)


### Others

* fix changelog ([1fb28c6](https://github.com/art-bazhin/spred/commit/1fb28c6adb7351e6abcca21517e1723fbbca4ff6))

### [0.18.1](https://github.com/art-bazhin/spred/compare/v0.18.0...v0.18.1) (2022-08-01)

## [0.18.0](https://github.com/art-bazhin/spred/compare/v0.16.9...v0.18.0) (2022-08-01)

### Bug Fixes

- clean up lifecycle subs ([d9fe0d9](https://github.com/art-bazhin/spred/commit/d9fe0d9fd14c0904d0ac0f6c82fc242e552438f2))

### Others

- **release:** 0.17.0 ([7334e02](https://github.com/art-bazhin/spred/commit/7334e0216098d387b29aceb61e5ee4997bdbb836))

### Tests

- add lifecycle unsubscribing tests ([40a6e52](https://github.com/art-bazhin/spred/commit/40a6e52638e08823c6fb07d909ba58685f7abe72))

## [0.17.0](https://github.com/art-bazhin/spred/compare/v0.16.9...v0.17.0) (2022-08-01)

### ⚠ BREAKING CHANGES

- createEntity -> entity

### Features

- rename api methods ([3589c10](https://github.com/art-bazhin/spred/commit/3589c106a9f5efbd916373b8f0e4a83a23c2e448))

### [0.16.9](https://github.com/art-bazhin/spred/compare/v0.16.8...v0.16.9) (2022-07-31)

### Bug Fixes

- fix subscriptions cleanup bug ([7af5f61](https://github.com/art-bazhin/spred/commit/7af5f61827225d1c72fcee394fe82faafe433884))

### [0.16.8](https://github.com/art-bazhin/spred/compare/v0.16.7...v0.16.8) (2022-07-31)

### Bug Fixes

- fix cleanup inside subscriptions ([4331f6c](https://github.com/art-bazhin/spred/commit/4331f6c5449207da451188666c16331b63b0fd8c))

### [0.16.7](https://github.com/art-bazhin/spred/compare/v0.16.6...v0.16.7) (2022-07-31)

### Bug Fixes

- fix unsubscribing nested subs ([3d902e2](https://github.com/art-bazhin/spred/commit/3d902e2b45715024d0847dbe9bf325e1df26d3d4))

### Tests

- add missing tests ([83c0798](https://github.com/art-bazhin/spred/commit/83c0798efb898f6b8dd193ee50b3c11d9ee36330))
- add missing tests ([5d2b413](https://github.com/art-bazhin/spred/commit/5d2b4139f2042c7b70766d2c2e13ef1e46321143))

### [0.16.6](https://github.com/art-bazhin/spred/compare/v0.16.5...v0.16.6) (2022-07-30)

### Features

- clear subscriptions inside isolated fn ([1141d9d](https://github.com/art-bazhin/spred/commit/1141d9d0e6b517c6a4264f087d6abd7500c6f3c4))

### [0.16.5](https://github.com/art-bazhin/spred/compare/v0.16.4...v0.16.5) (2022-07-29)

### Features

- pass arguments to isolate fn ([00c73b4](https://github.com/art-bazhin/spred/commit/00c73b41087a6f37961b136a270596cc48da1131))

### Code Refactoring

- refactor stack ([1e25d16](https://github.com/art-bazhin/spred/commit/1e25d164dba1e216d9c267c941184e79ebcfe928))

### [0.16.4](https://github.com/art-bazhin/spred/compare/v0.16.3...v0.16.4) (2022-07-29)

### Features

- add check function ([c2c0f33](https://github.com/art-bazhin/spred/commit/c2c0f339debe791bcbf1f95d8860599b298d2030))
- add isolate function ([11f15b3](https://github.com/art-bazhin/spred/commit/11f15b314507d229739cdb8ded1289fe971cd85a))

### [0.16.3](https://github.com/art-bazhin/spred/compare/v0.16.2...v0.16.3) (2022-07-29)

### Bug Fixes

- fix exception logging inside computeds ([4fbd49f](https://github.com/art-bazhin/spred/commit/4fbd49fcfe92a304925b0f2a3afd384352da98a4))

### [0.16.2](https://github.com/art-bazhin/spred/compare/v0.16.1...v0.16.2) (2022-07-26)

### Code Refactoring

- refactor stack of computeds ([fe8619a](https://github.com/art-bazhin/spred/commit/fe8619a53990adb8f0aec1ac5faa86e163ed6a02))

### [0.16.1](https://github.com/art-bazhin/spred/compare/v0.16.0...v0.16.1) (2022-07-25)

### Performance Improvements

- upgrade dependency actualization ([b638f78](https://github.com/art-bazhin/spred/commit/b638f787c45289dfef03d36a818bb1417bb1bf5e))

### Code Refactoring

- use one set of observers instad of two ([36b2272](https://github.com/art-bazhin/spred/commit/36b22727664c74514c9ce7039f1a0c4fd32486dd))

## [0.16.0](https://github.com/art-bazhin/spred/compare/v0.15.3...v0.16.0) (2022-07-24)

### ⚠ BREAKING CHANGES

- subscribers will not recieve previous value as second argument

### Features

- remove previous value from state ([03529f9](https://github.com/art-bazhin/spred/commit/03529f9e0b2ccb44934c13b5f90c9b8723a905eb))

### Code Refactoring

- change lifecycle methods placement ([d3e6904](https://github.com/art-bazhin/spred/commit/d3e69043713ace0889dc551207da45c5b3ff0255))

### [0.15.3](https://github.com/art-bazhin/spred/compare/v0.15.2...v0.15.3) (2022-07-24)

### Styling

- fix var name ([c580900](https://github.com/art-bazhin/spred/commit/c580900c3c31b878306464c233541d4c521fada8))

### Tests

- update cellx benchmark ([4e05865](https://github.com/art-bazhin/spred/commit/4e058651bbbecdc0f2c018b1630610615fcc369f))

### Code Refactoring

- refactor caching values ([4777100](https://github.com/art-bazhin/spred/commit/47771004b7b01147c608b312be7e6678e483c63f))
- refactor signal factories ([4e6f9c0](https://github.com/art-bazhin/spred/commit/4e6f9c04101248297f729a04f4be96282ebbd6d4))
- remove redundant code from state creation ([fc87ad3](https://github.com/art-bazhin/spred/commit/fc87ad3b7b580cc62ee08ee927f51587fb6a5e8f))
- update file structure ([b004d19](https://github.com/art-bazhin/spred/commit/b004d197a786f5db761975c5fef451ea423ff509))

### [0.15.2](https://github.com/art-bazhin/spred/compare/v0.15.1...v0.15.2) (2022-07-22)

### Bug Fixes

- fix redundant deps deactivation ([5661be8](https://github.com/art-bazhin/spred/commit/5661be860f34d8d11e9754cd3625769b5c099f65))
- remove console log ([d875600](https://github.com/art-bazhin/spred/commit/d875600a2178cdd468f8c242eaa27912cf0a2b41))

### Performance Improvements

- improve deps actualization wip ([ad6886b](https://github.com/art-bazhin/spred/commit/ad6886b679714f5f7c6ad930f4959d0f0f1e23a1))

### Tests

- add missing test case ([2153ff2](https://github.com/art-bazhin/spred/commit/2153ff27fb145b44a026383a14c8aa3afe38e5d9))
- add missing test cases ([fa17bb8](https://github.com/art-bazhin/spred/commit/fa17bb80a050aae879fa20c9d0c600225fab2fe0))
- add unsub perf benchmark ([19f3c47](https://github.com/art-bazhin/spred/commit/19f3c47bb6091c0928bdc9c61a6345dbdae2df54))

### Code Refactoring

- refactor depedndencies removal ([6e12f3a](https://github.com/art-bazhin/spred/commit/6e12f3a562e46120f7f4792c6a94476a6f5739c3))
- rewrite dependencies with sets ([114997f](https://github.com/art-bazhin/spred/commit/114997f48e7c3e70b27201f464ad4ff512d0c3d8))

### [0.15.1](https://github.com/art-bazhin/spred/compare/v0.15.0...v0.15.1) (2022-07-18)

### Build System

- update terser config ([eaa98ef](https://github.com/art-bazhin/spred/commit/eaa98ef5534a9ed6d25ce18bcea0c397af906421))

### Docs

- update docs ([85d48d3](https://github.com/art-bazhin/spred/commit/85d48d380c047629cb90b5cc5095fae2a258663e))
- update readme ([dc14092](https://github.com/art-bazhin/spred/commit/dc14092bde3a85522b29ba1a856bab301206b914))

## [0.15.0](https://github.com/art-bazhin/spred/compare/v0.14.2...v0.15.0) (2022-04-04)

### ⚠ BREAKING CHANGES

- add create prefix to factory methods

### Performance Improvements

- improve dependency actualization ([da778d5](https://github.com/art-bazhin/spred/commit/da778d5e39d27dac78ad0937c4072089a98bf6cb))

### Docs

- update docs ([909f226](https://github.com/art-bazhin/spred/commit/909f2262173963422f0aa4d64ba681ae9a642b57))

### Code Refactoring

- rename API methods ([23d3dfd](https://github.com/art-bazhin/spred/commit/23d3dfd235e2e736889e6988e9a1054f55fb9cec))

### Tests

- update lib versions in benchmark ([eabcfa4](https://github.com/art-bazhin/spred/commit/eabcfa4bfa4cc693aa55eacfaf503cd485be7f67))

### Build System

- update dependencies ([5b9b3f8](https://github.com/art-bazhin/spred/commit/5b9b3f88545bdb2bbb22b048ff7e5b7feea5a42f))

### [0.14.2](https://github.com/art-bazhin/spred/compare/v0.14.1...v0.14.2) (2022-01-08)

### Performance Improvements

- use subscribers set instead of an arra ([e30182c](https://github.com/art-bazhin/spred/commit/e30182cd3844e473373e52112cee2d9196fa39a1))

### Others

- add med values in benchmark ([2c3eadf](https://github.com/art-bazhin/spred/commit/2c3eadf24d41496079bb2f30aa3afd5aff8dc799))

### [0.14.1](https://github.com/art-bazhin/spred/compare/v0.14.0...v0.14.1) (2021-12-28)

### Bug Fixes

- **store:** fix redundant notifications bug ([1a3d6c3](https://github.com/art-bazhin/spred/commit/1a3d6c33a6173db21e54b1fbb231d4712026a27d))

### Others

- **bench:** fix import ([8200da1](https://github.com/art-bazhin/spred/commit/8200da1c6f59905f4bd18620031842a759dd626d))

### Code Refactoring

- move calc and batch check in recalc function ([fc3f4a1](https://github.com/art-bazhin/spred/commit/fc3f4a13e08a9259232516549ae44c8f2a4a6fef))

## [0.14.0](https://github.com/art-bazhin/spred/compare/v0.13.4...v0.14.0) (2021-12-27)

### ⚠ BREAKING CHANGES

- rename value method to sample

### Features

- add type guards ([5ca628c](https://github.com/art-bazhin/spred/commit/5ca628ce44aa3ea18d3b349ad5dae0a88b33f116))

### Bug Fixes

- don't track dependencies inside subscribers ([7396078](https://github.com/art-bazhin/spred/commit/73960789b0c710517b71b59a8a3958860c0ed564))
- fix value method ([471b85f](https://github.com/art-bazhin/spred/commit/471b85fb0f6b54536fd9c49d21dc378cd84e5f66))

### [0.13.4](https://github.com/art-bazhin/spred/compare/v0.13.3...v0.13.4) (2021-12-25)

### Bug Fixes

- **computed:** fix setting signal values inside computeds ([3f69a86](https://github.com/art-bazhin/spred/commit/3f69a86ae9bdb6ee6d2b7d58c1f78c082878e2c2))

### [0.13.3](https://github.com/art-bazhin/spred/compare/v0.13.2...v0.13.3) (2021-12-24)

### Build System

- fix configs extension ([db72dd8](https://github.com/art-bazhin/spred/commit/db72dd8cd31e3c3bfa0df9c2ddcf7655c57c0305))
- use commonjs ([4032c2d](https://github.com/art-bazhin/spred/commit/4032c2d916eac7ef7dce1a6d303646c8f0354bf1))

### [0.13.2](https://github.com/art-bazhin/spred/compare/v0.13.1...v0.13.2) (2021-12-24)

### Others

- fix package module type ([2638dc2](https://github.com/art-bazhin/spred/commit/2638dc2afe8255d586e331c15fc87059f70cb3d3))

### [0.13.1](https://github.com/art-bazhin/spred/compare/v0.13.0...v0.13.1) (2021-12-24)

### Bug Fixes

- **signal:** add signal initial value ([ecbc3e2](https://github.com/art-bazhin/spred/commit/ecbc3e2b86f95a2b839c64fc83923f207d0c38c3))

## [0.13.0](https://github.com/art-bazhin/spred/compare/v0.12.2...v0.13.0) (2021-12-24)

### ⚠ BREAKING CHANGES

- signal => writable, action => signal

### Code Refactoring

- rename api methods ([4d013a1](https://github.com/art-bazhin/spred/commit/4d013a1f14fccb987cba2f55325313cb934ca137))

### [0.12.2](https://github.com/art-bazhin/spred/compare/v0.12.1...v0.12.2) (2021-12-24)

### Bug Fixes

- **memo:** fix change detection bug ([7392330](https://github.com/art-bazhin/spred/commit/73923301bb96d7495f93361922a54fcd3b5fe01d))

### [0.12.1](https://github.com/art-bazhin/spred/compare/v0.12.0...v0.12.1) (2021-12-23)

### Features

- add action ([d51bf75](https://github.com/art-bazhin/spred/commit/d51bf755758ecf55c15473e44120e190481a3beb))

## [0.12.0](https://github.com/art-bazhin/spred/compare/v0.11.1...v0.12.0) (2021-12-23)

### ⚠ BREAKING CHANGES

- rename atom to signal, remove old signal function

### Features

- add catcher ([d02eed4](https://github.com/art-bazhin/spred/commit/d02eed4b32383b1a1c8145ff795efd198ee3c4d4))
- **memo:** add memo ([1660399](https://github.com/art-bazhin/spred/commit/1660399a380fe98779a5721180c7189cffb06b4c))

### Code Refactoring

- rename atom to signal ([dcb7186](https://github.com/art-bazhin/spred/commit/dcb718667e82dc071e4d1a1c654e21391ef28b61))

### [0.11.1](https://github.com/art-bazhin/spred/compare/v0.11.0...v0.11.1) (2021-12-23)

### Bug Fixes

- **store:** fix store data notifications ([4535eb2](https://github.com/art-bazhin/spred/commit/4535eb23fd9b8562f98414bd0d422ef051a57be4))

## [0.11.0](https://github.com/art-bazhin/spred/compare/v0.10.2...v0.11.0) (2021-12-23)

### ⚠ BREAKING CHANGES

- Default async batching has been removed. Use batch function instead.

### Code Refactoring

- remove async batching ([de07a87](https://github.com/art-bazhin/spred/commit/de07a87855e30510fe3f3625a928543fa8eef1d6))

### [0.10.2](https://github.com/art-bazhin/spred/compare/v0.10.1...v0.10.2) (2021-12-20)

### Features

- add parameter to detect if subscriber is executed immediately after subscription ([1e426e2](https://github.com/art-bazhin/spred/commit/1e426e22403c8d4effd43ddb59726675991147c2))

### [0.10.1](https://github.com/art-bazhin/spred/compare/v0.10.0...v0.10.1) (2021-12-20)

### Code Refactoring

- use atoms as signals ([b751103](https://github.com/art-bazhin/spred/commit/b751103c32af84341573aca00b7ce35226fc5ece))

## [0.10.0](https://github.com/art-bazhin/spred/compare/v0.9.4...v0.10.0) (2021-12-17)

### ⚠ BREAKING CHANGES

- VOID => undefined

### Features

- **signal:** add signal map method ([0ea8a4f](https://github.com/art-bazhin/spred/commit/0ea8a4fbc036fcb80edbe0373b0d7119a92cdb53))

### Bug Fixes

- **effect:** remove throwing error in effect data ([9fc5c4a](https://github.com/art-bazhin/spred/commit/9fc5c4a5c3d0ff26cb9707b8e924bd409dece17a))
- **signal:** fix signal payload filtering ([ae40f89](https://github.com/art-bazhin/spred/commit/ae40f8917d7afa325143051e28b1ed75165b340c))

### Code Refactoring

- remove VOID ([8f94238](https://github.com/art-bazhin/spred/commit/8f94238432000e1ada15d360206534a5cd00e8bb))

### Docs

- update docs ([c75f9ed](https://github.com/art-bazhin/spred/commit/c75f9ed3a00b11f1f3cab3d84fddd35d9fb329d3))
- update docs ([9e3076c](https://github.com/art-bazhin/spred/commit/9e3076c82beb934d58a7a94b9ab96860c647a160))
- update docs ([9027b7f](https://github.com/art-bazhin/spred/commit/9027b7f6a676a11cedd0f604bd11966b8b2c2c57))
- update docs ([6bbd104](https://github.com/art-bazhin/spred/commit/6bbd104bca6f7fdd3e881c98a5342365394c31d0))
- update docs ([869f1de](https://github.com/art-bazhin/spred/commit/869f1de8d8a5477e2379cc7fd323584f2b0de321))
- update readme ([706766e](https://github.com/art-bazhin/spred/commit/706766ef5ac84e07b224b7b756faaafa8ff03177))

### [0.9.4](https://github.com/art-bazhin/spred/compare/v0.9.3...v0.9.4) (2021-12-12)

### CI

- change coveralls to codecov ([1ab3feb](https://github.com/art-bazhin/spred/commit/1ab3febac0946da4852535d46cd5ee6e3a9b94c2))

### Docs

- add typedoc ([c7b663a](https://github.com/art-bazhin/spred/commit/c7b663a603233a3e65f2d613f37cc18c5b27f558))
- update coverage badge in readme ([cd45c67](https://github.com/art-bazhin/spred/commit/cd45c6724da820d62e3ae7453a51601d44ebd58b))

### [0.9.3](https://github.com/art-bazhin/spred/compare/v0.9.2...v0.9.3) (2021-12-10)

### Bug Fixes

- fix triggering recalculation inside signal listeners ([b951c39](https://github.com/art-bazhin/spred/commit/b951c39a1084f54781fb0c44fe3f0f5d6c78d998))

### Tests

- add missing tests ([351e03b](https://github.com/art-bazhin/spred/commit/351e03b040e8ddabe5e6f3f5b90b81e8e9a17c35))

### [0.9.2](https://github.com/art-bazhin/spred/compare/v0.9.1...v0.9.2) (2021-12-09)

### Bug Fixes

- fix undefined passed to atom subscribers when notifying ([94968f6](https://github.com/art-bazhin/spred/commit/94968f6d979deebca3aeae60150ca4922feffaeb))

### [0.9.1](https://github.com/art-bazhin/spred/compare/v0.9.0...v0.9.1) (2021-12-09)

### Bug Fixes

- fix computedFn argument type ([6cc1c64](https://github.com/art-bazhin/spred/commit/6cc1c64ff0c4fd748fdef4cda59f11ad569c75ea))

### Docs

- add atom methods docs ([9b870a3](https://github.com/art-bazhin/spred/commit/9b870a3b7afa0149a1bb1d1027d46f1adb83084a))
- **computed:** add computed function docs ([91f8de7](https://github.com/art-bazhin/spred/commit/91f8de7c755cc69c7959ce523d0d6b7cfdebf273))
- **core:** add recalc function docs ([be40613](https://github.com/art-bazhin/spred/commit/be406135e7c5d5b81b09140d855c20be2feb6391))
- **lifecycle:** add lifecycle methods docs ([4b3cd76](https://github.com/art-bazhin/spred/commit/4b3cd76a4ef30afd54c46390db70fc59ce45a4af))
- **readonly:** add readonly function docs ([611ab4b](https://github.com/art-bazhin/spred/commit/611ab4bcbc9e2da5e01f839c9602d10c0cd817b7))
- update docs ([2c6db8a](https://github.com/art-bazhin/spred/commit/2c6db8a4ddbb6eba13003b2ef039f766b91ec5ec))
- update docs ([d8c5e5f](https://github.com/art-bazhin/spred/commit/d8c5e5f479423ec56800a35dd1470b7faa7ba80b))
- update docs ([8c192cc](https://github.com/art-bazhin/spred/commit/8c192cc963d6a3eb544ac940f800c36fec9a26e9))
- update docs ([ad4f234](https://github.com/art-bazhin/spred/commit/ad4f23433c0ddec4cdc93826c4977797a9397ba7))
- **watch:** add watch function docs ([5733dad](https://github.com/art-bazhin/spred/commit/5733dad96bfa2fc246ea2d99357b804155734e37))

## [0.9.0](https://github.com/art-bazhin/spred/compare/v0.8.0...v0.9.0) (2021-12-08)

### ⚠ BREAKING CHANGES

- **effect:** default effect data value changed to VOID from undefined

### Bug Fixes

- **effect:** fix default effect data value ([e6d4f56](https://github.com/art-bazhin/spred/commit/e6d4f56f1f2f05610fca14304feb0ceac8e91135))
- fix default atom value ([1cddf66](https://github.com/art-bazhin/spred/commit/1cddf66f17738b19f62615d9781144cb2dcd9e01))
- fix redundant writable notifications ([95523d3](https://github.com/art-bazhin/spred/commit/95523d3f65fa98f2ecb59120af3f93fddce7984b))

## [0.8.0](https://github.com/art-bazhin/spred/compare/v0.7.2...v0.8.0) (2021-12-07)

### ⚠ BREAKING CHANGES

- store.get => store.getAtom

### Code Refactoring

- store.get returns item instead of atom ([1ef28cb](https://github.com/art-bazhin/spred/commit/1ef28cb5611000046a58570386cd97a1b0979168))

### [0.7.2](https://github.com/art-bazhin/spred/compare/v0.7.1...v0.7.2) (2021-12-06)

### Bug Fixes

- fix store argument type ([444de64](https://github.com/art-bazhin/spred/commit/444de648513276a52a15d956b9a1647ab92aff94))

### Docs

- update readme ([18b89a3](https://github.com/art-bazhin/spred/commit/18b89a3fb7056e1d7502af0c9f4c70ebab0b9891))

### [0.7.1](https://github.com/art-bazhin/spred/compare/v0.7.0...v0.7.1) (2021-12-06)

### Features

- add store data field ([84ec28e](https://github.com/art-bazhin/spred/commit/84ec28ed56cd141d278af87914f7e65dd1e531b8))

## [0.7.0](https://github.com/art-bazhin/spred/compare/v0.6.0...v0.7.0) (2021-12-05)

### ⚠ BREAKING CHANGES

- filter => shouldUpdate, NULL => VOID

### Bug Fixes

- fix redundant calculations on store set ([32c155c](https://github.com/art-bazhin/spred/commit/32c155ca62a041fb4f8fe351bfa70885a6897481))

### Code Refactoring

- update types and naming ([dc48109](https://github.com/art-bazhin/spred/commit/dc481090a53ad49206ae1b02860e6c2dd06d86be))

## [0.6.0](https://github.com/art-bazhin/spred/compare/v0.5.1...v0.6.0) (2021-12-04)

### ⚠ BREAKING CHANGES

- signal function returns Signal instead of Atom

### Bug Fixes

- separate Signal entity ([d5407e3](https://github.com/art-bazhin/spred/commit/d5407e37a1a0a1637fd5a07d2cfc3eee17c631c3))

### [0.5.1](https://github.com/art-bazhin/spred/compare/v0.5.0...v0.5.1) (2021-12-03)

### Code Refactoring

- update NULL type ([ade8f0b](https://github.com/art-bazhin/spred/commit/ade8f0be265adff3214955abdd945b17c831cccb))

## [0.5.0](https://github.com/art-bazhin/spred/compare/v0.4.0...v0.5.0) (2021-12-03)

### ⚠ BREAKING CHANGES

- computeds have special NULL constant value by default instead of undefined

### Bug Fixes

- use special NULL constant as default value ([d2c4a9e](https://github.com/art-bazhin/spred/commit/d2c4a9efb7b1cb6037ce2d14ab68f144ae1e9f20))

## [0.4.0](https://github.com/art-bazhin/spred/compare/v0.3.1...v0.4.0) (2021-12-03)

### ⚠ BREAKING CHANGES

- effect returns the object instead of tuple

### Build System

- add babel preset env and fix imports ([74fdff9](https://github.com/art-bazhin/spred/commit/74fdff9f8492202f820a501d298e45fde5233535))
- update build config and dependencies ([9256f5c](https://github.com/art-bazhin/spred/commit/9256f5c4f653e7bc10a056e3de20a9fa965853a1))

### Code Refactoring

- change effect return type ([ec5058b](https://github.com/art-bazhin/spred/commit/ec5058b090763f0789813f7044dcf0ad9dd4a714))

### [0.3.1](https://github.com/art-bazhin/spred/compare/v0.3.0...v0.3.1) (2021-12-02)

### Features

- add optional notification wrapper ([4150521](https://github.com/art-bazhin/spred/commit/4150521077fd4defa3488ecb0f281ca268deb6a1))

## [0.3.0](https://github.com/art-bazhin/spred/compare/v0.2.2...v0.3.0) (2021-12-02)

### ⚠ BREAKING CHANGES

- pass atom options as separate arguments
- shouldUpdate => filter, handleException => catch

### Features

- add effect ([a54a51a](https://github.com/art-bazhin/spred/commit/a54a51a70f632ddbf823aa6d9b1cd8076bb3b1cc))
- add effect done atom and refactor effect status ([eb3b1ef](https://github.com/art-bazhin/spred/commit/eb3b1efd2a2a7775144394156d1c4ea48d58049e))
- add settled flag to effect ([6e32fbf](https://github.com/art-bazhin/spred/commit/6e32fbf9815c8f75c65d251af96e31a2b9af5ebc))

### Bug Fixes

- add missing export ([f0a917a](https://github.com/art-bazhin/spred/commit/f0a917a7fcb71c3733b5c2aaead1dfddf3e919c9))
- notificate subscribers after recalculation done ([10aefc5](https://github.com/art-bazhin/spred/commit/10aefc5ba17ad288ac6681fd9b58ae7a5d9998b3))

### Code Refactoring

- refactor atom options ([ca1a4ae](https://github.com/art-bazhin/spred/commit/ca1a4ae22b623185787c459485a93bbda892cee1))
- refactor signal ([ce72a47](https://github.com/art-bazhin/spred/commit/ce72a477839755237f701e3e45495e24287ba8d1))
- refactor signal and lifecycle methods ([a37d55a](https://github.com/art-bazhin/spred/commit/a37d55ac1a262f930a92248bc2abba4932af2a32))
- update atom options ([82d7eea](https://github.com/art-bazhin/spred/commit/82d7eea86c3140093a71f1022d3570c15771d0e2))

### Tests

- add effect tests ([9fcc2a7](https://github.com/art-bazhin/spred/commit/9fcc2a7f4fe059db0ea4b8b8d922f1bf4cf38f6b))
- add missing tests ([2057512](https://github.com/art-bazhin/spred/commit/205751265cf78acc303e36df03e6310ac42f4d3d))
- add missing tests ([a74ece3](https://github.com/art-bazhin/spred/commit/a74ece3ea0ce6b06e50b4f9f10aa4e60c88a4fc6))

### Docs

- update readme ([c92a79a](https://github.com/art-bazhin/spred/commit/c92a79a76612aae7ddea5f358c665a3f1b207def))

### [0.2.2](https://github.com/art-bazhin/spred/compare/v0.2.1...v0.2.2) (2021-11-17)

### Features

- add clear store method ([4d4a559](https://github.com/art-bazhin/spred/commit/4d4a5594477b3f1805c70f13bb3f7b3bd317e845))
- add store ([9c258d1](https://github.com/art-bazhin/spred/commit/9c258d1d8c11448e7a6b215a6e89aad0d6077bbc))
- add store options ([2424dd1](https://github.com/art-bazhin/spred/commit/2424dd1f0ed498e6aa8e6e2900a20154fc2011d6))

### Bug Fixes

- fix store items update bug ([f67d452](https://github.com/art-bazhin/spred/commit/f67d452b8997d9081bd239bd8cd246bc4d504d41))

### Performance Improvements

- improve store update perf ([58f4f54](https://github.com/art-bazhin/spred/commit/58f4f54a771e8dbc39a992adef263f17437f57ae))

### Tests

- add store tests ([2a8613a](https://github.com/art-bazhin/spred/commit/2a8613a53a9eb20d55e40223e536a141641e02c8))

### Code Refactoring

- refactor inner update function ([b0f8d1e](https://github.com/art-bazhin/spred/commit/b0f8d1e774f4add8920bb43b278d6fbeb643b9fc))

### Docs

- update readme ([6c057cd](https://github.com/art-bazhin/spred/commit/6c057cd4bdfc574c1575a8d9f39baf3b41c8a4ca))

### [0.2.1](https://github.com/art-bazhin/spred/compare/v0.2.0...v0.2.1) (2021-11-15)

## [0.2.0](https://github.com/art-bazhin/spred/compare/v0.1.3...v0.2.0) (2021-11-15)

### ⚠ BREAKING CHANGES

- checkValueChange => shouldUpdate, onChange => onUpdate
- async => batchUpdates, logError => logException, checkDirty => checkValueChange
- second argument of computed changed to atom configuration
- atom => writable, Atom => WritableAtom, Observable => Atom

### Features

- add atom configuration ([7fec629](https://github.com/art-bazhin/spred/commit/7fec629ac194351eaf353376bd563d2e9dd729a5))
- add noncallable signals and siganl start/end listeners ([e19b81e](https://github.com/art-bazhin/spred/commit/e19b81e76350af9255b24f66372c39d8276e5140))
- add notify method ([f589aa2](https://github.com/art-bazhin/spred/commit/f589aa2baa6bf0997316d507bf4706e94a05c55d))
- add observable lifecycle signals ([40f42ce](https://github.com/art-bazhin/spred/commit/40f42ce08199ca06682565267afc043c417e716f))
- add readonly ([20a59ae](https://github.com/art-bazhin/spred/commit/20a59ae11018d030d6f750824006c6ccf02a7c10))
- specify changes check function in atom config ([acb931c](https://github.com/art-bazhin/spred/commit/acb931ca8b45ddcb5958905b2b902c9e63efa134))

### Bug Fixes

- fix configs after config properties update ([f1be878](https://github.com/art-bazhin/spred/commit/f1be8785a20ceeb513d069c148fbff112134eb76))
- fix default config type ([b94c96a](https://github.com/art-bazhin/spred/commit/b94c96a2e9bd4700e7d08e45bc257defd575358e))
- fix unsubscribing bug ([21f9e97](https://github.com/art-bazhin/spred/commit/21f9e97a08ee3b51465a40aff93e770c94edc9b3))

### Tests

- add missing tests ([3016f2b](https://github.com/art-bazhin/spred/commit/3016f2b2efc0f874ac70b191a7f89450ca0fa58f))
- fix lib config in watch function test ([48354a0](https://github.com/art-bazhin/spred/commit/48354a00445a94a3bbb1810d616abd7e7b052722))

### Others

- update benchmark ([3fa6871](https://github.com/art-bazhin/spred/commit/3fa6871e290ca393c252e4994f72d5fb4b779faa))

### Code Refactoring

- change API namings ([a1415d5](https://github.com/art-bazhin/spred/commit/a1415d514ada7b790ba9f978349d60d0f3bf837d))
- change config properties ([5ce833b](https://github.com/art-bazhin/spred/commit/5ce833bd640c0bc9d14bad4edec94f55502dba69))
- update naming ([07585c8](https://github.com/art-bazhin/spred/commit/07585c8dff80f01ec181d69c59f69125d5307a81))

### CI

- add coverage step ([e441042](https://github.com/art-bazhin/spred/commit/e44104284320347b23d49b49759a7e824d685da6))

### Docs

- add badges ([4190b03](https://github.com/art-bazhin/spred/commit/4190b03af6582af0fdbd09d00c015b05d5744729))

### Build System

- update lockfile ([f3c3542](https://github.com/art-bazhin/spred/commit/f3c354225e1c3d24447857ca5d3cd1e8d1262391))

### [0.1.3](https://github.com/art-bazhin/spred/compare/v0.1.2...v0.1.3) (2021-11-11)

### [0.1.2](https://github.com/art-bazhin/spred/compare/v0.1.1...v0.1.2) (2021-11-10)

### Features

- add signals ([3a9037f](https://github.com/art-bazhin/spred/commit/3a9037f6fc0b486bd0fc86bb89ab7b9af35a3680))

### Others

- **release:** 0.1.2 ([ca15050](https://github.com/art-bazhin/spred/commit/ca1505032ef7843f78951ce25d3c49375f637668))

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
