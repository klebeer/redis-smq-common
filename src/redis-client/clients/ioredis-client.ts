import { RedisClient } from '../redis-client';
import {
  Cluster,
  ClusterNode,
  ClusterOptions,
  Redis,
  RedisOptions,
} from 'ioredis';
import { ICallback } from '../../../types';
import { RedisClientError } from '../errors/redis-client.error';
import * as IORedis from 'ioredis';
import { IoredisClientMulti } from './ioredis-client-multi';

export class IoredisClient extends RedisClient {
  protected client: Redis | Cluster;

  constructor(
    config: RedisOptions | ClusterOptions = {},
    startupNodes?: ClusterNode[],
  ) {
    super();
    if (startupNodes && startupNodes.length > 0) {
      this.client = new IORedis.Cluster(startupNodes, config);
    } else {
      this.client = new IORedis(config);
    }
    this.client.once('ready', () => {
      this.connectionClosed = false;
      this.emit('ready');
    });
    this.client.once('end', () => {
      this.connectionClosed = true;
      this.emit('end');
    });
  }

  set(
    key: string,
    value: string,
    options: {
      expire?: { mode: 'EX' | 'PX'; value: number };
      exists?: 'NX' | 'XX';
    },
    cb: ICallback<string | null>,
  ): void {
    if (options.exists && options.expire) {
      this.client.set(
        key,
        value,
        options.expire.mode,
        options.expire.value,
        options.exists,
        cb,
      );
    } else if (options.expire) {
      this.client.set(
        key,
        value,
        options.expire.mode,
        options.expire.value,
        cb,
      );
    } else if (options.exists) {
      this.client.set(key, value, options.exists, cb);
    } else {
      this.client.set(key, value, cb);
    }
  }

  zadd(
    key: string,
    score: number,
    member: string,
    cb: ICallback<number | string>,
  ): void {
    this.client.zadd(key, score, member, cb);
  }

  multi(): IoredisClientMulti {
    return new IoredisClientMulti(this.client);
  }

  watch(args: string[], cb: ICallback<string>): void {
    this.client.watch(args, cb);
  }

  unwatch(cb: ICallback<string>): void {
    this.client.unwatch(cb);
  }

  sismember(key: string, member: string, cb: ICallback<number>): void {
    this.client.sismember(key, member, cb);
  }

  sscan(
    key: string,
    options: { MATCH?: string; COUNT?: number },
    cb: ICallback<string[]>,
  ): void {
    const result = new Set<string>();
    const iterate = (position: string) => {
      const args: [string, string] = [key, position];
      if (options.MATCH) args.push('MATCH', options.MATCH);
      if (options.COUNT) args.push('COUNT', String(options.COUNT));
      this.client.sscan(...args, (err, [cursor, items]) => {
        if (err) cb(err);
        else {
          items.forEach((i) => result.add(i));
          if (cursor === '0') cb(null, [...result]);
          else iterate(cursor);
        }
      });
    };
    iterate('0');
  }

  zcard(key: string, cb: ICallback<number>): void {
    this.client.zcard(key, cb);
  }

  zrange(key: string, min: number, max: number, cb: ICallback<string[]>): void {
    this.client.zrange(key, min, max, cb);
  }

  psubscribe(pattern: string): void {
    this.client.psubscribe(pattern);
  }

  punsubscribe(channel: string): void {
    this.client.punsubscribe(channel);
  }

  subscribe(channel: string): void {
    this.client.subscribe(channel);
  }

  unsubscribe(channel: string): void {
    this.client.unsubscribe(channel);
  }

  zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
    cb: ICallback<string[]>,
  ): void {
    this.client.zrangebyscore(key, min, max, cb);
  }

  smembers(key: string, cb: ICallback<string[]>): void {
    this.client.smembers(key, cb);
  }

  sadd(key: string, member: string, cb: ICallback<number>): void {
    this.client.sadd(key, member, cb);
  }

  srem(key: string, member: string, cb: ICallback<number>): void {
    this.client.srem(key, member, cb);
  }

  hgetall(key: string, cb: ICallback<Record<string, string>>): void {
    this.client.hgetall(key, cb);
  }

  hget(key: string, field: string, cb: ICallback<string | null>): void {
    this.client.hget(key, field, cb);
  }

  hset(key: string, field: string, value: string, cb: ICallback<number>): void {
    this.client.hset(key, field, value, cb);
  }

  hdel(key: string, fields: string | string[], cb: ICallback<number>): void {
    this.client.hdel(key, fields, cb);
  }

  lrange(
    key: string,
    start: number,
    stop: number,
    cb: ICallback<string[]>,
  ): void {
    this.client.lrange(key, start, stop, cb);
  }

  hkeys(key: string, cb: ICallback<string[]>): void {
    this.client.hkeys(key, cb);
  }

  hlen(key: string, cb: ICallback<number>): void {
    this.client.hlen(key, cb);
  }

  brpoplpush(
    source: string,
    destination: string,
    timeout: number,
    cb: ICallback<string | null>,
  ): void {
    this.client.brpoplpush(source, destination, timeout, cb);
  }

  rpoplpush(
    source: string,
    destination: string,
    cb: ICallback<string | null>,
  ): void {
    this.client.rpoplpush(source, destination, cb);
  }

  zrangebyscorewithscores(
    source: string,
    min: number,
    max: number,
    cb: ICallback<Record<string, string>>,
  ): void {
    this.client.zrangebyscore(source, min, max, 'WITHSCORES', (err, reply) => {
      if (err) cb(err);
      else {
        const replyRange = reply ?? [];
        const range: Record<string, string> = {};
        for (
          let slice = replyRange.splice(0, 2);
          slice.length > 0;
          slice = replyRange.splice(0, 2)
        ) {
          const [member, score] = slice;
          range[score] = member;
        }
        cb(null, range);
      }
    });
  }

  rpop(key: string, cb: ICallback<string | null>): void {
    this.client.rpop(key, cb);
  }

  lrem(
    key: string,
    count: number,
    element: string,
    cb: ICallback<number>,
  ): void {
    this.client.lrem(key, count, element, cb);
  }

  publish(channel: string, message: string, cb: ICallback<number>): void {
    this.client.publish(channel, message, cb);
  }

  flushall(cb: ICallback<string>): void {
    this.client.flushall(cb);
  }

  loadScript(script: string, cb: ICallback<string>): void {
    // type-coverage:ignore-next-line
    this.client.script('load', script, cb);
  }

  evalsha(
    hash: string,
    args: (string | number)[] | string | number,
    cb: (err?: Error | null, res?: unknown) => void,
  ): void {
    const arrHash: (string | number)[] = [hash];
    const arrArgs = Array.isArray(args) ? args : [args];
    // type-coverage:ignore-next-line
    this.client.evalsha(arrHash.concat(arrArgs), cb);
  }

  get(key: string, cb: ICallback<string | null>): void {
    this.client.get(key, cb);
  }

  del(key: string | string[], cb: ICallback<number>): void {
    this.client.del(key, cb);
  }

  llen(key: string, cb: ICallback<number>): void {
    this.client.llen(key, cb);
  }

  lmove(
    source: string,
    destination: string,
    from: 'LEFT' | 'RIGHT',
    to: 'LEFT' | 'RIGHT',
    cb: ICallback<string | null>,
  ): void {
    if (!this.validateRedisVersion(6, 2)) {
      cb(
        new RedisClientError(
          'Command not supported by your Redis server. Minimal required Redis server version is 6.2.0.',
        ),
      );
    } else {
      this.client.lmove(source, destination, from, to, cb);
    }
  }

  zremrangebyscore(
    source: string,
    min: number | string,
    max: number | string,
    cb: ICallback<number>,
  ): void {
    this.client.zremrangebyscore(source, min, max, cb);
  }

  hmget(
    source: string,
    keys: string[],
    cb: ICallback<(string | null)[]>,
  ): void {
    this.client.hmget(source, keys, cb);
  }

  halt(cb: ICallback<void>): void {
    if (!this.connectionClosed) {
      this.client.once('end', cb);
      this.end(true);
    } else cb();
  }

  end(flush: boolean): void {
    if (!this.connectionClosed) {
      this.client.disconnect(false);
    }
  }

  quit(cb: ICallback<void> = () => void 0): void {
    if (!this.connectionClosed) {
      this.client.once('end', cb);
      this.client.quit();
    } else cb();
  }

  getInfo(cb: ICallback<string>): void {
    this.client.info(cb);
  }

  override on(event: string, listener: (...args: unknown[]) => any): this {
    this.client.on(event, listener);
    return this;
  }
}
