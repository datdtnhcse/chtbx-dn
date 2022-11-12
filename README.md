# CHTBX

A peer to peer chat application.

## Getting started

Run server

```
$ deno task server
```

Run client:

```
$ deno task client
```

The tasks are defined in [deno.json](./deno.json).

## Architecture

```
GUI <---------> client <------------------> server
     websocket          CHTBX protocol/TCP
```
