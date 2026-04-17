'use strict'

const log = (loglevel, data) => console.log(JSON.stringify({ loglevel, data }))

module.exports = {
  access: (data) => log('access', data),
  apilog: (data) => log('apilog', data),
}
