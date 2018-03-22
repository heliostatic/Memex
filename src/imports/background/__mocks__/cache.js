import { mapToObject } from 'src/util/map-set-helpers'

export default class Cache {
    static DAY_IN_MS = 1000 * 60 * 60 * 24
    static INIT_ESTS = {
        calculatedAt: 0,
        completed: { b: 0, h: 0 },
        remaining: { b: 0, h: 0 },
    }

    chunks = []
    errChunks = []

    calculatedAt = 0

    constructor({ initEsts = Cache.INIT_ESTS }) {
        this.counts = {
            completed: { ...initEsts.completed },
            remaining: { ...initEsts.remaining },
        }
    }

    get expired() {
        return this.calculatedAt < Date.now() - Cache.DAY_IN_MS
    }

    set expired(value) {
        if (value === true) {
            this.calculatedAt = 0
        }
    }

    async persistItems(data) {
        this.chunks.push(mapToObject(data))
        return data.size
    }

    async persistEsts(ests) {
        this.calculatedAt = Date.now()

        this.counts = { ...ests }
    }

    async *getItems(includeErrs = false) {
        for (const chunkKey in this.chunks) {
            yield { chunkKey, chunk: this.chunks[chunkKey] }
        }

        if (includeErrs) {
            for (const chunkKey in this.errChunks) {
                yield { chunkKey, chunk: this.errChunks[chunkKey] }
            }
        }
    }

    async removeItem(chunkKey, itemKey) {
        const { [itemKey]: toRemove, ...remaining } = this.chunks[chunkKey]
        this.chunks[chunkKey] = remaining
        return toRemove
    }

    async flagItemAsError(itemKey, item) {}

    async clear() {
        this.expired = true
        this.chunks = []
        this.errChunks = []
    }
}