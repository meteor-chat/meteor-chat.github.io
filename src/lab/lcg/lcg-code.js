export const LCG_CODE_SAMPLES = {
    python: {
        language: "Python",
        code: `class LCG:
    def __init__(self, seed, a=1664525, c=1013904223, m=2**32):
        self.state = seed
        self.a = a
        self.c = c
        self.m = m

    def next(self):
        self.state = (self.a * self.state + self.c) % self.m
        return self.state

    def next_float(self):
        return self.next() / self.m`
    },
    javascript: {
        language: "JavaScript",
        code: `class LCG {
    constructor(seed, a = 1664525, c = 1013904223, m = 4294967296) {
        this.state = BigInt(seed);
        this.a = BigInt(a);
        this.c = BigInt(c);
        this.m = BigInt(m);
    }

    next() {
        this.state = (this.a * this.state + this.c) % this.m;
        return Number(this.state);
    }

    nextFloat() {
        return this.next() / Number(this.m);
    }
}`
    },
    c: {
        language: "C",
        code: `typedef struct {
    unsigned long long state;
    unsigned long long a;
    unsigned long long c;
    unsigned long long m;
} LCG;

void lcg_init(LCG *rng, unsigned long long seed, unsigned long long a, unsigned long long c, unsigned long long m) {
    rng->state = seed;
    rng->a = a;
    rng->c = c;
    rng->m = m;
}

unsigned long long lcg_next(LCG *rng) {
    rng->state = (rng->a * rng->state + rng->c) % rng->m;
    return rng->state;
}`
    },
    cpp: {
        language: "C++",
        code: `class LCG {
private:
    unsigned long long state;
    unsigned long long a;
    unsigned long long c;
    unsigned long long m;

public:
    LCG(unsigned long long seed, unsigned long long a = 1664525, unsigned long long c = 1013904223, unsigned long long m = 4294967296ULL)
        : state(seed), a(a), c(c), m(m) {}

    unsigned long long next() {
        state = (a * state + c) % m;
        return state;
    }

    double nextDouble() {
        return (double)next() / (double)m;
    }
};`
    },
    java: {
        language: "Java",
        code: `public class LCG {
    private long state;
    private final long a;
    private final long c;
    private final long m;

    public LCG(long seed, long a, long c, long m) {
        this.state = seed;
        this.a = a;
        this.c = c;
        this.m = m;
    }

    public long next() {
        this.state = (this.a * this.state + this.c) % this.m;
        return this.state;
    }

    public double nextDouble() {
        return (double) next() / (double) this.m;
    }
}`
    },
    golang: {
        language: "Golang",
        code: `type LCG struct {
    state uint64
    a     uint64
    c     uint64
    m     uint64
}

func NewLCG(seed, a, c, m uint64) *LCG {
    return &LCG{state: seed, a: a, c: c, m: m}
}

func (rng *LCG) Next() uint64 {
    rng.state = (rng.a*rng.state + rng.c) % rng.m
    return rng.state
}

func (rng *LCG) NextFloat() float64 {
    return float64(rng.Next()) / float64(rng.m)
}`
    }
};
