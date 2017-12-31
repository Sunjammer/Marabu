const {app, BrowserWindow, webFrame, Menu} = require('electron')
const path = require('path')
const url = require('url')
const shell = require('electron').shell

let ui

app.on('ready', () => 
{
  ui = new BrowserWindow({width: 900, height: 540, backgroundColor:"#000", minWidth: 900, minHeight: 540, frame:false, autoHideMenuBar: true, icon: __dirname + '/icon.ico'})

  ui.loadURL(`file://${__dirname}/sources/index.html`)

  let is_shown = true

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'File', submenu: [
        { label: 'Inspector', accelerator: 'CmdOrCtrl+.', click: () => { ui.webContents.openDevTools(); }},
        { label: 'Guide', accelerator: 'CmdOrCtrl+,', click: () => { shell.openExternal('https://github.com/hundredrabbits/Marabu'); }},
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => { force_quit=true; app.exit(); }}
      ]
    },
    { label: 'Window', submenu : [
        { label: 'Hide', accelerator: 'CmdOrCtrl+H',click: () => { if(is_shown){ ui.hide(); } else{ ui.show(); }}},
        { label: 'Minimize', accelerator: 'CmdOrCtrl+M',click: () => { ui.minimize(); }},
        { label: 'Fullscreen', accelerator: 'CmdOrCtrl+Enter',click: () => { ui.setFullScreen(ui.isFullScreen() ? false : true); }}
      ]
    }
  ]));

  ui.on('closed', () => {
    ui = null
    app.quit()
  })

  ui.on('hide',() => {
    is_shown = false
  })

  ui.on('show',() => {
    is_shown = true
  })
})

app.on('window-all-closed', () => 
{
  app.quit()
})

app.on('activate', () => {
  if (ui === null) {
    createWindow()
  }
})