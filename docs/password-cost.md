# Choosing a password hashing cost

`CONCORD_PASSWORD_COST` controls scrypt hashing as `N:r:p`.
The current default is `32768:8:3`. Existing credential records retain
their embedded cost parameters and remain verifiable after a configuration
change; choosing a different setting affects newly created password hashes.
Changing this knob does not retroactively make old hashes stronger.

## Measure on the host that will run the API

Run this from the machine/container where Concord will run (Node.js 24+).
Change `N`, `r` and `p` to the proposed setting:

```
node -e 'const {scrypt}=require("node:crypto");
const [N,r,p]=[32768,8,3];
const start=performance.now();
scrypt("benchmark-only-not-a-password",Buffer.alloc(16),32,
  {N,r,p,maxmem:256*N*r},(error)=>{
    if(error) throw error;
    console.log(Math.round(performance.now()-start)+" ms");
  });'
```

Run more than once. A useful *starting* target is around 250–500 ms
for one hash, but choose based on your production CPU, memory, concurrency
and latency budget rather than treating that range as a guarantee.
Concord allows up to two concurrent scrypt jobs and queues the rest.

scrypt's approximate working memory is `128 × N × r` bytes. For `r=8`:

| N | Memory per active hash | Example measured time (p=1) |
| ---: | ---: | ---: |
| 16,384 | 16 MiB | 48 ms |
| 32,768 | 32 MiB | 101 ms |
| 65,536 | 64 MiB | 270 ms |

These times are **illustrative measurements on a single Linux VPS**,
not guaranteed values for other processors. `p` and runtime contention
change timings; the default `p=3` is not represented by the table.

Do not set lower than `16384:8:1` simply to mask a slow host. Review
CPU and RAM saturation during login bursts, then apply a new value in
the environment:

```
CONCORD_PASSWORD_COST=32768:8:3
```

A process restart is required to load a changed environment setting.
Do not log plaintext passwords, salts or derived keys during benchmarking.
See [the security model](./SECURITY-MODEL.md) and [account settings](./CONFIGURATION.md).
