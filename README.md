<img src="https://raw.githubusercontent.com/redpwn/rctf/master/docs/content/assets/rctf-logotype-dark-1024.png" width="350px">

[![Build Status](https://github.com/redpwn/rctf/workflows/CI/badge.svg?branch=master)](https://github.com/redpwn/rctf/actions?query=workflow%3ACI+branch%3Amaster)
[![Code Coverage](https://img.shields.io/codecov/c/github/redpwn/rctf.svg)](https://codecov.io/github/redpwn/rctf/)

rCTF is redpwnCTF's CTF platform, slightly adapted for use by ACM Cyber. It is developed and (used to be) maintained by the [redpwn](https://redpwn.net) CTF team.

## Changes from upstream rctf
- `instancerUrl` config option: set the url to the [challenge instancer](https://github.com/pbrucla/cyber-instancer). Note that the instancer must share the same login secret as rctf for this to work
- Challenges can either use a `{instancer:chall-id}` placeholder format to be replaced with the instancer url from the rctf config and the instancer login token, or use just `{instancer}` which will use the same challenge id on the platform for the instancer.
    - `{instancer_url}` and/or `{instancer_token}` placeholders are also supported if you want to manually construct a link for whatever reason
- Updated to work on node 20 (original rctf is still using node 12!)

## Getting Started

To get started with rCTF, visit the docs at [rctf.redpwn.net](https://rctf.redpwn.net/installation/)

If you need help with rCTF, join the [the redpwnCTF Discord server](https://discord.gg/NkDNEE2) and ask questions in the `#rctf-help` channel.

## Deploying Challenges with rCTF

rCTF itself does not handle challenge deployments.

Optionally, you can use [rCDS](https://github.com/redpwn/rcds) to deploy challenges. It is heavily integrated with rCTF.

## Development

We would love your help! Please see [our CONTRIBUTING.md](CONTRIBUTING.md).
