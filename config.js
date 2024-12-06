const fs = require("fs")

global.owner = ["62882005514880"]

let file = require.resolve(__filename)
  fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.cyan("[UPDATE] >> " + chalk.green(`${__filename}`)))
    delete require.cache[file]
    require(file)
  })