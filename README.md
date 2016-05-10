# acq-trello-listener

[![Build Status](https://travis-ci.org/18F/acq-trello-listener.svg?branch=develop)](https://travis-ci.org/18F/acq-trello-listener) [![Code Climate](https://codeclimate.com/github/18F/acq-trello-listener/badges/gpa.svg)](https://codeclimate.com/github/18F/acq-trello-listener) [![Test Coverage](https://codecov.io/gh/18F/acq-trello-listener/branch/develop/graph/badge.svg)](https://codecov.io/gh/18F/acq-trello-listener) [![Dependency Status](https://david-dm.org/18F/acq-trello-listener.svg)](https://david-dm.org/18F/acq-trello-listener)

AcqStack Trello listener server.  Listens to Trello webhook events on the AcqStack intake, BPA, and ATC boards.

## Running

Clone it, run `npm install`.  `npm start` kicks it off.  Needs some environment variables:

Name                      | Description
------------------------- | -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
PORT                      | **REQUIRED** Port to listen for Trello webhook events on.
TRELLO_API_KEY            | **REQUIRED**  Obtained from [Trello](https://trello.com/app-key). Located near the top of that page.
TRELLO_API_TOK            | **REQUIRED** Obtained from [Trello](https://trello.com/app-key). Located near the bottom of that page.
TRELLO_CLIENT_SECRET      | **REQUIRED** Obtained from [Trello](https://trello.com/app-key). There's a link to generate the key at the end of the first paragraph headed "Token."  This is used to verify that webhook requests are actually from Trello (see the "Webhook Signatures" section on the [Trello webhook API documentation](https://developers.trello.com/apis/webhooks)).
TRELLO_INTAKE_BOARD_ID    | **REQUIRED** Board ID for the Intake board
TRELLO_BPA_BOARD_ID       | **REQUIRED** Board ID for the BPA Dashboard
TRELLO_ATC_BOARD_ID       | **REQUIRED** Board ID for the Air Traffic Control board
LOG_LEVEL                 | Log level. See [simple-logger documentation](https://www.npmjs.com/package/@erdc-itl/simple-logger).
HOST, TRELLO_WEBHOOK_HOST | Host where this server is running.  One or the other is required.  If `TRELLO_WEBHOOK_HOST` is set, it will be used.  Otherwise, `HOST` will be used.

## Deploying

For deployment on cloud.gov, expects a custom user-provided service called `acq-trello-cups` in the same org/space.  This service is already up on `18F-acq/tools` with the necessary environment variables.

## Testing

`npm test`

## Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).

> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
