import pino from 'pino'

const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug'

const logger = pino({
  level,
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
})

export default logger
