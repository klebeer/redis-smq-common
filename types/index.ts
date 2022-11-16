import { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';
import { Callback, ClientOpts } from 'redis';
import * as Logger from 'bunyan';
import { RedisClientMultiCommandType } from '@redis/client/dist/lib/client/multi-command';
import {
  RedisClientOptions,
  RedisClientType,
  RedisFunctions,
  RedisModules,
  RedisScripts,
} from '@redis/client';

export interface IORedisConfig {
  client: RedisClientName.IOREDIS;
  options?: RedisOptions | ClusterOptions;
  startupNodes?: ClusterNode[];
}

export enum RedisClientName {
  REDIS = 'redis',
  IOREDIS = 'ioredis',
  REDIS_V4 = 'redis_v4',
}

export interface INodeRedisConfig {
  client: RedisClientName.REDIS;
  options?: ClientOpts;
}

export interface INodeRedisV4Config {
  client: RedisClientName.REDIS_V4;
  options?: RedisClientOptions;
}

export type TRedisConfig =
  | IORedisConfig
  | INodeRedisConfig
  | INodeRedisV4Config;

export type TNodeRedisV4Multi = RedisClientMultiCommandType<
  RedisModules,
  RedisFunctions,
  RedisScripts
>;

export type TNodeRedisV4Client = RedisClientType<
  RedisModules,
  RedisFunctions,
  RedisScripts
>;

export interface IRedisClientMulti {
  lrem(key: string, count: number, element: string): this;

  lpop(key: string): this;

  rpush(key: string, element: string): this;

  rpop(key: string): this;

  lpush(key: string, element: string): this;

  hdel(key: string, field: string | string[]): this;

  hincrby(key: string, field: string, by: number): this;

  del(key: string | string[]): this;

  srem(key: string, element: string | string[]): this;

  sadd(key: string, element: string): this;

  zrem(key: string, element: string | string[]): this;

  zadd(key: string, score: number, element: string): this;

  hset(key: string, field: string, value: string): this;

  pexpire(key: string, millis: number): this;

  expire(key: string, secs: number): this;

  ltrim(key: string, start: number, stop: number): this;

  rpoplpush(source: string, destination: string): this;

  exec(cb: ICallback<unknown[]>): void;
}

declare module 'redis' {
  export interface Commands<R> {
    // Overwrite bad declaration from @types/redis
    info(cb?: Callback<string>): R;
    info(section?: string | string[], cb?: Callback<string>): R;
    INFO(cb?: Callback<string>): R;
    INFO(section?: string | string[], cb?: Callback<string>): R;

    // Add missing method
    lmove(
      source: string,
      destination: string,
      from: 'LEFT' | 'RIGHT',
      to: 'LEFT' | 'RIGHT',
      cb: ICallback<string>,
    ): void;
  }
}

declare module 'ioredis' {
  export interface Commands {
    // Add missing method
    lmove(
      source: string,
      destination: string,
      from: 'LEFT' | 'RIGHT',
      to: 'LEFT' | 'RIGHT',
      cb: ICallback<string>,
    ): void;
  }
}

export interface ICallback<T> {
  (err?: Error | null, reply?: T): void;
  (err: undefined | null, reply: T): void;
}

export type TFunction<TReturn = void, TArgs = any> = (
  ...args: TArgs[]
) => TReturn;

export type TUnaryFunction<T, E = void> = (reply: T) => E;

export interface ICompatibleLogger {
  info(message: unknown, ...params: unknown[]): void;
  warn(message: unknown, ...params: unknown[]): void;
  error(message: unknown, ...params: unknown[]): void;
  debug(message: unknown, ...params: unknown[]): void;
}

export type TLoggerConfig = {
  enabled: boolean;
  options?: Partial<Logger.LoggerOptions>;
};
