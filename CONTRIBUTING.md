# Contributing

When it comes to open source, there are different ways you can contribute, all of which are valuable. Here’s few guidelines that should help you as you prepare your contribution.

## Initial steps

Before you start working on a contribution, create an issue describing what you want to build. It’s possible someone else is already working on something similar, or perhaps there is a reason that feature isn’t implemented. The maintainers will point you in the right direction.

<!-- ## Submitting a Pull Request

- Fork the repo
- Clone your forked repository: `git clone git@github.com:{your_username}/houston.git`
- Enter the directory: `cd houston`
- Create a new branch off the `main` branch: `git checkout -b your-feature-name`
- Implement your contributions (see the Development section for more information)
- Push your branch to the repo: `git push origin your-feature-name`
- Go to https://github.com/mirego/houston/compare and select the branch you just pushed in the "compare:" dropdown
- Submit the PR. The maintainers will follow up. -->

## Development

The following steps will get you setup to contribute changes to this repo:

1. Fork this repo.

2. Clone your forked repo: `git clone git@github.com:{your_username}/houston.git`

3. Run `make dependencies` to install dependencies for the library and the sample app.

4. Start playing with the code! You can do some experimentation with the sample app provided in the `example` folder or start implementing a feature right away.

### Commands

**`make test`**

- Runs all Vitest tests

**`make check-all`**

- Runs linting, format-checking, type-checking

**`make format`**

- Runs formatting on the codebase

### Tests

Houston uses Vitest for testing. After implementing your contribution, write tests for it. Just create a new file under `tests` or add additional tests to the appropriate existing file.

Before submitting your PR, run `make test` to make sure there are no (unintended) breaking changes.

### Documentation

The Houston documentation lives in the README.md. Be sure to document any API changes you implement.

## License

By contributing your code to the Houston GitHub repository, you agree to license your contribution under the BSD 3-Clause license.
