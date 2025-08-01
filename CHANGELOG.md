# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.41.1](https://github.com/art-bazhin/spred/compare/v0.41.0...v0.41.1) (2025-08-01)


### Code Refactoring

* fix duplicate sources ([e2fb1c8](https://github.com/art-bazhin/spred/commit/e2fb1c86701fc19f08a5c53eab6a92d267cb9481))
* refactor exception flag ([c1618d5](https://github.com/art-bazhin/spred/commit/c1618d541304fb9b1d5ee9779ff922b59dfb28ca))

## [0.41.0](https://github.com/art-bazhin/spred/compare/v0.40.4...v0.41.0) (2025-07-29)


### ⚠ BREAKING CHANGES

* remove immediate argument of Subscriber, remove scheduled argument of Computation
* do not filter undefined values

### Features

* add NONE constant ([dc72164](https://github.com/art-bazhin/spred/commit/dc72164070e162d58e99238072cead8117b547d8))


### Code Refactoring

* refactor dependency graph to minimize memory consumption ([1526bf3](https://github.com/art-bazhin/spred/commit/1526bf3f1dc813d99d461f0eb2e2a9741f19ee13))
* remove redundant arguments of subscriber and computation ([1f64c89](https://github.com/art-bazhin/spred/commit/1f64c89aa8c4867a2d995090cb36e07ec7deb805))


### Docs

* update docs ([fbfc61f](https://github.com/art-bazhin/spred/commit/fbfc61f425c6bd7adbc4b1a3e0f38e7616a5dde1))

### [0.40.4](https://github.com/art-bazhin/spred/compare/v0.40.3...v0.40.4) (2025-07-28)


### Features

* add get method ([2d3e6be](https://github.com/art-bazhin/spred/commit/2d3e6bed4eb5f9c8ab2aec73d050ef90ee898156))
* improve set and emit method typings ([88c1732](https://github.com/art-bazhin/spred/commit/88c1732b09b63b3cb6781991d6b94e07776e4711))


### Others

* v2 wip ([27a8661](https://github.com/art-bazhin/spred/commit/27a8661ed1aab8705897d846c0f0ab58f47f3364))


### Code Refactoring

* rewrite library core to get smaller size and better performance ([2a007a3](https://github.com/art-bazhin/spred/commit/2a007a31434fc770063a540a05f103372e421a08))


### Tests

* add subscriber order test ([3184bc5](https://github.com/art-bazhin/spred/commit/3184bc5ab47e6211d908e2d4f67e157180130bce))
* add subscriber order test ([f18cbc0](https://github.com/art-bazhin/spred/commit/f18cbc009838d8db574f4662beea63b7ba6d1899))
* update benchmark ([9931d9f](https://github.com/art-bazhin/spred/commit/9931d9fba0e3ce2723c840119375751804fb466e))


### Docs

* add undefined assignment case, fix typos ([9324637](https://github.com/art-bazhin/spred/commit/9324637f1dc11199a2dbc388c5e4367caafbf029))
* build docs ([f61304a](https://github.com/art-bazhin/spred/commit/f61304a958a81f1e124daed00acb2920afece272))
* build docs ([ce4328a](https://github.com/art-bazhin/spred/commit/ce4328ac9862bd6de97da6ed6d6ad72401335191))

### [0.40.3](https://github.com/art-bazhin/spred/compare/v0.40.2...v0.40.3) (2025-07-22)


### Features

* improve set and emit method typings ([8d46c9d](https://github.com/art-bazhin/spred/commit/8d46c9d79022ad7ac19486d33d76f2d08d49840a))


### Docs

* add undefined assignment case, fix typos ([dae08b1](https://github.com/art-bazhin/spred/commit/dae08b1e139069f4b5cd94a449e27f3718089e97))
* rebuild docs ([9c058aa](https://github.com/art-bazhin/spred/commit/9c058aa7f2360ef5f7692a047e45bf4655ed8e6c))

### [0.40.2](https://github.com/art-bazhin/spred/compare/v0.40.1...v0.40.2) (2024-11-04)


### Build System

* move alien-signals to dev dependencies ([98eb090](https://github.com/art-bazhin/spred/commit/98eb090e3488c295867bca4e9700ae29fb952bfb))

### [0.40.1](https://github.com/art-bazhin/spred/compare/v0.40.0...v0.40.1) (2024-11-03)


### Docs

* fix changelog mistakes ([e685657](https://github.com/art-bazhin/spred/commit/e68565727d33bdfa4846c4034195644e98be1ef8))

## [0.40.0](https://github.com/art-bazhin/spred/compare/v0.38.0...v0.40.0) (2024-11-03)

### Tests

- add alien-signals benchmark ([88d483e](https://github.com/art-bazhin/spred/commit/88d483eab4d1e2403183fdab6ed6ba779844a2e8))
- add alien-signals linking bench ([eff48b4](https://github.com/art-bazhin/spred/commit/eff48b4970e62939c23cbac70df55a344f3111ea))

### Styling

- use export from in index file ([18cb4c3](https://github.com/art-bazhin/spred/commit/18cb4c3573e6e21780484f176c8ed93146a6b96e))

### Build System

- add unpkg field in package.json ([28c1304](https://github.com/art-bazhin/spred/commit/28c1304f22b5bb4b7d20bfa3dbc94b8b153ffe67))

### Docs

- fix readme ([c7d51d8](https://github.com/art-bazhin/spred/commit/c7d51d8bdd0e0d840b456af9da2b73284b44b563))
- update docs index ([90e8a6d](https://github.com/art-bazhin/spred/commit/90e8a6d9ed11fc3c9ebb817c3b8fc6f10eb53272))

## [0.39.0](https://github.com/art-bazhin/spred/compare/v0.38.0...v0.39.0) (2024-09-11)

### ⚠ BREAKING CHANGES

- removed Signal.get method, use Signal.value instead
- writable, computed, isSignal, isWritableSignal were removed

### Features

- add ability to return destructor from onActivate option ([85e0428](https://github.com/art-bazhin/spred/commit/85e0428d6c6a82ab4cfdeddf408c76d9264a78ce))
- add actions ([3f9315d](https://github.com/art-bazhin/spred/commit/3f9315d3658b915172f128f4a5995659a3222950))
- add pipes ([07e91b8](https://github.com/art-bazhin/spred/commit/07e91b8b3d3623cce2e6ac669d20b40ef6e11d0c))
- remove get method ([a5a3683](https://github.com/art-bazhin/spred/commit/a5a36834af882d4858697de62df6d2e253d303d5))

### Performance Improvements

- fix temp data cleanup ([bf99a42](https://github.com/art-bazhin/spred/commit/bf99a42930dbb90ab6fb931f99f3b826446b0b44))

### Others

- fix changelog ([8f6830f](https://github.com/art-bazhin/spred/commit/8f6830fc22b078b0dfdea3c6451e9ce5cfd71a45))

### Build System

- update dependencies ([aa84bc9](https://github.com/art-bazhin/spred/commit/aa84bc9833744407dd935e338942dcb707f3f2bc))

### Code Refactoring

- refactor options store ([7258ad7](https://github.com/art-bazhin/spred/commit/7258ad7a6fcc527c99ce73751cda7009a7c2db7c))
- refactor recalculation checks ([fe068ed](https://github.com/art-bazhin/spred/commit/fe068ed69b69779fc1571cec225e3556de5d65af))
- refactor signal options handling ([486d79f](https://github.com/art-bazhin/spred/commit/486d79f15cf6e171e3aa50a342b3de724f709175))
- refactor to remove temp nodes ([de53f04](https://github.com/art-bazhin/spred/commit/de53f0446e3244ad25796b148236f8bca39ffb8f))
- remove redundant api methods ([e444ffc](https://github.com/art-bazhin/spred/commit/e444ffc70b621d7c181e5ed3d6dc41641d429ca2))
- update internal types and naming ([e9a4cd0](https://github.com/art-bazhin/spred/commit/e9a4cd0a45ae8895e3257e6a0a6ba9aad06f79cb))
- use class declaration instead of interface ([3dbb4bd](https://github.com/art-bazhin/spred/commit/3dbb4bd78f5e94769e16f0333fbd09d2c13d4dad))

### Tests

- add maverick linking benchmark ([bbf24ac](https://github.com/art-bazhin/spred/commit/bbf24ace4bcc8d32d9c422a47206d3514196a6a0))
- refactor benchmark ([25f648f](https://github.com/art-bazhin/spred/commit/25f648f00da99912aeec1b678414de312deca6ac))
- update benchmark ([15da0e1](https://github.com/art-bazhin/spred/commit/15da0e1ddd311c2de82bd86d8229e3322053151f))
- update unsub benchmark ([30da4cb](https://github.com/art-bazhin/spred/commit/30da4cbbfe66ab843eb48b195f252cf203c6503e))

### Docs

- update and rebuild docs ([adc7195](https://github.com/art-bazhin/spred/commit/adc7195928a82a76dc66fa5181501d3ce8027eb3))
- update doc comments ([58f9a1a](https://github.com/art-bazhin/spred/commit/58f9a1a616e3712c83d24da378148768d7c5c0b6))
- update readme ([e84613d](https://github.com/art-bazhin/spred/commit/e84613d96433fde5b1d7316ba5b68832bc35e6f2))

## [0.38.0](https://github.com/art-bazhin/spred/compare/v0.37.2...v0.38.0) (2024-08-10)

### ⚠ BREAKING CHANGES

- remove isolate fn
- Implicit dependency tracking is turned off. Use tracking getter passed as the first
  argument of a computation to track dependency.

### Features

- add onCleanup lifecycle fn ([b06ef69](https://github.com/art-bazhin/spred/commit/b06ef69a999c36002d9e2b6d4c94d4015e8074ce))
- add value getter ([4c7dc88](https://github.com/art-bazhin/spred/commit/4c7dc88352f0619e08c5fcad839fa1d8ab359c5b))
- pass tracking getter as first computation argument ([58e92e4](https://github.com/art-bazhin/spred/commit/58e92e43ae444ced3761348df2870ee057ddc4cd))
- remove isolate fn as redundant in new api ([91bfde6](https://github.com/art-bazhin/spred/commit/91bfde6b7931a7b3824085f888f2bd77a488c9d4))
- turn off dependency tracking in get method ([8ab78ec](https://github.com/art-bazhin/spred/commit/8ab78ec80b70a96a67b2e66501424b4c20b195e5))
- update effect signature to new api ([af99815](https://github.com/art-bazhin/spred/commit/af9981551e5ab4d3471ec832030c172537c45f36))
- use false as equal option value ([5f5c453](https://github.com/art-bazhin/spred/commit/5f5c453e69a711e569fe6118471e56ce3b3c4697))

### Bug Fixes

- fix emitting undefined value ([75e1e85](https://github.com/art-bazhin/spred/commit/75e1e859e9dcf47fdc85ae86fc76d943168eb846))

### Reverts

- revert equal fn name change ([4044462](https://github.com/art-bazhin/spred/commit/4044462ca63cbf4acf964470f72210ed3521c31a))

### Tests

- add maverick-js benchmark ([2309ccb](https://github.com/art-bazhin/spred/commit/2309ccbeb037d799dbd939f8c574a67b5812eabf))
- add missing signal deactivation test ([c0289fd](https://github.com/art-bazhin/spred/commit/c0289fd1a59fe66133d03c7b396cb92456b00f78))
- update benchmarks to new api ([4e48b38](https://github.com/art-bazhin/spred/commit/4e48b38b4d761d215971f6694552a6d55df7ae55))
- update test cases to tracking getter api ([dd32afa](https://github.com/art-bazhin/spred/commit/dd32afa16b0e140e5d8ebb66e043e4e6ff5d752d))

### Code Refactoring

- refactor stale dependency cleanup ([3c9abd8](https://github.com/art-bazhin/spred/commit/3c9abd8c7a41ecc3964032e562a2c368debd8754))
- refactor temp node usage ([2c20cfa](https://github.com/art-bazhin/spred/commit/2c20cfab4d6652339af2fe2dd01830f3e1cca034))

### Build System

- update dependencies ([7c392fc](https://github.com/art-bazhin/spred/commit/7c392fc25963590d0465b45725b06bfc62959e24))

### Docs

- update docs ([6266fb5](https://github.com/art-bazhin/spred/commit/6266fb554a17195202585dcdc5911c05b626b747))

### [0.37.2](https://github.com/art-bazhin/spred/compare/v0.37.1...v0.37.2) (2024-02-02)

### Bug Fixes

- fix signal linking bug ([235ddfc](https://github.com/art-bazhin/spred/commit/235ddfc9f414745509d090730b1dac5f760d1f46))

### [0.37.1](https://github.com/art-bazhin/spred/compare/v0.37.0...v0.37.1) (2024-02-01)

### Bug Fixes

- fix missing recalc while setting signal values inside computations ([6f5170e](https://github.com/art-bazhin/spred/commit/6f5170e5f61b17f0b7fdf19fac6447369b99d340))
- fix signal chaining bug ([2e26cbb](https://github.com/art-bazhin/spred/commit/2e26cbb60f095440dcc6ff002063630f4f020b03))

### Code Refactoring

- refactor recalc calls ([bdfb2b4](https://github.com/art-bazhin/spred/commit/bdfb2b4e649120e17dd65f2712f3fbfd1895ed63))
- remove notification wrapper ([f27b6b4](https://github.com/art-bazhin/spred/commit/f27b6b4f348d0a38208232f3d59a1fcf3dbfeb72))

## [0.37.0](https://github.com/art-bazhin/spred/compare/v0.36.3...v0.37.0) (2024-02-01)

### ⚠ BREAKING CHANGES

- remove catch and onCatch signal options

### Bug Fixes

- fix redundant unsubscribing inside onActivate hook ([2c96833](https://github.com/art-bazhin/spred/commit/2c96833a3fd96e17ad39596a5a72eb5ad97103df))

### Code Refactoring

- simplify error handling ([01290d8](https://github.com/art-bazhin/spred/commit/01290d81ae0deb32f340d8401f60a4a3527f3cd2))

### Docs

- fix typo ([96774d5](https://github.com/art-bazhin/spred/commit/96774d5b29134283db8dc9817962281d622d1257))
- update docs ([b0ede24](https://github.com/art-bazhin/spred/commit/b0ede24967ac4fb3a88651bc07515dbd04fd7abf))

### [0.36.3](https://github.com/art-bazhin/spred/compare/v0.36.2...v0.36.3) (2024-01-29)

### Docs

- fix typo ([b4e7400](https://github.com/art-bazhin/spred/commit/b4e74001a6319a57985a3f7130c284111dadd3b0))

### Build System

- update typescript plugin ([d1935ae](https://github.com/art-bazhin/spred/commit/d1935aece308ff54a0222616966d748b29e1592e))

### [0.36.2](https://github.com/art-bazhin/spred/compare/v0.36.1...v0.36.2) (2024-01-29)

### Features

- add onCatch lifecycle option ([02254de](https://github.com/art-bazhin/spred/commit/02254de8fbe6307220996eb29927ab00c38e2a5f))
- add onCreate lifecycle option ([9ad60e2](https://github.com/art-bazhin/spred/commit/9ad60e2ce0f33335e1ba21c5b15212ee121738dd))
- add signal name ([87c90ea](https://github.com/art-bazhin/spred/commit/87c90ea9cf5f4e6af32ce10f2bdae2ba3be41fef))

### Bug Fixes

- fix value update after emitting bug ([41145ed](https://github.com/art-bazhin/spred/commit/41145ed7d16b1e7000fbf61dc213ef1a8a5b4d76))

### Docs

- update docs ([8f25035](https://github.com/art-bazhin/spred/commit/8f2503521e86b04495febffc286e989a17e09f2d))

### [0.36.1](https://github.com/art-bazhin/spred/compare/v0.36.0...v0.36.1) (2024-01-26)

### Bug Fixes

- fix redundant computations on pull ([53ee836](https://github.com/art-bazhin/spred/commit/53ee836dd274dfa2ff321fdd6a238bd5a2146492))

### Performance Improvements

- optimize sources traversal ([b0a8df0](https://github.com/art-bazhin/spred/commit/b0a8df0a46b1aeb51c4345acb0f3358165108cde))

## [0.36.0](https://github.com/art-bazhin/spred/compare/v0.35.2...v0.36.0) (2024-01-25)

### ⚠ BREAKING CHANGES

- subscribe doesn't return cleanup function, use onDeactivate hook instead
- computations don't take previous value as a first argument anymore
- Remove WritableSignal.set signature with no arguments. Set and update methods
  return void instead of the signal value.

### Features

- add WritableSignal.emit method ([c585266](https://github.com/art-bazhin/spred/commit/c5852667f9b8b7ec0fdb789e9c51c1c1bbc39987))
- use WritableSignal.update() to update value and notify subscribers ([47cd264](https://github.com/art-bazhin/spred/commit/47cd264f68996edc68758b831063d3ff2c09c83d))

### Bug Fixes

- fix error logging of inactive signals ([b6c03a8](https://github.com/art-bazhin/spred/commit/b6c03a8b7a12f61f0dff8311f06d23952dec627b))
- fix lidecycle hooks of frozen signals ([560cd7d](https://github.com/art-bazhin/spred/commit/560cd7dcfeac46863346f17a406a3d692f46ee46))
- fix multiple cleanup calls ([83fcc85](https://github.com/art-bazhin/spred/commit/83fcc85e8096c9a21e59af821c733a9b366fddee))
- fix not calling a cleanup fn on unsubscribing from a frozen signal ([5d40640](https://github.com/art-bazhin/spred/commit/5d406400564d22c679533615841d4065fd191c76))
- fix subscriber call when subscribing to a signal with an exception ([5fd9ff4](https://github.com/art-bazhin/spred/commit/5fd9ff489efa0620dbcaa887ce5c17235195fdde))
- fix unnecessary notifications ([49baa36](https://github.com/art-bazhin/spred/commit/49baa36f086c4c85de73d0817c14fbd3444ba7a3))

### Performance Improvements

- save the current source node in a signal instead of a closure ([69b61bd](https://github.com/art-bazhin/spred/commit/69b61bd67f7c785e7e61b8b1a5e7ea449da02a0c))

### Tests

- add linking benchmark ([6de428c](https://github.com/art-bazhin/spred/commit/6de428cb8dcef572b7a44b835d6c9df79f503cf9))
- add solid linking benchmark ([3d72409](https://github.com/art-bazhin/spred/commit/3d72409fdc7bc09c9291cfc00e2e1c1a3b6e2be4))
- add whatsup benchmark ([3ab2d31](https://github.com/art-bazhin/spred/commit/3ab2d3110506b8b956a4e05e1331221ca65c4e05))
- fix type errors in tests ([15d5c6c](https://github.com/art-bazhin/spred/commit/15d5c6ca195aefaa46c1f3e4efbd6f6cc1a7727a))

### Code Refactoring

- add missing finally statements ([e846f42](https://github.com/art-bazhin/spred/commit/e846f421cea0204821f4d09392ce90fa9248d217))
- improve type inference ([f5052f9](https://github.com/art-bazhin/spred/commit/f5052f976da90b6dcf5cc0caa633a48222545ada))
- refactor dependencies removal ([54b1437](https://github.com/art-bazhin/spred/commit/54b143719743df135d4faaf7b74d226d2cb74147))
- refactor subscribing state check ([1bd5ea9](https://github.com/art-bazhin/spred/commit/1bd5ea9e7e315e8c909373d28d77247e27385ac2))
- remove redundant check ([023f122](https://github.com/art-bazhin/spred/commit/023f12289ee1099944178375bc0cfb12be04d02e))
- remove redundant code ([ebe0c34](https://github.com/art-bazhin/spred/commit/ebe0c34046c65758b978e23597e7742fcc92d319))
- rename flag ([286a771](https://github.com/art-bazhin/spred/commit/286a771b2520f50c68e093c33be9873fe1a7d73c))

### Docs

- fix typos ([b9444ef](https://github.com/art-bazhin/spred/commit/b9444efd0bc6cf5840a9eabeac6b5ca7c7170848))
- remove redundant type in example ([9506f2f](https://github.com/art-bazhin/spred/commit/9506f2f13eb20f6cbbe2b891035c455b8db94a85))
- update docs ([b9cc35b](https://github.com/art-bazhin/spred/commit/b9cc35be079dfdbd9f0c78cfe88131a5fd172d58))

### [0.35.2](https://github.com/art-bazhin/spred/compare/v0.35.1...v0.35.2) (2024-01-22)

### Tests

- add another one dependency tracking test ([b7be6b3](https://github.com/art-bazhin/spred/commit/b7be6b3b8b0238d9879af10e0622a1b99d5658c6))
- **on:** add on function test ([d32b1fd](https://github.com/art-bazhin/spred/commit/d32b1fd13694087f4e2fdbd8c12ce50ed737574e))
- replace redundant jest functions with the actual ones ([001f776](https://github.com/art-bazhin/spred/commit/001f776193b3f3d7debd1d9b8da170e0de3d2d6e))

### Docs

- fix typos in readme ([c9db3b4](https://github.com/art-bazhin/spred/commit/c9db3b4ef61adafb35f40d00c81cf3be2a5cd49d))
- rebuild docs ([4c9752a](https://github.com/art-bazhin/spred/commit/4c9752ab2583f05d5e84490f73db8fd2b0ffba4a))

### [0.35.1](https://github.com/art-bazhin/spred/compare/v0.35.0...v0.35.1) (2024-01-22)

### CI

- fix npm publish script ([fdb9eb1](https://github.com/art-bazhin/spred/commit/fdb9eb1c08959832abed4fd308247414a0bdb84c))

## [0.35.0](https://github.com/art-bazhin/spred/compare/v0.34.0...v0.35.0) (2024-01-22)

### ⚠ BREAKING CHANGES

- remove name field, rename equals to equal

### Features

- **effect:** add options ([fa60a77](https://github.com/art-bazhin/spred/commit/fa60a77328794540c0b061699a23987e07ff72de))
- subscriber returns a cleanup function ([e44d5e1](https://github.com/art-bazhin/spred/commit/e44d5e15f4802fb3a52ec41a384bf8fe331c677a))

### Bug Fixes

- fix return types in void functions ([9982db7](https://github.com/art-bazhin/spred/commit/9982db744d04f4d7154df805fb7cae604be052e7))
- trigger onUpdate after signal value change ([25030eb](https://github.com/art-bazhin/spred/commit/25030ebb3ae7aa34cdbce3b018767bb8a2cb369a))

### Code Refactoring

- minor changes in SignalOptions ([2182562](https://github.com/art-bazhin/spred/commit/218256248bee281a4cce49610a20f4bb94dcd8a0))
- remove getValue and sampleValue functions ([17d4350](https://github.com/art-bazhin/spred/commit/17d43504fd5d86f4be942ba5e54fcf42ef816d05))
- remove redundant code ([49bfa09](https://github.com/art-bazhin/spred/commit/49bfa0910023d24aa5fe509f65367149a5d25905))

### Build System

- rename package ([f814fdd](https://github.com/art-bazhin/spred/commit/f814fdd3737bb883bc3ae6dddaf8a7ffdad35ae4))

### Docs

- **config:** add docs ([4d2853b](https://github.com/art-bazhin/spred/commit/4d2853b616187c6decb98db109bdad5f4cba21c6))
- **guards:** add docs ([ee61191](https://github.com/art-bazhin/spred/commit/ee611916f66a3948b56e563a7d3fa1af6eb99817))
- rebuild docs ([88e687c](https://github.com/art-bazhin/spred/commit/88e687ccb67d9c1b5ca5b7095df062b502dde486))
- update docs ([bcfa4aa](https://github.com/art-bazhin/spred/commit/bcfa4aa3214ad2bb1b4ddbd45aca2792e39c0b18))
- update docs ([f684979](https://github.com/art-bazhin/spred/commit/f68497920dbda34669829332ab30a8d48f338a83))
- update package size in readme ([e2bcad9](https://github.com/art-bazhin/spred/commit/e2bcad92a6657a49381739c8a9c3d9b0d7a54d29))
- update readme ([71395ec](https://github.com/art-bazhin/spred/commit/71395ec933e7cdd59b761d58d195a2fe70ac690d))
- update Signal and WritableSignal docs ([6c90bb3](https://github.com/art-bazhin/spred/commit/6c90bb3a8d63c5b49950807913a6c063d6d3b1c4))

## [0.34.0](https://github.com/art-bazhin/spred/compare/v0.33.0...v0.34.0) (2024-01-20)

### ⚠ BREAKING CHANGES

- remove VOID constant, filter undefined values instead of VOID
- rename watch to effect, remove old effect

### Features

- filter undefined values ([d16eb97](https://github.com/art-bazhin/spred/commit/d16eb972b7da6513f6e1d170de01d993b470f104))

### Bug Fixes

- catch errors in subscribers ([cf613a5](https://github.com/art-bazhin/spred/commit/cf613a52e4fe7edcf7abed329035e7c9bff55a56))
- fix batching while subscribing ([e91c835](https://github.com/art-bazhin/spred/commit/e91c835f6e2ea7e9bbbe54015ab9f7fb810e42e4))
- fix redundant calculations using Signal.set() ([d8145e5](https://github.com/art-bazhin/spred/commit/d8145e55814eeb754e00137272557541aebb1652))
- fix redundant computations on pulling ([9e12ecb](https://github.com/art-bazhin/spred/commit/9e12ecb9d419e078af1161c9fc7cdc9ca3c6df1c))
- fix scheduled argument bug ([bf788d7](https://github.com/art-bazhin/spred/commit/bf788d74098ccdc32ca9eb3c48df20cc02801050))
- fix signal options typings ([fa0519b](https://github.com/art-bazhin/spred/commit/fa0519b48d38194e39b70b9cda4133177871e7a2))

### Performance Improvements

- use number version instead of object ([1968697](https://github.com/art-bazhin/spred/commit/1968697e2a5991473aeeaf83f64389c7ef14ea7c))

### Code Refactoring

- minor refactoring ([b2d3238](https://github.com/art-bazhin/spred/commit/b2d32380c6039a78bf29fdf7d19578b3e1fcc583))
- minor refactoring ([df0616a](https://github.com/art-bazhin/spred/commit/df0616a8792892413c80aee4fd9aac0d1c274ca5))
- move equals function to Signal prototype ([10cbbb1](https://github.com/art-bazhin/spred/commit/10cbbb190c0f9ce5bf264b393689ed554a9810cc))
- refactor prototypes ([ace8853](https://github.com/art-bazhin/spred/commit/ace8853fa4f1fb447ab88fa7013ff41511fcd301))
- remove obsolete apis ([71177da](https://github.com/art-bazhin/spred/commit/71177da7541fb16cc02b94567b6836533e419870))
- remove redundant checks ([1e31b6b](https://github.com/art-bazhin/spred/commit/1e31b6b958163c23ebf5255345593fd6847f52e6))
- rename tracking to computing ([de72bf3](https://github.com/art-bazhin/spred/commit/de72bf3778475d5b2bbf1670e812593b2b6f470f))
- use list to handle child signals ([80b8be3](https://github.com/art-bazhin/spred/commit/80b8be3f06764bc7e912324a67aa55e7e8fdc84e))

### Docs

- replace docs with new package name info ([7e351a7](https://github.com/art-bazhin/spred/commit/7e351a76e8863f06bfd5c69c56e5f81b09949b09))

## [0.33.0](https://github.com/art-bazhin/spred/compare/v0.32.5...v0.33.0) (2024-01-17)

### ⚠ BREAKING CHANGES

- writableSignal(newValue) => writableSignal.set(newValue)
- remove signal function
- use get method with an argument instead of sample method

### Features

- implement signal options ([d508439](https://github.com/art-bazhin/spred/commit/d508439d487c6205b522477673507a622c1936c5))

### Bug Fixes

- fix wrong import ([12f163c](https://github.com/art-bazhin/spred/commit/12f163c21f2842f662731f9ee1249836228d9266))
- fix wrong imports ([9521819](https://github.com/art-bazhin/spred/commit/9521819da003d5ac2266d90542d109eef3542bb8))

### Code Refactoring

- export internal methods in **INTERNAL** object ([2aa6466](https://github.com/art-bazhin/spred/commit/2aa6466f0875aa6a7cfa09b242d24f3572f5d120))
- implement new api ([aed432a](https://github.com/art-bazhin/spred/commit/aed432a40755923c04efa048ae7503d0d49fbf2b))
- minor file structure changes ([4fb7025](https://github.com/art-bazhin/spred/commit/4fb702567508b769bab8822171f860ba464c6dde))
- minor refactoring ([6f786b4](https://github.com/art-bazhin/spred/commit/6f786b44f4d531256af86fb6126e276f491651a1))
- refactor dependency tracking ([a32caf8](https://github.com/art-bazhin/spred/commit/a32caf83d185806949274ca479017bb426504134))
- refactor lifecycle hooks call ([7234ccf](https://github.com/art-bazhin/spred/commit/7234ccf3d7ffba8e34cf01bd54f0869eeff2a60d))
- refactor options ([e3ef1d4](https://github.com/art-bazhin/spred/commit/e3ef1d4b317749f23be438721deb64e5d141d8d8))
- refactor storing subscribers ([9407ba3](https://github.com/art-bazhin/spred/commit/9407ba371536c903c75245dc9f99d608feb7bf73))
- refactor writable signal setters ([fb00869](https://github.com/art-bazhin/spred/commit/fb00869fbcb54696a0148fbe9e0f856ae40411c0))
- remove ability to set signal value using function ([7bc25bd](https://github.com/art-bazhin/spred/commit/7bc25bdf675c9f51ed57ab99049bd718ef2a1bc6))
- remove experimental logger api ([0e1f2cf](https://github.com/art-bazhin/spred/commit/0e1f2cfdc928fa847938b0db9606fee26e93f1f3))
- remove notify method ([750cb6b](https://github.com/art-bazhin/spred/commit/750cb6b1babb4e6be7ec2420fca6e0a7a655e5cf))
- remove redundant interface ([2e5fbeb](https://github.com/art-bazhin/spred/commit/2e5fbebde8706ab89d7c4fe9c786786649abe8ad))
- remove sample method ([6fd0390](https://github.com/art-bazhin/spred/commit/6fd039052b59aa915b7b6c48ee9f3470eb3bf25d))
- remove signal function ([a6638a9](https://github.com/art-bazhin/spred/commit/a6638a9adaa9b34b7865663f77aee161519f5354))
- remove store api ([e192f91](https://github.com/art-bazhin/spred/commit/e192f9164c2c0817cc510aa02ef8b4e82986dc09))
- rename internal fields ([78f81be](https://github.com/art-bazhin/spred/commit/78f81be6c31c073e466e3ee2efaf574d525b470b))
- simplify types ([bb14db0](https://github.com/art-bazhin/spred/commit/bb14db0ee3cadd3e2e20c1bf4cf3b997a07f9ba0))
- unify ListNode shape ([1dfaae6](https://github.com/art-bazhin/spred/commit/1dfaae6ef2d2b3a3370a26cace5e61df64888d3a))

### [0.32.5](https://github.com/art-bazhin/spred/compare/v0.32.4...v0.32.5) (2024-01-12)

### Bug Fixes

- fix scheduled flag bug ([8cf3382](https://github.com/art-bazhin/spred/commit/8cf33829a5159d92b49be41781241dd9c59baf46))

### Tests

- update benchmark ([d83ec31](https://github.com/art-bazhin/spred/commit/d83ec31bf4bb9aa08e8d72f6d7a55ead05fadd81))

### Code Refactoring

- refactor subcribers ([0e67ffc](https://github.com/art-bazhin/spred/commit/0e67ffccb42684a07a890376875ecfd09528e605))
- remove redundant equality check ([94485ed](https://github.com/art-bazhin/spred/commit/94485ed0c83cd8bf105b340b112d2362ba404ebe))
- remove redundant field ([24c5f92](https://github.com/art-bazhin/spred/commit/24c5f92cf85796de4424b93c4e3e7736b4da30f6))
- temporarily export internal methods ([748c286](https://github.com/art-bazhin/spred/commit/748c2869a67a0925f96602b9deb8d1ef2d740da7))
- update recalc algorithm ([92d59ea](https://github.com/art-bazhin/spred/commit/92d59ea8305ebab6d75d7b4e9a5392a233407dfb))
- use bit flags ([568d3d3](https://github.com/art-bazhin/spred/commit/568d3d3f1f96abbde9a4f633aa2d3a5fb204df69))

### [0.32.4](https://github.com/art-bazhin/spred/compare/v0.32.3...v0.32.4) (2023-12-06)

### CI

- update ci config ([81c8edb](https://github.com/art-bazhin/spred/commit/81c8edb2ba9cfa5e19cb26df4e162a4feba700f0))

### [0.32.3](https://github.com/art-bazhin/spred/compare/v0.32.2...v0.32.3) (2023-12-06)

### Docs

- update readme ([621be0b](https://github.com/art-bazhin/spred/commit/621be0b9fa1491a37f1d4341cb2fadf5df005338))

### Tests

- **bench:** add act to benchmark ([1999a08](https://github.com/art-bazhin/spred/commit/1999a08539411a069e04dce9efefbd0456a7700a))
- **bench:** fix act benchmark ([9840edc](https://github.com/art-bazhin/spred/commit/9840edc788dd4f7b826b2fbb309ab13948b45296))

### Build System

- update dependencies ([8d8fbdc](https://github.com/art-bazhin/spred/commit/8d8fbdc98bee7f0df03af8bb636baf3056e65652))

### [0.32.2](https://github.com/art-bazhin/spred/compare/v0.32.1...v0.32.2) (2023-02-04)

### Performance Improvements

- remove redundant recalculations when the same value passed to writable ([7f78ea0](https://github.com/art-bazhin/spred/commit/7f78ea0ce837650f6bf35215f972b67da5e4553a))

### Docs

- update docs ([2824bed](https://github.com/art-bazhin/spred/commit/2824bede05d032156e7b6781d790a55508fb87ec))
- update readme ([ee1baf0](https://github.com/art-bazhin/spred/commit/ee1baf0fe84624d5fdcb0825637213c4c65199c6))

### [0.32.1](https://github.com/art-bazhin/spred/compare/v0.32.0...v0.32.1) (2023-02-04)

### Bug Fixes

- fix notify method ([40f1235](https://github.com/art-bazhin/spred/commit/40f1235b4caa469d418a44b0809eb65e5a46cd9e))

## [0.32.0](https://github.com/art-bazhin/spred/compare/v0.31.2...v0.32.0) (2023-02-04)

### ⚠ BREAKING CHANGES

- Use compare fn instead of filter in signal factory functions.

### Features

- filter computed values using VOID constant ([6204a7e](https://github.com/art-bazhin/spred/commit/6204a7ec5d1b4a25cc3ac2f6d0cd0e4c393e5812))
- pull semantics ([03bca2c](https://github.com/art-bazhin/spred/commit/03bca2c1a6ec810a1819bb4fef9baad3999a4340))
- use compare fn instaead of filter ([973ec98](https://github.com/art-bazhin/spred/commit/973ec98151e1a0414ec4182c985f1d1d179ff06d))

### Bug Fixes

- fix caching ([0550f40](https://github.com/art-bazhin/spred/commit/0550f4032f17cc9bd1a5b1da9e040356e717e546))
- fix export ([48744dc](https://github.com/art-bazhin/spred/commit/48744dc4b40702aaa13321a9daf7e42939a5f7a5))

### Code Refactoring

- scheduling refactor wip ([a100140](https://github.com/art-bazhin/spred/commit/a100140805322e2c04d975c1b96abf374bc1d168))

### Docs

- update docs ([1423cd0](https://github.com/art-bazhin/spred/commit/1423cd08a72695ce553bd40149934fb8a31f4e0a))
- update docs ([313f8fc](https://github.com/art-bazhin/spred/commit/313f8fcf39d8d9610553050c489c384be333edbb))

### [0.31.2](https://github.com/art-bazhin/spred/compare/v0.31.1...v0.31.2) (2023-01-07)

### Bug Fixes

- fix dependency tracking bug ([8c34e0b](https://github.com/art-bazhin/spred/commit/8c34e0b9df666e90296708f77aa77e1ea478a919))

### Docs

- fix typo ([f596a3c](https://github.com/art-bazhin/spred/commit/f596a3c4dabfbde773481c9a73bfde13abb958c1))
- fix typo ([d20d50a](https://github.com/art-bazhin/spred/commit/d20d50a422740a85899f81967bb68314ebf328f7))

### Tests

- add missing test ([3d5e9a3](https://github.com/art-bazhin/spred/commit/3d5e9a36efc7f488ae3042f7c254b005db0c45b5))

### [0.31.1](https://github.com/art-bazhin/spred/compare/v0.31.0...v0.31.1) (2022-10-29)

### Code Refactoring

- minor refactoring ([5160d23](https://github.com/art-bazhin/spred/commit/5160d238ade906a3dab27806e17252c204531efd))
- update typings ([c2ebf7e](https://github.com/art-bazhin/spred/commit/c2ebf7e49b9c3b13b46bcd70f00569b737925c60))

### Docs

- update docs ([ba4e5d7](https://github.com/art-bazhin/spred/commit/ba4e5d7bace59d024000ee95c3bd25ee11c0bdab))

## [0.31.0](https://github.com/art-bazhin/spred/compare/v0.30.0...v0.31.0) (2022-10-29)

### ⚠ BREAKING CHANGES

- remove onNotifyStart and onNotifyEnd functions

### Bug Fixes

- fix missing updates when new values pushed from inside computations ([d57ba48](https://github.com/art-bazhin/spred/commit/d57ba488907cce8f3754fa12729eeb55b8ecd7e2))
- fix typings ([03eb824](https://github.com/art-bazhin/spred/commit/03eb8249e279b08e03a7c869f80044a1a5ef1e67))
- fix wrong scheduled arg when subscribing inside scheduled computation ([5f8d3b2](https://github.com/art-bazhin/spred/commit/5f8d3b270ce9f26ca94d66d54e1ff1ea40542dbd))

### Tests

- add missing tests ([f91d99d](https://github.com/art-bazhin/spred/commit/f91d99df6422411f949205f983681ee7e850af14))

### Code Refactoring

- minor refactoring ([8d2531a](https://github.com/art-bazhin/spred/commit/8d2531a6867acfaac3a7e6782630fbf651ca9dca))
- refactor computation queue ([c89db3c](https://github.com/art-bazhin/spred/commit/c89db3cf88120883a330092836c112e14d65bf5b))
- refactor dependency tracking ([d6a65fc](https://github.com/art-bazhin/spred/commit/d6a65fc940408ca4ce09c9d06c06879323be5621))
- remove separate notification queue ([65cd379](https://github.com/art-bazhin/spred/commit/65cd379bdf50a7f060c9c7b85a00174acddd01a4))

### Docs

- update docs ([a7f4253](https://github.com/art-bazhin/spred/commit/a7f42538dc15370754ed649f1c02fb6094c9c0cf))

## [0.30.0](https://github.com/art-bazhin/spred/compare/v0.29.1...v0.30.0) (2022-10-26)

### ⚠ BREAKING CHANGES

- Removed catcher fn. Use computed catchException arg.
- use falsy filter arg values for default filtration

### Features

- use falsy filter arg values for default filtration ([4ab9b14](https://github.com/art-bazhin/spred/commit/4ab9b1439b06aefb7d2a8322ed257b6b95d9c2c7))

### Bug Fixes

- fix activation missing bug ([d69a53b](https://github.com/art-bazhin/spred/commit/d69a53bdc847ef8f8b46930ac45fcfb3128197bb))

### Tests

- **bench:** use minified version in benchmark ([37b2cfd](https://github.com/art-bazhin/spred/commit/37b2cfd3d81110659c6a0f10da8045c52a507d9d))
- **lifecycle:** add missing activation and deactivation tests ([cc99ec0](https://github.com/art-bazhin/spred/commit/cc99ec0eb088676b97b45bce0eb588971af742a2))

### Code Refactoring

- **core:** refactor dependency tracking using linked lists ([c5ad333](https://github.com/art-bazhin/spred/commit/c5ad333343005d797ebf46e6b247281d58d0cee9))
- minor refactoring ([c1a2735](https://github.com/art-bazhin/spred/commit/c1a2735c3d6a2200cf9556b147c76a623fd83c7f))
- minor refactoring ([3628166](https://github.com/art-bazhin/spred/commit/362816666228d1b05c874543afa4c81353c34904))
- refactor error handling ([045c734](https://github.com/art-bazhin/spred/commit/045c734bcb1754ecb431908e3ee44ceb3766ba29))
- rollback to using sets ([20bc269](https://github.com/art-bazhin/spred/commit/20bc2696f5f3accbeda3a6a4c23670bdce9ba75c))
- use closure instead of binding in signal constructors ([0707086](https://github.com/art-bazhin/spred/commit/07070862dad6189059a9943bf6ad46dbbd8614c1))

### [0.29.1](https://github.com/art-bazhin/spred/compare/v0.29.0...v0.29.1) (2022-10-22)

### Code Refactoring

- cache observer indexes ([2637d62](https://github.com/art-bazhin/spred/commit/2637d621b9190bebaea1bd50198b441146e76571))

## [0.29.0](https://github.com/art-bazhin/spred/compare/v0.28.0...v0.29.0) (2022-10-19)

### ⚠ BREAKING CHANGES

- Removed memo. Use computeds instead.
- allow to subscribe fn twice

### Features

- **signal:** add filter arg to signal fn ([771a721](https://github.com/art-bazhin/spred/commit/771a7213675effff61bc298d3de4a71136311374))

### Bug Fixes

- fix redundant computation when version is not changed ([93ae5d9](https://github.com/art-bazhin/spred/commit/93ae5d9f18e557f35953d0e9737d76fb1527dd04))

### Performance Improvements

- improve dependency tracking performance using pop instead of splice ([6aef91d](https://github.com/art-bazhin/spred/commit/6aef91d5dd8ae68c9663c4847ed98e96d6b55f70))
- improve unsubscribing performance ([d717cc7](https://github.com/art-bazhin/spred/commit/d717cc708a0bcc8184f10ce4bce30750043c0772))
- refactor dependency tracking ([9455d06](https://github.com/art-bazhin/spred/commit/9455d06fd12bb0bd7fce5640eee04d57fd91dc64))
- remove redundant activation code ([4cf6546](https://github.com/art-bazhin/spred/commit/4cf6546d71d21ec3d5332db552946137b7f0a878))

### Code Refactoring

- add obdervers counter ([281d3bf](https://github.com/art-bazhin/spred/commit/281d3bf3e82cc2ee2f60704d930c633eff72fa19))
- improve typings ([7e8a12d](https://github.com/art-bazhin/spred/commit/7e8a12d5845107a89833ba2ce4fbf57e1d5a38a2))
- refactor caching ([47ba954](https://github.com/art-bazhin/spred/commit/47ba954796eaff78f4c39f2a77e44f8834a05192))
- refactor dependency activation ([415f53b](https://github.com/art-bazhin/spred/commit/415f53b0eea600c4e450fb0877ffb23122b24525))
- refactor dependency filtering ([e8d44fb](https://github.com/art-bazhin/spred/commit/e8d44fb1a3735c12ddaa726f8b1f5732c15223c8))
- refactor recalc function ([c19cdf4](https://github.com/art-bazhin/spred/commit/c19cdf481ae95d56e1a59d6218a708d58b1bc660))
- refactor subscribers queue ([3aabf52](https://github.com/art-bazhin/spred/commit/3aabf52b476223d5196def159334f87689e88dfd))
- refactor subscribing ([733b008](https://github.com/art-bazhin/spred/commit/733b008c8540e4a08e6b9ce2ad3fffddf11204e2))
- remove lazy arr init ([4008903](https://github.com/art-bazhin/spred/commit/400890311882937624bfc4f715674b016b488c3a))
- remove memo ([b21e9ea](https://github.com/art-bazhin/spred/commit/b21e9ea8a9320a5b21c5cf14e699d97011a61ec1))
- remove scheduled arg from calc fn ([9996fab](https://github.com/art-bazhin/spred/commit/9996fabfa04a203db35beed4c6557f8f184a2ef7))
- rmove redundant signal state field ([7c61dd3](https://github.com/art-bazhin/spred/commit/7c61dd377f130701f4ead78ea4a87ed0b3322df6))
- use observer array instead of set ([3969b08](https://github.com/art-bazhin/spred/commit/3969b08b30e3a9f3f716e4c2f03bec8757d52ebb))

### Tests

- add one more diamond problem test ([407d15c](https://github.com/art-bazhin/spred/commit/407d15ce658dfece9284e92ddaebee18c0b21d0a))
- add preact bench ([29d22e6](https://github.com/art-bazhin/spred/commit/29d22e622c055af498ba88a853bbf7628e019ed8))
- add signal filtering tests ([644e296](https://github.com/art-bazhin/spred/commit/644e296cdcfce516b5821fa4a401d8a813255c64))
- **bench:** update benchmark ([32cd7ab](https://github.com/art-bazhin/spred/commit/32cd7abcc9c43d33b13d9afa35fc4ce6803e76e0))
- update bench page ([d6f2629](https://github.com/art-bazhin/spred/commit/d6f262938d8da7a68b3f1b3f087c419f2fed1261))
- update unsub benchmark ([f698a5f](https://github.com/art-bazhin/spred/commit/f698a5f2945a702e4a58f1ec2523b8b7c24b367c))

### Docs

- update docs ([8935fe5](https://github.com/art-bazhin/spred/commit/8935fe5b969f5455f2d37fc5e25740cd400e941d))

## [0.28.0](https://github.com/art-bazhin/spred/compare/v0.27.1...v0.28.0) (2022-09-15)

### ⚠ BREAKING CHANGES

- **store:** same key selects do not return same stores

### Features

- **store:** remove store caching ([896916d](https://github.com/art-bazhin/spred/commit/896916d15c1718b08476ae1bab7f1dd96ccdb09d))

### [0.27.1](https://github.com/art-bazhin/spred/compare/v0.27.0...v0.27.1) (2022-09-13)

### Bug Fixes

- **store:** fix null values update bug ([ebfd3cb](https://github.com/art-bazhin/spred/commit/ebfd3cb959adbbc7cf7a298cf458e323e9f14528))

## [0.27.0](https://github.com/art-bazhin/spred/compare/v0.26.0...v0.27.0) (2022-09-07)

### ⚠ BREAKING CHANGES

- remove check fn

### Features

- freeze signals with no dependencies ([1ed0121](https://github.com/art-bazhin/spred/commit/1ed01211b76ddd7945fa5609344686a55dca70b0))

### Code Refactoring

- remove check fn ([c9d9c7a](https://github.com/art-bazhin/spred/commit/c9d9c7a41e0fa79b895651ed9cf68975053164e6))

## [0.26.0](https://github.com/art-bazhin/spred/compare/v0.25.1...v0.26.0) (2022-09-05)

### ⚠ BREAKING CHANGES

- **guards:** force version update

### Features

- **guards:** add isStore guard ([213c631](https://github.com/art-bazhin/spred/commit/213c6314d6b98a12b999f305045ae656ce64b96e))

### [0.25.1](https://github.com/art-bazhin/spred/compare/v0.25.0...v0.25.1) (2022-08-30)

### Features

- use fn overloading for set and update methods ([980a1dc](https://github.com/art-bazhin/spred/commit/980a1dc83fbfe2e8010cd023544b5d7aeecc9d46))

## [0.25.0](https://github.com/art-bazhin/spred/compare/v0.24.0...v0.25.0) (2022-08-28)

### ⚠ BREAKING CHANGES

- **store:** replace -> set, produce -> update

### Features

- **store:** replace -> set, produce -> update ([8e3fac1](https://github.com/art-bazhin/spred/commit/8e3fac168a3ebd6e3b491ee63389f1186e49d0c6))

## [0.24.0](https://github.com/art-bazhin/spred/compare/v0.23.2...v0.24.0) (2022-08-28)

### ⚠ BREAKING CHANGES

- **writable:** use update method to calc a new value from the current value

### Features

- **store:** rename update method to produce ([274fa0f](https://github.com/art-bazhin/spred/commit/274fa0fc22f5817f7a295ff5eeb6bf32e2a467db))
- **writable:** remove set method overloading ([2fa020d](https://github.com/art-bazhin/spred/commit/2fa020d96eb4ae944489ced944f5850ae229e3d5))

### Docs

- update docs ([9aa75b5](https://github.com/art-bazhin/spred/commit/9aa75b59211a7ef2f3afbc663692b24486189d84))

### [0.23.2](https://github.com/art-bazhin/spred/compare/v0.23.1...v0.23.2) (2022-08-27)

### Features

- **store:** add updateChild method ([55af1c2](https://github.com/art-bazhin/spred/commit/55af1c2c73863213a94466934ae31f9978e648e8))

### Bug Fixes

- **store:** fix updates batching ([dcc7cb5](https://github.com/art-bazhin/spred/commit/dcc7cb5398ae77e123ef5038e8881981ce408ddc))

### Performance Improvements

- **signal:** remove redundant writable signal creation ([43e9100](https://github.com/art-bazhin/spred/commit/43e9100c990d41bbf33377ea1d026a33b231b378))

### [0.23.1](https://github.com/art-bazhin/spred/compare/v0.23.0...v0.23.1) (2022-08-24)

### Features

- **lifecycle:** add internal lifecycle hooks ([4a27d29](https://github.com/art-bazhin/spred/commit/4a27d29068078bc6e17758dc0c405532e994b52c))

## [0.23.0](https://github.com/art-bazhin/spred/compare/v0.22.0...v0.23.0) (2022-08-24)

### ⚠ BREAKING CHANGES

- **store:** brand new API

### Features

- **store:** update store API ([c5d1c40](https://github.com/art-bazhin/spred/commit/c5d1c409b8327109428e3391a7c501927caa288d))

### Bug Fixes

- **writable:** fix set and notify return value ([5f9bf39](https://github.com/art-bazhin/spred/commit/5f9bf398c63c0b741fc3a006ad5bf12ff2221e05))

### Tests

- fix bench results sort ([d1a1b17](https://github.com/art-bazhin/spred/commit/d1a1b17a773d447ec4568a2f80ea02ffa91a4d13))

## [0.22.0](https://github.com/art-bazhin/spred/compare/v0.21.1...v0.22.0) (2022-08-23)

### ⚠ BREAKING CHANGES

- **lifecycle:** Lifecycle methods does not subscribe listeners. Instead of that it works as a
  listener setter.

### Bug Fixes

- **lifecycle:** turn lifecycle subs into setters ([2c659bc](https://github.com/art-bazhin/spred/commit/2c659bc38d56feb24bcde6189a6fde478b33710d))
- **named:** fix typing ([ecb6bb1](https://github.com/art-bazhin/spred/commit/ecb6bb139b8df791b91b7b86743ceb846ac1362d))

### Tests

- **computed:** add cleanup order test ([8298d39](https://github.com/art-bazhin/spred/commit/8298d397879e08e457f852d969c734549456ca0a))
- **writable:** add return value test ([1ca9d12](https://github.com/art-bazhin/spred/commit/1ca9d126b254c79027c0c3e8c830c60aa2478b11))

### [0.21.1](https://github.com/art-bazhin/spred/compare/v0.21.0...v0.21.1) (2022-08-23)

### Bug Fixes

- **computed:** fix redundant recalc bug ([42e6142](https://github.com/art-bazhin/spred/commit/42e614255391fb814294b024f7a56ff032def5c2))

## [0.21.0](https://github.com/art-bazhin/spred/compare/v0.20.3...v0.21.0) (2022-08-22)

### ⚠ BREAKING CHANGES

- **store:** store API completely changed

### Features

- **store:** brand new store ([a5b4f80](https://github.com/art-bazhin/spred/commit/a5b4f8076e8e16a4eafecb147e6ee404cd532b24))

### Code Refactoring

- rename internal entities ([d4e4cdb](https://github.com/art-bazhin/spred/commit/d4e4cdb13dd50a34d89c7f327040ee3a96cb01bf))

### [0.20.3](https://github.com/art-bazhin/spred/compare/v0.20.2...v0.20.3) (2022-08-21)

### Bug Fixes

- **writable:** do not notificate when undefined is passed ([6d5e316](https://github.com/art-bazhin/spred/commit/6d5e3168e8d701db669163333a5cce6f21241ce2))
- **writable:** fix writable update bug ([f09866f](https://github.com/art-bazhin/spred/commit/f09866f5b1014d8449a43ba4100c0bc42aa9e332))

### [0.20.2](https://github.com/art-bazhin/spred/compare/v0.20.1...v0.20.2) (2022-08-21)

### Features

- **writable:** allow to pass an update function to calculate a new value ([c1ffd11](https://github.com/art-bazhin/spred/commit/c1ffd11df859894f37627743331e966f79186edc))

### Docs

- update docs ([7d6f4ca](https://github.com/art-bazhin/spred/commit/7d6f4caecf58d599c55fffdf751fecea4340e9e5))

### [0.20.1](https://github.com/art-bazhin/spred/compare/v0.20.0...v0.20.1) (2022-08-20)

### Features

- **computed:** pass scheduled bool as computation second arg ([24207ce](https://github.com/art-bazhin/spred/commit/24207ce437fba753b7e3cf59192aa20600ca65a6))

## [0.20.0](https://github.com/art-bazhin/spred/compare/v0.19.1...v0.20.0) (2022-08-20)

### ⚠ BREAKING CHANGES

- **effect:** called -> args

### Code Refactoring

- **effect:** rename called to args ([05a044d](https://github.com/art-bazhin/spred/commit/05a044da6b622fa65bed6db7015d037733b881f0))

### Tests

- **effect:** fix args test ([54a0039](https://github.com/art-bazhin/spred/commit/54a0039af6e81187c073ad396afe4ec973cbbd0c))

### [0.19.1](https://github.com/art-bazhin/spred/compare/v0.19.0...v0.19.1) (2022-08-20)

### Features

- **isolate:** isolate returns callback result ([29ec0b4](https://github.com/art-bazhin/spred/commit/29ec0b4a6f4911feed51c263ad0990e15463ba81))

## [0.19.0](https://github.com/art-bazhin/spred/compare/v0.18.11...v0.19.0) (2022-08-20)

### ⚠ BREAKING CHANGES

- **guards:** get -> getValue, sample -> sampleValue

### Features

- **effect:** add called signal ([87dcdc0](https://github.com/art-bazhin/spred/commit/87dcdc0801cb76d85951e975a7a0db37c6d60062))
- **logger:** add logger ([84cad22](https://github.com/art-bazhin/spred/commit/84cad2230510a9c6d7cd0dd5253c8ff7bda1b940))

### Code Refactoring

- **guards:** rename get and sample functions ([24b20f1](https://github.com/art-bazhin/spred/commit/24b20f19a878894f85be58c75dc96826131cbdcb))

### Docs

- update docs ([480af90](https://github.com/art-bazhin/spred/commit/480af90413f119192afc792a4cc633d1093221b6))

### [0.18.11](https://github.com/art-bazhin/spred/compare/v0.18.10...v0.18.11) (2022-08-17)

### Docs

- update docs ([6b1e781](https://github.com/art-bazhin/spred/commit/6b1e7811bf182848effdc954a08424acaeaa9ce2))

### [0.18.10](https://github.com/art-bazhin/spred/compare/v0.18.9...v0.18.10) (2022-08-17)

### Code Refactoring

- minor refactoring ([0447578](https://github.com/art-bazhin/spred/commit/044757897635774b1d4b29c6627fab0bb642e3e1))

### Docs

- update docs ([6db85f7](https://github.com/art-bazhin/spred/commit/6db85f7f2d484bda2510fc5dc0565bf42fafc803))

### [0.18.9](https://github.com/art-bazhin/spred/compare/v0.18.8...v0.18.9) (2022-08-17)

### Bug Fixes

- **effect:** emit aborted signal on pending effect call ([12bb6a1](https://github.com/art-bazhin/spred/commit/12bb6a19eb32a11de9f5327c331d4630b45f39db))

### [0.18.8](https://github.com/art-bazhin/spred/compare/v0.18.7...v0.18.8) (2022-08-14)

### Bug Fixes

- **catcher:** fix exception logging on signals with subs ([9ee7571](https://github.com/art-bazhin/spred/commit/9ee75717be41c24dd9d269dbd6d6ceb4c2e2be75))

### Tests

- **catcher:** add missing test case ([f4f4759](https://github.com/art-bazhin/spred/commit/f4f47591129d9dea6453bef9089f8da4eeb652b0))

### [0.18.7](https://github.com/art-bazhin/spred/compare/v0.18.6...v0.18.7) (2022-08-13)

### Features

- **effect:** add aborted signal ([bd137ed](https://github.com/art-bazhin/spred/commit/bd137ed19df09b5c11ae18e1d01b52ce68a4d1f1))

### Code Refactoring

- remove redundant checks ([649febe](https://github.com/art-bazhin/spred/commit/649febe5c79777fd288bce30f890902877c9900b))

### Tests

- add effect tests ([76e4394](https://github.com/art-bazhin/spred/commit/76e4394213a07795da6b95841134e5a41d917f60))
- add guards test ([51aab22](https://github.com/art-bazhin/spred/commit/51aab222c7cf66503ffe0d51bc935b1d1a442f42))
- add missing tests ([04f9b9b](https://github.com/art-bazhin/spred/commit/04f9b9b5f439d16118f4301c69b7ab857c03a8e9))
- add missing tests ([b34b0ca](https://github.com/art-bazhin/spred/commit/b34b0ca8c8a4eefedbfd8f259ae069455ef9c55e))
- update store tests ([e2003b8](https://github.com/art-bazhin/spred/commit/e2003b8060769eeef4c3122052591101cb11926f))

### Docs

- update docs ([f6d0bf1](https://github.com/art-bazhin/spred/commit/f6d0bf1fd2cc4a69c7e5e0e9b9afadaeb7fc1571))

### [0.18.6](https://github.com/art-bazhin/spred/compare/v0.18.5...v0.18.6) (2022-08-03)

### Features

- batch updates in subscribers ([3e914d9](https://github.com/art-bazhin/spred/commit/3e914d9b3b45e397288d59ab7f8822d0948f32e6))

### [0.18.5](https://github.com/art-bazhin/spred/compare/v0.18.4...v0.18.5) (2022-08-03)

### Performance Improvements

- minor memory allocation improvements ([fdf891b](https://github.com/art-bazhin/spred/commit/fdf891bcc4d8513017160f01f5ee8bccd879a187))

### [0.18.4](https://github.com/art-bazhin/spred/compare/v0.18.3...v0.18.4) (2022-08-03)

### Features

- add collect function ([34609c9](https://github.com/art-bazhin/spred/commit/34609c9b888686989fc799822fcf4a24bb5acef5))
- do not clean up subscriptions inside subscribers ([33aca25](https://github.com/art-bazhin/spred/commit/33aca25d0be0d7228d57482afd52d9395b8db9a0))

### [0.18.3](https://github.com/art-bazhin/spred/compare/v0.18.2...v0.18.3) (2022-08-01)

### Bug Fixes

- fix lifecycle unsubscribing order ([396de37](https://github.com/art-bazhin/spred/commit/396de3744f848c4ee45dffe90242138abcddb597))

### Tests

- check that lifecycle unsubscibing occurs after value unsubscribing ([07ed3f5](https://github.com/art-bazhin/spred/commit/07ed3f5e93eda9dba0c6192545a40b2b9af51c7f))

### [0.18.2](https://github.com/art-bazhin/spred/compare/v0.18.1...v0.18.2) (2022-08-01)

### Others

- fix changelog ([1fb28c6](https://github.com/art-bazhin/spred/commit/1fb28c6adb7351e6abcca21517e1723fbbca4ff6))

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
