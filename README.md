## Setup
Clone this repo. Then make sure you get the dependencies, including running `npm i`

## Run
To run, use `npm run start`

To test using gradebot for Project X (where X is 1, 2, or 3), run (while the above command is still running)
`./gradebot projectX`
Note the binary included with this project is for Apple Silicon, other binaries for gradebot can be found at [here](https://github.com/jh125486/CSCE3550/releases)

## Test
Test by `npm run test`. If there is a test failure, it is likely due to a race condition in the test script. Run:
```bash
rm totally_not_my_privateKeys.db
npm run test
```
instead.

If you haven't graded a previous project yet, look to your right. You'll find the release for each project there.