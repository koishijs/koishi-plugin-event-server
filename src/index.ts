import { Context, remove, Schema, Service } from 'koishi'
import {} from '@koishijs/plugin-server'

declare module 'koishi' {
  interface Context {
    eventServer: EventServer
  }
}

export const name = 'event-server'

class EventServer extends Service {
  static inject = ['server']

  patterns: RegExp[] = []

  constructor(ctx: Context, config: EventServer.Config) {
    super(ctx, 'eventServer')

    const layer = ctx.server.ws(config.path)

    ctx.on('internal/event', (type, name, args, thisArg) => {
      if (!this.patterns.some(pattern => pattern.test(name))) return
      for (const client of layer.clients) {
        client.send(JSON.stringify({ name, args }))
      }
    })
  }

  register(name: string) {
    return this.ctx.effect(() => {
      const regexp = new RegExp(name.replace(/\*/g, '.*'))
      this.patterns.push(regexp)
      return () => remove(this.patterns, regexp)
    })
  }
}

namespace EventServer {
  export interface Config {
    path: string
  }
  
  export const Config: Schema<Config> = Schema.object({
    path: Schema.string().default('/events'),
  })
}

export default EventServer
