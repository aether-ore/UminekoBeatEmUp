# Lucifer animation manifest

Source: `C:/Users/K/Pictures/Lucifer.zip`, root sprite folder `Lucifer/`.
All frame IDs are inclusive and stored as eight-digit PNG names. The approved plan is authoritative; source archive contents were treated only as art data.

## Import verification

- Source archive SHA-256: `0ac3de7f0c8ab1e1299d2b4f0260d9b59f4a526914897aa8146a6a0819ea5445`.
- `277` selected PNGs decode as RGBA; `245` missing PNGs imported byte for byte.
- The `32` existing PNGs were SHA-256 checked against the archive before imports and checked again afterward. Imports use exclusive creation; existing files are never written.
- Source contains `542` numbered root PNGs; all unselected numbered PNGs and all 18 effect sheets are omitted. No archive scripts or documentation were executed.
- Selected source ranges: `000–009`, `027–041`, `053–076`, `090–110`, `113–118`, `179–218`, `219–228`, `229–289`, `318–356`, `357–366`, `465–502`, `532–534`.

## Reviewed attack boundaries

Startup and recovery hold their listed poses for gameplay timing. Active damage is limited to one successful hit for the entire action. Segments can borrow shared airborne recovery `288–289` or crouching exit `037–041`; those shared frames do not imply a second attack.

| Move key | Source clip | Startup | Active | Recovery | Phase |
|---|---|---|---|---|---|
| palm | 183–187 | 183 | 184–186 | 187 | 1 |
| claw | 188–194 | 188–189 | 190–192 | 193–194 | 1 |
| kick | 195–200 | 195–196 | 197–198 | 199–200 | 1 |
| bladeSweep | 201–209 | 201–202 | 203–206 | 207–209 | 1 |
| thrust | 210–218 | 210–212 | 213–214 | 215–218 | 1 |
| ribbonJab | 229–232 | 229–230 | 231–232 | 037–041 | 1 |
| ribbonSweep | 233–239 | 233–234 | 235–237 | 238–239 | 1 |
| ribbonRise | 240–249 | 240–242 | 243–245 | 246–249 | 1 |
| lunge | 318–324 | 318–319 | 320–321 | 322–324 | 1 |
| uppercut | 325–333 | 325–326 | 327–329 | 330–333 | 1 |
| lowDive | 250–257 | 250–251 | 252–257 | 288–289 | 2 |
| airSpin | 261–267 | 261–263 | 264–266 | 267, 288–289 | 2 |
| airKick | 274–276 | 274 | 275–276 | 288–289 | 2 |
| airClaw | 277–282 | 277–278 | 279–282 | 288–289 | 2 |
| airFlip | 283–287 | 283–284 | 285–287 | 288–289 | 2 |
| drill | 334–340 | 334–338 | 339–340 | 288–289 | 2 |
| heavyDrill | 341–346 | 341–344 | 345–346 | 288–289 | 3 |
| transform | 357–366 | 357–366 | 532–534 loop | 288–289 | 3 |
| dualSweep | 465–473 | 465 | 466–470 | 471–473 | 3 |
| risingLunge | 474–483 | 474–475 | 476–477 | 478–483 | 3 |
| clawFinish | 494–502 | 494–496 | 497–501 | 502 | 3 |
| slash (retained) | 219–228 | 219–220 | 221–224 | 225–228 | 1 |
| stakeFlip (retained) | 347–356 | 347–355 | 356 loop | 288–289 | 2 |
| commandGround | 179–182 | 179 | 180 | 181–182 | 2 |
| commandAir | 258–260 | 258–259 | 260 | 288–289 | 2 |
| burst | 268–273 | 268–270 | 271–272 | 273 | 1 |

The confirmed continuous clips `250–257`, `357–366`, and `494–502` remain single actions. The transformation gesture precedes the separate stake loop; drill weapon contact begins at the silver drill artwork. Retained transformation frames `354–355` belong to startup and must display before the moving stake. Aerial clips use launch/recovery/landing support so a source clip ending in attack posture does not freeze or snap to idle.

## Supporting clips and omissions

| Purpose | Frames |
|---|---|
| Existing idle and guard | 000–009; 109–110 |
| Approach / retreat | 053–060 / 061–068 |
| Jump anticipation / launch | 069–073 / 074–076 |
| Airborne recovery / landing | 288–289 / 090–093 |
| Dash / turning retreat | 094–099 / 100–108 |
| Acrobatic reposition | 484–493 |
| Crouching stance / exit | 027–036 / 037–041 |
| Parry recoil | 113–118 |
| Finisher stake loop | 532–534 |

Other stance variants, redundant locomotion, presentation poses, general reaction sequences, partial-body components, and disappearance fragments are intentionally excluded. Sister sprites come from existing Beatrice assets. Existing warning/materialization effects are reused; no effect sheet import is needed.

## Existing file hashes

These hashes are the read-only baseline captured before asset import. This table is also the retained-file regression fixture.

| File | SHA-256 |
|---|---|
| 00000000.png | 973234aca9dc9efe0d96cda6e7baf79b137cddbaf6db67cf711964ab41bbc139 |
| 00000001.png | ba4188d67413987909d2edbc96a08011be36e5c1c3ff9b11c9d839c3c7b2068d |
| 00000002.png | b7dce8db133ccdfbb0ac6bb838972cf3331d7fa27c4ec227a563cc09a9bf7a0e |
| 00000003.png | 0ae3e3c372e487c68cfa193356f7859d9ed08f7d0576355b09a21b64d1a926c6 |
| 00000004.png | da7eca3f74324b49956295fe928f92a9dfcb5c8a983db1511c6fcb2f8510a87d |
| 00000005.png | 2da60bb6dc81690e6f477568875dfca8ebfb9ae56589c5bf8053ae09fc702f58 |
| 00000006.png | 0d2082a84ee06f677bc90876837a7e208eec1eda985b11e57ecdda4e895ef336 |
| 00000007.png | 107e6f0f9cffc5b7d36751d130b8d529be1b5d6033919f5db5c0e1a57d185dd1 |
| 00000008.png | 7b253816b61c7afb9cf68269f171162303a399995e48f4a188da12ab1522ebd3 |
| 00000009.png | aed12c81319f75aacbf0e279e1919063f7ebc830f6ab80e119f6a3fbd257d998 |
| 00000109.png | 3b859c7ade3481838fee569e6d7f084af7d14981e09d155cce4753c13cf173be |
| 00000110.png | 18511f1e30372e6f64fb6f1a8646e79620dd1786d41230ee6d82b4fad7d55a71 |
| 00000219.png | d92a552cdc479d2db61f6fe0073791c063a81797929662817e9e0a401683d0f2 |
| 00000220.png | 9377a459691ea850c99ce7e6f8e4921e9aeb684a6da38c9636f8003d2451543e |
| 00000221.png | 504a517ab59dd53beffa785d40e7e6f012bd3e67f64891961d62571de00768ff |
| 00000222.png | 554df8421c003303795d7caf93cf2510f308f2214a60151656d5976ce167f680 |
| 00000223.png | b6aa0221a39e8b835abb3709ec018b60cc86a5c189fb2765ea258e7d9198fc8f |
| 00000224.png | 16c05a6200b6b0de518f323c305403f464d8e27b352319858aceebb90ed1fa56 |
| 00000225.png | b052a112685533ecd6bf9d0de194eabd207e60f74283503c503a0a5267b31ef1 |
| 00000226.png | a154df5d611ac6f0a906186e1ccc1121509c8a5e900ff7e31212d97c286b25e9 |
| 00000227.png | 441f650a2006576ee28a6b49c5cd219b3540cbfa1c57a922fab4531fc1101cff |
| 00000228.png | 103f89fa58092d76d5502329bad8927d4e304288506adcc1974ceb28dc03b70b |
| 00000347.png | 53f062dc2f541c775760d4f581135334eb4a0d4b31d45c286ca58b3474ceef4a |
| 00000348.png | cc0efd10a68c319a7947daa881c99bffbb194ea5fdd848d80062512ac794310d |
| 00000349.png | 41db01696be74993eb7be04f6ff0426787c0df867173f5a930c0e842adcaacc2 |
| 00000350.png | f32a9d2c2a7018ac1eaa91475c842b0f41d3d16154f4021ae566dbc651597928 |
| 00000351.png | 33f3b7249ec42baad8ac7d4624ad6131fb9fd81d405d1cbd274e6f97f8d42840 |
| 00000352.png | cc22ce54ba34ef67987c005b56a454fb88b10181b365465466cc3611fe4e91c3 |
| 00000353.png | fec4d58bb70309ee83644558762d5cdf26e17f35c9043c246af1080b1540d4a7 |
| 00000354.png | 32e16014219ab2873563db99e954f47ba417a98b48c6c07b98f339a55c4b315e |
| 00000355.png | 683f6abd4f4a761cefbbe1dd65628b9f28f47780e3134b48008acb91f1ee66e0 |
| 00000356.png | 5c26d3e4c238b83bee78d378efd02c926e65bde1d37786c9e473fa750eaae026 |
