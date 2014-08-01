## v0.7.1

- do not use newer viewmodel version

## v0.7.0

- updated node-queue

## v0.6.1

- send commandRejected event with better reason

## v0.6.0 (BREAKING CHANGES!!!)

- updated eventdenormalier
- introduction of revisionGuard
- contextEventDenormalizer is now eventDenormalizer
- eventMissing notification (for atomic replay)
- eventDenormalizer.replay to replay (from scratch)
- eventDenormalizerBase is now viewBuilderBase
- viewBuilderBase new signature (see documentation or tests)

## v0.5.4

- buffer commands by aggregate id

## v0.5.3

- fix for async business rules

## v0.5.2

- fix commandDispatcher if no commandqueue is used

## v0.5.0

- a complete change of validation rules (see new [rule-validator](https://github.com/adrai/rule-validator))

## v0.4.3

- added disableQueuing flag

## v0.4.2

- strip .js file extensions to enable loading of .coffee scripts too

## v0.4.1

- added forcedQueuing flag

## v0.4.0

- asynchronous api for saga

## v0.3.7

- optimized performance a little

## v0.3.6

- fixed saga handler base
