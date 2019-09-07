# Contributing

We welcome community support with both pull requests and reporting bugs. Please
don't hesitate to jump in.

## Review others' work

Check out the list of outstanding pull requests if there is something you might
be interested in. Maybe somebody is trying to fix that stupid bug that bothers
you. Review the PR. Do you have any better ideas how to fix this problem? Let us
know.

Here is a helpful set of tips for making your own commits: https://robots.thoughtbot.com/5-useful-tips-for-a-better-commit-message 

## Issues

The issue tracker is the preferred channel for bug reports, features requests
and submitting pull requests.

_Note: Occasionally issues are opened that are unclear, or we cannot verify them. When the issue author has not responded to our questions for verification within 7 days then we will close the issue._

## Tests

All commits that fix bugs or add features need appropriate unit tests.

## Code Style

Please adhere to the current code styling. We have included an `.editorconfig`
at the repo's root to facilitate uniformity regardless of your editor. See the
[editor config site][editorconfig] for integration details.

We use [ESLint][eslint] for all JavaScript Linting. There should be no linting
errors and no new warnings for new work. You are welcome to configure your
editor to use ESLint or the `npm test` command will run unit tests and the
linter.



-[editorconfig]: http://editorconfig.org
-[eslint]: http://eslint.org

## Visual Changes

When making a visual change, if at all feasible please provide screenshots
and/or screencasts of the proposed change. This will help us to understand the
desired change easier.

## Docs

Please update the docs with any API changes, the code and docs should always be
in sync.

## Breaking changes

We follow semantic versioning rather strictly.
