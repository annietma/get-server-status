This NextJS project simulates a client library that subscribes to status updates for a job as well as the corresponding job status API.

## Key files

### job status API: app/api/status/route.ts

- The status API has a GET handler that returns `pending`, `error`, or `completed` given a job ID.
- On the first GET request for a particular ID, the server will initialize the job, assign it a randomly generated duration (between 2 to 12 seconds), and return `pending`. On subsequent requests for that ID, the API will return `pending` if the elapsed time since the first request is shorter than the assigned duration, or `completed` if it is longer.
- On any request, there is a manually set 10% chance that the API will return `error`.
- The API has a rate limit of 100 requests per minute.

### server: app/server/redis.ts

- The server keeps track of the times currently active jobs were initialized and their randomly generated durations.
- It also keeps track of how many requests each user (IP address) has made in the past minute.

### client library: app/lib/clientLibrary.ts

- The client library has two exports: `subscribeToStatus` and `useStatus`.
- `subscribeToStatus` repeatedly calls GET /status for a job until that job is completed. It takes the following parameters:
  - `jobId`: the ID of the job to subscribe to
  - `onStatusUpdate`: a function that is called whenever GET /status returns
  - `onCompleted`: a function that is called when the job is completed
  - `options`: an object that allows the user to control the polling behavior. It has the following properties:
    - `initialDelay`: the time in milliseconds to wait before the second poll (default: 1000)
    - `maxDelay`: the maximum time in milliseconds to wait between polls (default: 30000)
    - `maxAttempts`: the maximum number of attempts to poll before giving up (default: 10)
    - `backoffFactor`: the factor by which the delay between polls increases (default: 2)
    - `jitter`: a boolean that determines whether to add jitter to the delay between polls (default: true)
- `useStatus` is a React hook that provides two exports: `statusLogs` and `subscribeToStatusWithHook`.
  - `statusLogs` is an updated array of all status updates for any job since the app mount. Each status update is an object with the following properties:
    - `timestamp`: the time the status was received
    - `jobId`: the ID of the job
    - `status`: the status of the job
  - `subscribeToStatusWithHook` is a wrapper around `subscribeToStatus` that updates the `statusLogs` state with each status update.

### client library usage: app/page.tsx

- An interface that demonstrates how `useStatus` can be used to subscribe to status updates for any job and display them in real-time.

### integration test: tests/integration.spec.ts

- A test that uses [Playwright](https://playwright.dev/) to spin up the server and test `subscribeToStatus`. It will log status updates and test results in the console.

## Usage

How to run:

- Clone the repository
- Run `cd subscribe-to-job-status`
- Run `yarn`
- Run `yarn dev`

How to test:

- In the repository, run `yarn build`
- Run `yarn test`
