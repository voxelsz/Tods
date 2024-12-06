require("./config")
const {
  jidDecode,
  Browsers,
  makeWASocket,
  DisconnectReason,
  makeInMemoryStore,
  fetchLatestBaileysVersion,
  useMultiFileAuthState
} = require("@whiskeysockets/baileys");

const chalk = require("chalk")
const cfonts = require("cfonts")
const readline = require("readline")
const pino = require("pino")
const fs = require("fs")
const os = require("os")

const { smsg } = require("./lib/smsg")

const Q = (text) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => { rl.question(text, resolve)})
}
const store = makeInMemoryStore({ logger: pino().child({ level: 'fatal'}), stream: 'store' })

cfonts.say("CPS-Bot", {
  font: 'slick',
  align: 'center',
  gradient: ['blue', 'magenta']
})

console.log(chalk.bold("Informasi Sistem\n=========================="))
console.log(chalk.cyan('Platform: ') + os.platform());
console.log(chalk.cyan('OS Type: ') + os.type());
console.log(chalk.cyan('OS Release: ') + os.release());
console.log(chalk.cyan('OS Version: ') + os.version());
console.log(chalk.cyan('CPU Architecture: ') + os.arch());
console.log(chalk.cyan('CPU Cores: ') + os.cpus().length);
console.log(chalk.cyan('Total Memory: ') + (os.totalmem() / (1024 ** 3)).toFixed(2) + ' GB');
console.log(chalk.cyan('Free Memory: ') + (os.freemem() / (1024 ** 3)).toFixed(2) + ' GB');
console.log(chalk.cyan('Uptime: ') + os.uptime() + ' seconds');
console.log(chalk.cyan('Home Directory: ') + os.homedir());
console.log(chalk.cyan('Temporary Directory: ') + os.tmpdir());
console.log(chalk.cyan('Hostname: ') + os.hostname());
console.log()

async function startSock() {
  const { version, isLatest } = await fetchLatestBaileysVersion()
  const { state, saveCreds } = await useMultiFileAuthState("cps-session")
  
  const sock = makeWASocket({
    printQRInTerminal: false,
    browser: Browsers.macOS("Edge"),
    logger: pino({ level: 'fatal' }),
    auth: state,
    version,
    markOnlineOnConnect: true
  })
  
  if(!sock.authState.creds.registered) {
    const nomor = await Q(chalk.green("Nomor Kamu: "))
    let code = await sock.requestPairingCode(nomor)
    
    console.log(chalk.yellow("Kode Kamu: " + code))
  }
  
  sock.ev.on('creds.update', saveCreds)
  sock.public = true
  store.bind(sock.ev)
  
  sock.ev.on("messages.upsert", async (msg) => {
    let m = msg.messages[0]
    if (!m.message) return
    m.message =
    Object.keys(m.message)[0] === "ephemeralMessage"
    ? m.message.ephemeralMessage.message: m.message
    if (m.key && m.key.remoteJid === "status@broadcast") return
    if (!sock.public && !m.key.fromMe && msg.type === "notify")
    return
    if (m.key.id.startsWith("BAE5") && m.key.id.length === 16) return
    m = smsg(sock, m, store)
    require("./cpsbot.js")(sock, m, store)
  })
  
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    
    if(connection === "connecting") {
      console.log(chalk.cyan("[STATUS] >> " + chalk.green("menghubungkan...")))
    } else if(connection === "open") {
      console.log(chalk.cyan("[STATUS] >> " + chalk.green("terhubung!")))
    } else if(connection === "close") {
      console.log(chalk.cyan("[STATUS] >> " + chalk.green("terputus!")))
      startSock()
    }
  })
  
  sock.sendText = (jid, text, quoted = "", options) =>
  sock.sendMessage(jid, {
    text: text, ...options
  }, { quoted })
  
  sock.decodeJid = (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
    let decode = jidDecode(jid) || {}
    return (
      (decode.user && decode.server && decode.user + "@" + decode.server) || jid
      )
    } else return jid
  }
  
  return sock
}

startSock()

let file = require.resolve(__filename)
  fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.cyan("[UPDATE] >> " + chalk.green(`${__filename}`)))
    delete require.cache[file]
    require(file)
  })